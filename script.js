const STATUSES = ["red", "yellow", "green"];
const TITLES = ["Still gotta get to it", "Working on it", "Got it"];
let loading = true;

// Firebase config
const firebaseConfig = {
	apiKey: "AIzaSyBZzYFYsjJ6B5KJDvgtIY2pGswOkl_q0qM",
	authDomain: "cubingalgos.firebaseapp.com",
	projectId: "cubingalgos",
	storageBucket: "cubingalgos.appspot.com",
	messagingSenderId: "38468774650",
	appId: "1:38468774650:web:4aa0b84fcea425df0b3743",
};

// Initialise Firebase
firebase.initializeApp(firebaseConfig);

// Initialise firestore.
const db = firebase.firestore();

// Get elements
const statusEls = document.querySelectorAll(".status");
const spinner = document.querySelector(".spinner");

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
const saveToLS = async () => {
	let saveStatuses = [];
	// Get status based on classlist.
	statusEls.forEach((statusEl) => {
		saveStatuses.push(statusEl.classList.value.split(" ")[1]);
	});
	localStorage.setItem("cubing-statuses", JSON.stringify(saveStatuses));
	const statusesRef = db.collection("statuses").doc("q6UaTNEWbgTTFfcQUXiN");

	await statusesRef.set({
		statuses: saveStatuses,
	});

	// Call get to update UI.
	getFromLS();
};

// Get current statuses from local storage.
const getFromLS = async () => {
	let dbStatuses;
	// Get statuses from db.
	const snapshot = await db.collection("statuses").get();
	snapshot.forEach((doc) => {
		dbStatuses = doc.data().statuses;
	});
	// Set classlist based on status.
	statusEls.forEach((statusEl, i) => {
		statusEl.classList = `status ${dbStatuses[i]}`;
		statusEl.title = TITLES[STATUSES.indexOf(dbStatuses[i])];
	});
	// Get rid of spinner once data is loaded.
	spinner.classList.add("finish");
};

// Get current statuses from local storage when page loads.
getFromLS();
