import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAI3lHtDJH8G1HqzWKY_CAUK5LDo2vCuyo",
  authDomain: "sumbongph-16b96.firebaseapp.com",
  projectId: "sumbongph-16b96",
  storageBucket: "sumbongph-16b96.firebasestorage.app",
  messagingSenderId: "755521865681",
  appId: "1:755521865681:web:80a7a603a10adc5c21c2f0",
  measurementId: "G-2C5LMKFCFR"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);