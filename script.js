const STATUSES = ["red", "yellow", "green"];
const TITLES = ["Still gotta get to it", "Working on it", "Got it"];
const STORAGE_KEY = "cubing-algos-progress-v1";

const statusElements = Array.from(document.querySelectorAll(".status"));
const spinner = document.querySelector(".spinner");
const progress = document.querySelector(".progress h1");

const getStatus = (element) =>
	STATUSES.find((status) => element.classList.contains(status)) || STATUSES[0];

const getNextStatus = (status) =>
	STATUSES[(STATUSES.indexOf(status) + 1) % STATUSES.length];

const saveStatuses = () => {
	const statuses = statusElements.map(getStatus);
	localStorage.setItem(STORAGE_KEY, JSON.stringify(statuses));
};

const updateProgress = () => {
	const complete = statusElements.filter(
		(element) => getStatus(element) === "green"
	).length;
	progress.textContent = `${complete}/${statusElements.length}`;
};

const setStatus = (element, status) => {
	STATUSES.forEach((value) => element.classList.remove(value));
	element.classList.add(status);
	element.title = TITLES[STATUSES.indexOf(status)];
	element.setAttribute("aria-label", `Learning status: ${element.title}`);
};

const loadStatuses = () => {
	try {
		const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
		if (
			Array.isArray(stored) &&
			stored.length === statusElements.length &&
			stored.every((status) => STATUSES.includes(status))
		) {
			stored.forEach((status, index) => setStatus(statusElements[index], status));
		}
	} catch (error) {
		console.warn("Saved progress could not be loaded; using the page defaults.", error);
	}

	statusElements.forEach((element) => setStatus(element, getStatus(element)));
	updateProgress();
	spinner.classList.add("finish");
};

const advanceStatus = (element) => {
	setStatus(element, getNextStatus(getStatus(element)));
	saveStatuses();
	updateProgress();
};

statusElements.forEach((element) => {
	element.tabIndex = 0;
	element.setAttribute("role", "button");
	element.addEventListener("click", () => advanceStatus(element));
	element.addEventListener("keydown", (event) => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			advanceStatus(element);
		}
	});
});

loadStatuses();
