import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, // This one is correct
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, // Make sure this variable is set
  databaseURL: process.env.NEXT_PUBLIC_DATABASE_URL, // Notice: your env variable is NEXT_PUBLIC_DATABASE_URL
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID, // Updated: use NEXT_PUBLIC_PROJECT_ID instead of NEXT_PUBLIC_FIREBASE_PROJECT_ID
  storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET, // Should match your env variable
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_MEASUREMENT_ID,
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

export { db, auth, googleProvider, analytics };
