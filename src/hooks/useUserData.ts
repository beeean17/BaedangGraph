import { useEffect, useState, useCallback } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { PriceLine } from '../types';
import { useAuth } from './useAuth';

export const useUserData = () => {
  const { user } = useAuth();
  const [priceLines, setPriceLines] = useState<PriceLine[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPriceLines = useCallback(async () => {
    if (!user) {
      setPriceLines([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const linesCollectionRef = collection(db, 'users', user.uid, 'lines');
      const q = query(linesCollectionRef, orderBy('price'));
      const querySnapshot = await getDocs(q);
      const lines = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<PriceLine, 'id'>),
      }));
      setPriceLines(lines);
    } catch (error) {
      console.error('Error fetching price lines:', error);
      setPriceLines([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPriceLines();
  }, [fetchPriceLines]);

  const addPriceLine = async (priceLine: Omit<PriceLine, 'id'>) => {
    if (!user) return;

    try {
      const linesCollectionRef = collection(db, 'users', user.uid, 'lines');
      const docRef = await addDoc(linesCollectionRef, priceLine);
      // Optimistically update UI
      setPriceLines(prev => [...prev, { ...priceLine, id: docRef.id }]);
    } catch (error) {
      console.error('Error adding price line:', error);
    }
  };

  const removePriceLine = async (lineId: string) => {
    if (!user) return;

    try {
      const lineDocRef = doc(db, 'users', user.uid, 'lines', lineId);
      await deleteDoc(lineDocRef);
      // Optimistically update UI
      setPriceLines(prev => prev.filter(line => line.id !== lineId));
    } catch (error) {
      console.error('Error removing price line:', error);
    }
  };

  const updatePriceLine = async (lineId: string, updates: Partial<Omit<PriceLine, 'id'>>) => {
    if (!user) return;

    try {
      const lineDocRef = doc(db, 'users', user.uid, 'lines', lineId);
      await updateDoc(lineDocRef, updates);
      // Optimistically update UI
      setPriceLines(prev =>
        prev.map(line =>
          line.id === lineId ? { ...line, ...updates } : line
        )
      );
    } catch (error) {
      console.error('Error updating price line:', error);
    }
  };

  return {
    priceLines,
    loading,
    addPriceLine,
    removePriceLine,
    updatePriceLine,
  };
};
