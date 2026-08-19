import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: 'studio-7730470427-456f3',
  appId: '1:613435843753:web:90134d276d9290adad75b8',
  storageBucket: 'studio-7730470427-456f3.firebasestorage.app',
  apiKey: 'AIzaSyBaGoJyKK7x5RYYGiVXWid4oQYks67jPzE',
  authDomain: 'studio-7730470427-456f3.firebaseapp.com',
  messagingSenderId: '613435843753',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
