import { useState, useEffect } from 'react';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';

export const useAuth = () => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const initAuth = async () => {
            try {
                await signInAnonymously(auth);
            } catch (e) {
                console.error("Erro auth:", e);
            }
        };
        initAuth();
        return onAuthStateChanged(auth, setUser);
    }, []);

    return user;
};