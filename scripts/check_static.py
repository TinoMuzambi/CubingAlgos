#!/usr/bin/env python3
"""Dependency-free validation for this static site."""

from __future__ import annotations

import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
VOID_ELEMENTS = {
    "area", "base", "br", "col", "embed", "hr", "img", "input", "link",
    "meta", "param", "source", "track", "wbr",
}
URL_ATTRIBUTES = {"href", "src"}
ASSET_PATTERN = re.compile(
    r"""(?P<quote>["'])(?P<path>(?:\.\.?/|/)[^"'?#]+\.(?:css|gif|ico|jpe?g|js|png|svg|webp))(?P=quote)""",
    re.IGNORECASE,
)
CSS_URL_PATTERN = re.compile(
    r"""url\(\s*["']?(?P<path>[^"'\)]+)["']?\s*\)""", re.IGNORECASE
)


class SiteParser(HTMLParser):
    def __init__(self, source: Path) -> None:
        super().__init__(convert_charrefs=True)
        self.source = source
        self.stack: list[str] = []
        self.ids: set[str] = set()
        self.errors: list[str] = []
        self.has_doctype = False
        self.has_lang = False
        self.has_charset = False
        self.has_viewport = False
        self.title_count = 0
        self.main_count = 0

    def handle_decl(self, declaration: str) -> None:
        if declaration.lower() == "doctype html":
            self.has_doctype = True

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self._inspect_tag(tag.lower(), attrs, push=False)

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag = tag.lower()
        self._inspect_tag(tag, attrs, push=tag not in VOID_ELEMENTS)

    def _inspect_tag(
        self, tag: str, attrs: list[tuple[str, str | None]], *, push: bool
    ) -> None:
        attributes = {name.lower(): value for name, value in attrs}
        element_id = attributes.get("id")
        if element_id:
            if element_id in self.ids:
                self.errors.append(f"duplicate id #{element_id}")
            self.ids.add(element_id)

        if tag == "html" and attributes.get("lang"):
            self.has_lang = True
        elif tag == "meta":
            if "charset" in attributes:
                self.has_charset = True
            if attributes.get("name", "").lower() == "viewport":
                self.has_viewport = True
        elif tag == "title":
            self.title_count += 1
        elif tag == "main":
            self.main_count += 1
        elif tag == "img" and "alt" not in attributes:
            self.errors.append("image is missing an alt attribute")

        if attributes.get("target", "").lower() == "_blank":
            rel = set((attributes.get("rel") or "").lower().split())
            if not {"noopener", "noreferrer"}.issubset(rel):
                self.errors.append(
                    'target="_blank" link must use rel="noopener noreferrer"'
                )

        for attribute in URL_ATTRIBUTES:
            if attribute in attributes:
                validate_reference(
                    attributes[attribute] or "",
                    self.source.parent,
                    f"{self.source.relative_to(ROOT)} {tag}[{attribute}]",
                    self.errors,
                )
        if push:
            self.stack.append(tag)

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag in VOID_ELEMENTS:
            return
        if not self.stack:
            self.errors.append(f"unexpected closing </{tag}>")
            return
        expected = self.stack.pop()
        if tag != expected:
            self.errors.append(f"closing </{tag}> does not match <{expected}>")

    def finish(self) -> list[str]:
        if self.stack:
            self.errors.append(f"unclosed element(s): {', '.join(self.stack)}")
        if not self.has_doctype:
            self.errors.append("missing <!doctype html>")
        if not self.has_lang:
            self.errors.append("html element is missing lang")
        if not self.has_charset:
            self.errors.append("missing charset metadata")
        if not self.has_viewport:
            self.errors.append("missing viewport metadata")
        if self.title_count != 1:
            self.errors.append(f"expected one title element, found {self.title_count}")
        if self.main_count != 1:
            self.errors.append(f"expected one main element, found {self.main_count}")
        return self.errors


def validate_reference(
    raw_reference: str, base: Path, context: str, errors: list[str]
) -> None:
    reference = raw_reference.strip()
    if not reference:
        errors.append(f"{context}: empty reference")
        return
    if reference.startswith(("#", "mailto:", "tel:", "data:")):
        return
    if reference.startswith("//"):
        errors.append(f"{context}: protocol-relative URL is not allowed: {reference}")
        return
    parsed = urlsplit(reference)
    if parsed.scheme:
        if parsed.scheme != "https":
            errors.append(f"{context}: external URL must use HTTPS: {reference}")
        return

    relative_path = unquote(parsed.path)
    if not relative_path:
        return
    candidate = (
        ROOT / relative_path.lstrip("/")
        if relative_path.startswith("/")
        else base / relative_path
    )
    if relative_path.endswith("/"):
        candidate /= "index.html"
    resolved = candidate.resolve()
    if not resolved.is_relative_to(ROOT) or not resolved.exists():
        errors.append(f"{context}: missing local target {reference}")


def main() -> int:
    failures: list[str] = []
    html_files = sorted(ROOT.rglob("*.html"))
    if not html_files:
        failures.append("no HTML files found")
    for html_file in html_files:
        parser = SiteParser(html_file)
        try:
            parser.feed(html_file.read_text(encoding="utf-8"))
            parser.close()
        except (OSError, UnicodeError) as error:
            failures.append(f"{html_file.relative_to(ROOT)}: {error}")
            continue
        failures.extend(
            f"{html_file.relative_to(ROOT)}: {error}" for error in parser.finish()
        )

    for source in [*ROOT.rglob("*.js"), *ROOT.rglob("*.css")]:
        try:
            text = source.read_text(encoding="utf-8")
        except (OSError, UnicodeError) as error:
            failures.append(f"{source.relative_to(ROOT)}: {error}")
            continue
        patterns = [ASSET_PATTERN]
        if source.suffix == ".css":
            patterns.append(CSS_URL_PATTERN)
        for pattern in patterns:
            for match in pattern.finditer(text):
                validate_reference(
                    match.group("path"),
                    source.parent,
                    str(source.relative_to(ROOT)),
                    failures,
                )

    if failures:
        print("\n".join(f"ERROR: {failure}" for failure in failures), file=sys.stderr)
        return 1
    print(
        f"Validated {len(html_files)} HTML file(s), local asset references, "
        "and document metadata."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
