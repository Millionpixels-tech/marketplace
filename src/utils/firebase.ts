import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDQWvX8J5BG-QK4Rgk06ioYG7rllEE1uJY",
  authDomain: "marketplace-bd270.firebaseapp.com",
  projectId: "marketplace-bd270",
  storageBucket: "gs://marketplace-bd270.firebasestorage.app",
  messagingSenderId: "308553460725",
  appId: "1:308553460725:web:e2a63b079c2f4d0b48cebc",
  measurementId: "G-YNBS2T66R8"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
