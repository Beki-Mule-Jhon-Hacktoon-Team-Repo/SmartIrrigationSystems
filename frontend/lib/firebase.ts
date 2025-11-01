import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";

// const firebaseConfig = {
//   apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
//   authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
//   projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
//   appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
// }

const firebaseConfig = {
  apiKey: "AIzaSyC3sBhAYdP7Kh5dsk06ao1PP6EWmEHYexs",
  authDomain: "smart-irrigation-system-eba31.firebaseapp.com",
  databaseURL:
    "https://smart-irrigation-system-eba31-default-rtdb.firebaseio.com",
  projectId: "smart-irrigation-system-eba31",
  storageBucket: "smart-irrigation-system-eba31.firebasestorage.app",
  messagingSenderId: "27541323707",
  appId: "1:27541323707:web:e943f863eb18e078de0e9e",
  measurementId: "G-HBXHLMRMJ3",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export {
  app,
  auth,
  provider,
  signInWithPopup,
  firebaseSignOut,
  onAuthStateChanged,
};
