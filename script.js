const STATUSES = ["green", "yellow", "red"];

const statusEls = document.querySelectorAll(".status");

statusEls.forEach((statusEl) => {
	statusEl.addEventListener("click", () => {
		const currStatus = statusEl.classList.value.split(" ")[1];
		statusEl.classList = `status ${getNext(currStatus)}`;
	});
});

const getNext = (status) => {
	if (status === "red") {
		return "green";
	}
	return STATUSES[STATUSES.indexOf(status) + 1];
};
