// ============================================================
// FIREBASE CONFIG - shared by every page in this project
// Replace the values below with the config from YOUR new
// Firebase project (Project Settings > General > Your apps > SDK setup)
// ============================================================
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

// Enable offline persistence so the menu stays browsable without a connection
// and queued writes (orders) sync automatically once back online.
db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
  console.warn("Offline persistence not enabled:", err.code);
});
