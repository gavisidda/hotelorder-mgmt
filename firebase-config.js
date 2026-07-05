// ============================================================
// FIREBASE CONFIG - shared by every page in this project
// Replace the values below with the config from YOUR new
// Firebase project (Project Settings > General > Your apps > SDK setup)
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyBGQjsTN1OZSyCzkeFOUo5cm6P8OmCD0II",
  authDomain: "projects-gavi.firebaseapp.com",
  projectId: "projects-gavi",
  storageBucket: "projects-gavi.firebasestorage.app",
  messagingSenderId: "181348674237",
  appId: "1:181348674237:web:f55ffc58fb8a748b7825d4"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

// Enable offline persistence so the menu stays browsable without a connection
// and queued writes (orders) sync automatically once back online.
db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
  console.warn("Offline persistence not enabled:", err.code);
});
