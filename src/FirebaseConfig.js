import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
const firebaseConfig = {
  apiKey: "AIzaSyDnOik2NSL_6KAprEUb_7Gqd3fH1pEEpOo",
  authDomain: "clms-70ed9.firebaseapp.com",
  databaseURL: "https://clms-70ed9-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "clms-70ed9",
  storageBucket: "clms-70ed9.firebasestorage.app",
  messagingSenderId: "102331632140",
  appId: "1:102331632140:web:adb14e48207e52c5a67c29",
  measurementId: "G-DEQV5SHES5"
};
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export default app;