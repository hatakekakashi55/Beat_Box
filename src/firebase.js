/**
 * Firebase Configuration for BeatBox
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCgeEda3Irn6gCUcReltghjYt6XUSZHdJQ",
  authDomain: "beatbox-7c447.firebaseapp.com",
  projectId: "beatbox-7c447",
  storageBucket: "beatbox-7c447.firebasestorage.app",
  messagingSenderId: "604791915141",
  appId: "1:604791915141:web:0d74e2f546f6a58ed31fec",
  measurementId: "G-QCXXRK7G3J"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export { serverTimestamp };
export default app;
