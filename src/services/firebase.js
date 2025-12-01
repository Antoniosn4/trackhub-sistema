import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDr6OV1l-UyrK0cTjlWE0QZq_8B10qmapE",
    authDomain: "trackhub-13337.firebaseapp.com",
    projectId: "trackhub-13337",
    storageBucket: "trackhub-13337.firebasestorage.app",
    messagingSenderId: "1022402346972",
    appId: "1:1022402346972:web:4a02f8ae4e615ae86f1919"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);