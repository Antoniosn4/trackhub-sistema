import { useState, useEffect } from 'react';
import { collection, addDoc, query, onSnapshot, orderBy, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

export const useInventory = (user, addToast) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // Busca dados em tempo real
    useEffect(() => {
        if (!user) {
            const timer = setTimeout(() => setLoading(false), 2000);
            return () => clearTimeout(timer);
        }

        // Caminho exato dos seus dados
        const q = query(
            collection(db, 'artifacts', 'default-app-id', 'public', 'data', 'trackhub_inventory'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        }, (error) => {
            console.error(error);
            setLoading(false);
            if (addToast) addToast('Erro ao carregar estoque.', 'error');
        });

        return () => unsubscribe();
    }, [user, addToast]);

    // Adicionar Item
    const addItem = async (itemData) => {
        if (!user) return;
        try {
            await addDoc(collection(db, 'artifacts', 'default-app-id', 'public', 'data', 'trackhub_inventory'), {
                ...itemData,
                createdAt: serverTimestamp(),
                userId: user.uid
            });
            if (addToast) addToast('Produto salvo!', 'success');
        } catch (error) {
            if (addToast) addToast('Erro ao salvar.', 'error');
        }
    };

    // Deletar Item
    const deleteItem = async (id) => {
        if (!user) return;
        try {
            await deleteDoc(doc(db, 'artifacts', 'default-app-id', 'public', 'data', 'trackhub_inventory', id));
            if (addToast) addToast('Item excluído.', 'success');
        } catch (error) {
            if (addToast) addToast('Erro ao excluir.', 'error');
        }
    };

    return { items, loading, addItem, deleteItem };
};