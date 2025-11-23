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
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any | null>(null);

  // Placeholder booking state (keep same shape as before if repo uses them)
  const [tripData, setTripData] = useState<any | null>(null);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);

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