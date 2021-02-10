const STATUSES = ["green", "yellow", "red"];

const statusEl = document.querySelector(".status");

statusEl.addEventListener("click", () => {
	const currStatus = statusEl.classList.split()[1];
	console.log(currStatus);
});

const getNext = (status) => {
	if (status === "red") {
		return "green";
	}
	return STATUSES[STATUSES.indexOf(status) + 1];
};
