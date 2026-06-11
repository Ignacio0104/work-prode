import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const isDevelopment = process.env.NODE_ENV === "development";

const firebaseConfig = {
  apiKey: "AIzaSyACuhQYqiwVrFraODP5lw3bCjGh4-5Cexk",
  authDomain: "prode-opsheet.firebaseapp.com",
  projectId: "prode-opsheet",
  storageBucket: "prode-opsheet.firebasestorage.app",
  messagingSenderId: "993276090230",
  appId: "1:993276090230:web:e5282885a826562e0c8c57",
};

// Prevent duplicate initialization during hot reloads
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
