// import { initializeApp } from "firebase/app";
// import { getAuth } from "firebase/auth";
// import { getFirestore } from "firebase/firestore";

// // REPLACE THIS with your actual Firebase config object
// const firebaseConfig = {

// };


// // Initialize Firebase
// const app = initializeApp(firebaseConfig);

// // Export Auth and Firestore instances for use throughout the app
// export const auth = getAuth(app);
// export const db = getFirestore(app);


import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// 1. Swap getFirestore for initializeFirestore
import { getFirestore, initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCJ6rO2ZgN9bmEWIzJ0mrAtAkr-TJNhU04",
  authDomain: "dssa-trivia.firebaseapp.com",
  projectId: "dssa-trivia",
  storageBucket: "dssa-trivia.firebasestorage.app",
  messagingSenderId: "476469556579",
  appId: "1:476469556579:web:77ea09b1a5aa94f9db4f56",
  measurementId: "G-VGLWGWBKT3"};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// 2. Force Firestore to use long-polling instead of WebSockets
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true 
});