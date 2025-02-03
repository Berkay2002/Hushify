import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDho9HKuDth2f-f6FAnJYLRFRUjlUV3wnM",
  authDomain: "hushify-ef283.firebaseapp.com",
  projectId: "hushify-ef283",
  storageBucket: "hushify-ef283.firebasestorage.app",
  messagingSenderId: "932163722885",
  appId: "1:932163722885:web:68a08230c1d09c889bd3ec",
  measurementId: "G-WQJ9VVDN13"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

export { db, auth, googleProvider, analytics, app };
