import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export interface Saloon {
  id: number;
  ownerId: number;
  name: string;
  ownerName: string;
  phone: string;
  address: string;
  city: string;
  description: string | null;
  services: string[];
  openTime: string;
  closeTime: string;
  isOpen: boolean;
  slotDuration: number;
}

export interface SlotWithStatus {
  id: number;
  saloonId: number;
  date: string;
  time: string;
  isBlocked: boolean;
  status: "available" | "booked" | "pending" | "blocked" | "past";
}

export interface Booking {
  id: number;
  saloonId: number;
  slotId: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  service: string;
  status: "pending" | "accepted" | "rejected" | "completed" | "cancelled";
  createdAt: string;
  slot?: { id: number; date: string; time: string };
  saloon?: Saloon;
}

interface AppContextType {
  saloons: Saloon[];
  mySaloon: Saloon | null;
  loadSaloons: () => Promise<void>;
  loadMySaloon: () => Promise<void>;
  getSaloonSlots: (saloonId: number, date: string) => Promise<SlotWithStatus[]>;
  createBooking: (data: { saloonId: number; slotId: number; customerName: string; customerPhone: string; service: string }) => Promise<Booking>;
  getMyBookings: () => Promise<Booking[]>;
  getSaloonBookings: () => Promise<Booking[]>;
  respondToBooking: (bookingId: number, status: "accepted" | "rejected") => Promise<void>;
  cancelBooking: (bookingId: number) => Promise<void>;
  registerSaloon: (data: any) => Promise<Saloon>;
  updateSaloon: (saloonId: number, data: any) => Promise<Saloon>;
  toggleSaloonOpen: (saloonId: number) => Promise<Saloon>;
  generateSlots: (saloonId: number) => Promise<void>;
  toggleSlotBlock: (saloonId: number, slotId: number) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth();
  const [saloons, setSaloons] = useState<Saloon[]>([]);
  const [mySaloon, setMySaloon] = useState<Saloon | null>(null);

  useEffect(() => {
    loadSaloons();
  }, []);

  useEffect(() => {
    if (token && user?.role === "owner") {
      loadMySaloon();
    } else {
      setMySaloon(null);
    }
  }, [token, user]);

  const loadSaloons = useCallback(async () => {
    try {
      const data = await api.get<Saloon[]>("/saloons");
      setSaloons(data);
    } catch {}
  }, []);

  const loadMySaloon = useCallback(async () => {
    if (!token || !user) return;
    try {
      const data = await api.get<Saloon[]>("/saloons", token);
      const mine = data.find((s) => s.ownerId === user.id) ?? null;
      setMySaloon(mine);
      setSaloons(data);
    } catch {}
  }, [token, user]);

  const getSaloonSlots = async (saloonId: number, date: string): Promise<SlotWithStatus[]> => {
    const data = await api.get<SlotWithStatus[]>(`/saloons/${saloonId}/slots?date=${date}`);
    return data;
  };

  const createBooking = async (data: {
    saloonId: number; slotId: number; customerName: string; customerPhone: string; service: string;
  }): Promise<Booking> => {
    return api.post<Booking>("/bookings", data, token);
  };

  const getMyBookings = async (): Promise<Booking[]> => {
    return api.get<Booking[]>("/bookings/my", token);
  };

  const getSaloonBookings = async (): Promise<Booking[]> => {
    if (!mySaloon) return [];
    return api.get<Booking[]>(`/saloons/${mySaloon.id}/bookings`, token);
  };

  const respondToBooking = async (bookingId: number, status: "accepted" | "rejected") => {
    await api.patch(`/bookings/${bookingId}/respond`, { status }, token);
  };

  const cancelBooking = async (bookingId: number) => {
    await api.patch(`/bookings/${bookingId}/cancel`, {}, token);
  };

  const registerSaloon = async (data: any): Promise<Saloon> => {
    const saloon = await api.post<Saloon>("/saloons", data, token);
    setMySaloon(saloon);
    await loadSaloons();
    return saloon;
  };

  const updateSaloon = async (saloonId: number, data: any): Promise<Saloon> => {
    const saloon = await api.put<Saloon>(`/saloons/${saloonId}`, data, token);
    setMySaloon(saloon);
    await loadSaloons();
    return saloon;
  };

  const toggleSaloonOpen = async (saloonId: number): Promise<Saloon> => {
    const saloon = await api.patch<Saloon>(`/saloons/${saloonId}/toggle-open`, {}, token);
    setMySaloon(saloon);
    setSaloons((prev) => prev.map((s) => s.id === saloonId ? saloon : s));
    return saloon;
  };

  const generateSlots = async (saloonId: number) => {
    await api.post(`/saloons/${saloonId}/slots/generate`, {}, token);
  };

  const toggleSlotBlock = async (saloonId: number, slotId: number) => {
    await api.patch(`/saloons/${saloonId}/slots/${slotId}/block`, {}, token);
  };

  return (
    <AppContext.Provider value={{
      saloons, mySaloon,
      loadSaloons, loadMySaloon,
      getSaloonSlots, createBooking, getMyBookings, getSaloonBookings,
      respondToBooking, cancelBooking,
      registerSaloon, updateSaloon, toggleSaloonOpen, generateSlots, toggleSlotBlock,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
