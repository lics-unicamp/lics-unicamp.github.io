// js/firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAgjBYC6mm6cxmUwsLy5KF9Py7KgvguulM",
  authDomain: "lics-dashboard.firebaseapp.com",
  projectId: "lics-dashboard",
  storageBucket: "lics-dashboard.firebasestorage.app",
  messagingSenderId: "397833913665",
  appId: "1:397833913665:web:15cb97092b23c959668dc0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// We don't use 'hd' because the admin (lics.unicamp@gmail.com) is not @dac.unicamp.br
// Domain validation is done server-side by Firestore Security Rules

export { auth, db, provider };
