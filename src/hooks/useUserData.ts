import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { UserData, PriceLine } from '../types';
import { useAuth } from './useAuth';

export const useUserData = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setUserData(null);
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setUserData(docSnap.data() as UserData);
        } else {
          // Create initial user document
          const initialData: UserData = {
            uid: user.uid,
            email: user.email || '',
            priceLines: [],
            preferences: {
              theme: 'light',
              defaultSymbol: 'AAPL'
            }
          };
          await setDoc(docRef, initialData);
          setUserData(initialData);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const addPriceLine = async (priceLine: Omit<PriceLine, 'id'>) => {
    if (!user) return;

    const newLine: PriceLine = {
      ...priceLine,
      id: `line-${Date.now()}`
    };

    const updatedLines = [...(userData?.priceLines || []), newLine];

    try {
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, { priceLines: updatedLines });
      setUserData(prev => prev ? { ...prev, priceLines: updatedLines } : null);
    } catch (error) {
      console.error('Error adding price line:', error);
    }
  };

  const removePriceLine = async (lineId: string) => {
    if (!user) return;

    const updatedLines = userData?.priceLines.filter(line => line.id !== lineId) || [];

    try {
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, { priceLines: updatedLines });
      setUserData(prev => prev ? { ...prev, priceLines: updatedLines } : null);
    } catch (error) {
      console.error('Error removing price line:', error);
    }
  };

  const updatePriceLine = async (lineId: string, updates: Partial<PriceLine>) => {
    if (!user) return;

    const updatedLines = userData?.priceLines.map(line =>
      line.id === lineId ? { ...line, ...updates } : line
    ) || [];

    try {
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, { priceLines: updatedLines });
      setUserData(prev => prev ? { ...prev, priceLines: updatedLines } : null);
    } catch (error) {
      console.error('Error updating price line:', error);
    }
  };

  return {
    userData,
    loading,
    addPriceLine,
    removePriceLine,
    updatePriceLine
  };
};
