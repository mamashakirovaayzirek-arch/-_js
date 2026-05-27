import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCb2jBoKj7deK8JHc_caDC4NZ53_Y6-Fms",
  authDomain: "oshmenu.firebaseapp.com",
  projectId: "oshmenu",
  storageBucket: "oshmenu.firebasestorage.app",
  messagingSenderId: "967836805360",
  appId: "1:967836805360:web:087be21b9f8ef10cf4ba35"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);