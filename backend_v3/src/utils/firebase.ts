// src/utils/firebase.ts
import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; 


const firebaseConfig = {
 apiKey: "AIzaSyDJPSLRMB1qE5pxCwu-ESTOZEYFmIXbozY",
  authDomain: "olive-1fcca.firebaseapp.com",
  projectId: "olive-1fcca",
  storageBucket: "olive-1fcca.firebasestorage.app",
  messagingSenderId: "824433699617",
  appId: "1:824433699617:web:b0135c149cc53b7ffbac60",
  measurementId: "G-1GVJH2VY1P"
};


const app = initializeApp(firebaseConfig);


export const storage = getStorage(app); // 
export const db = getFirestore(app); //
export const auth = getAuth(app); // 