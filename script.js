const STATUSES = ["red", "yellow", "green"];
const TITLES = ["Still gotta get to it", "Working on it", "Got it"];

// Your web app's Firebase configuration
const firebaseConfig = {
	apiKey: "AIzaSyBZzYFYsjJ6B5KJDvgtIY2pGswOkl_q0qM",
	authDomain: "cubingalgos.firebaseapp.com",
	projectId: "cubingalgos",
	storageBucket: "cubingalgos.appspot.com",
	messagingSenderId: "38468774650",
	appId: "1:38468774650:web:4aa0b84fcea425df0b3743",
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

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
const getFromLS = async () => {
	let saveStatuses = JSON.parse(localStorage.getItem("cubing-statuses"));
	// Set classlist based on status.
	statusEls.forEach((statusEl, i) => {
		statusEl.classList = `status ${saveStatuses[i]}`;
		statusEl.title = TITLES[STATUSES.indexOf(saveStatuses[i])];
	});
	let dbStatuses;
	const snapshot = await db.collection("statuses").get();
	snapshot.forEach((doc) => {
		console.log(doc.data().statuses);
	});
};

// Get current statuses from local storage when page loads.
getFromLS();
