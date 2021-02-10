const STATUSES = ["green", "yellow", "red"];

const statusEls = document.querySelectorAll(".status");

statusEls.forEach((statusEl) => {
	statusEl.addEventListener("click", () => {
		const currStatus = statusEl.classList.value.split(" ")[1];
		statusEl.classList = `status ${getNext(currStatus)}`;
		saveToLS();
	});
});

const getNext = (status) => {
	if (status === "red") {
		return "green";
	}
	return STATUSES[STATUSES.indexOf(status) + 1];
};

const saveToLS = () => {
	let saveStatuses = [];
	statusEls.forEach((statusEl) => {
		saveStatuses.push(statusEl.classList.value.split(" ")[1]);
	});
	localStorage.setItem("cubing-statuses", JSON.stringify(saveStatuses));
};
