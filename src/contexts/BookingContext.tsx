import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type BookingContextType = {
  isAuthenticated: boolean;
  setIsAuthenticated: (v: boolean) => void;
  user: any | null;
  signOut: () => Promise<void>;
  // keep existing booking-related state placeholders (you can extend these)
  tripData?: any;
  setTripData?: (d: any) => void;
  selectedItems?: any[];
  setSelectedItems?: (d: any[]) => void;
  removeItem?: (id: string) => void;
  clearSelection?: () => void;
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any | null>(null);

  // Initialize from localStorage
  const [tripData, setTripData] = useState<any | null>(() => {
    try {
      const saved = localStorage.getItem('tripData');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  
  const [selectedItems, setSelectedItems] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('selectedItems');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persist tripData to localStorage when it changes
  useEffect(() => {
    if (tripData) {
      localStorage.setItem('tripData', JSON.stringify(tripData));
    } else {
      localStorage.removeItem('tripData');
    }
  }, [tripData]);

  // Persist selectedItems to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('selectedItems', JSON.stringify(selectedItems));
  }, [selectedItems]);

  useEffect(() => {
    // Initialize session on mount
    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session;
        if (session?.user) {
          setUser(session.user);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Error getting initial session:', err);
        setUser(null);
        setIsAuthenticated(false);
      }
    };

    init();

    // Subscribe to auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    });

    return () => {
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const removeItem = (id: string) => {
    setSelectedItems(selectedItems.filter(item => item.id !== id));
  };

  const clearSelection = () => {
    setSelectedItems([]);
    setTripData(null);
  };

  return (
    <BookingContext.Provider
      value={{
        isAuthenticated,
        setIsAuthenticated,
        user,
        signOut,
        tripData,
        setTripData,
        selectedItems,
        setSelectedItems,
        removeItem,
        clearSelection,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const ctx = useContext(BookingContext);
  if (!ctx) {
    throw new Error('useBooking must be used within BookingProvider');
  }
  return ctx;
};
