const STATUSES = ["red", "yellow", "green"];
const TITLES = ["Still gotta get to it", "Working on it", "Got it"];

const statusEls = document.querySelectorAll(".status");

statusEls.forEach((statusEl, i) => {
	// Add click event listener pn divs for changing statuses.
	statusEl.addEventListener("click", () => {
		const currStatus = statusEl.classList.value.split(" ")[1];
		statusEl.classList = `status ${getNext(currStatus)}`;
		// Save to LS on click.
		saveToLS();
	});
});

// Get next status, wrapping around after green.
const getNext = (status) => {
	if (status === "green") {
		return "red";
	}
	return STATUSES[STATUSES.indexOf(status) + 1];
};

// Save current statuses to local storage.
const saveToLS = () => {
	let saveStatuses = [];
	// Get status based on classlist.
	statusEls.forEach((statusEl) => {
		saveStatuses.push(statusEl.classList.value.split(" ")[1]);
	});
	localStorage.setItem("cubing-statuses", JSON.stringify(saveStatuses));
	// Call get to update UI.
	getFromLS();
};

// Get current statuses from local storage.
const getFromLS = () => {
	let saveStatuses = JSON.parse(localStorage.getItem("cubing-statuses"));
	// Set classlist based on status.
	statusEls.forEach((statusEl, i) => {
		statusEl.classList = `status ${saveStatuses[i]}`;
		statusEl.title = TITLES[STATUSES.indexOf(saveStatuses[i])];
	});
};

// Get current statuses from local storage when page loads.
getFromLS();
