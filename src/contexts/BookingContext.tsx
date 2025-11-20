import React, { createContext, useContext, useState } from 'react';
import { TripFormData } from '@/components/TripPlannerForm';

export interface OptionItem {
  id: string;
  name: string;
  price: number;
  description: string;
  rating: number;
  type: 'accommodation' | 'food' | 'transport';
}

interface BookingContextType {
  tripData: TripFormData | null;
  setTripData: (data: TripFormData) => void;
  selectedItems: OptionItem[];
  addItem: (item: OptionItem) => void;
  removeItem: (itemId: string) => void;
  clearSelection: () => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tripData, setTripData] = useState<TripFormData | null>(null);
  const [selectedItems, setSelectedItems] = useState<OptionItem[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const addItem = (item: OptionItem) => {
    setSelectedItems(prev => {
      // Remove existing item of same type before adding new one
      const filtered = prev.filter(i => i.type !== item.type);
      return [...filtered, item];
    });
  };

  const removeItem = (itemId: string) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
  };

  const clearSelection = () => {
    setSelectedItems([]);
  };

  return (
    <BookingContext.Provider
      value={{
        tripData,
        setTripData,
        selectedItems,
        addItem,
        removeItem,
        clearSelection,
        isAuthenticated,
        setIsAuthenticated,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};
