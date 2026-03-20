import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyB0wr1nu6Vkbx6lnycjrZjLRc54G6ndVnk",
  authDomain: "kaka-plant-app.firebaseapp.com",
  projectId: "kaka-plant-app",
  storageBucket: "kaka-plant-app.firebasestorage.app",
  messagingSenderId: "896874236864",
  appId: "1:896874236864:web:623afb4ac884915c8d1625",
  measurementId: "G-8L2Z54M4K5"
};

export const firebaseApp = initializeApp(firebaseConfig);

export let firebaseAnalytics = null;

if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      firebaseAnalytics = getAnalytics(firebaseApp);
    }
  });
}
