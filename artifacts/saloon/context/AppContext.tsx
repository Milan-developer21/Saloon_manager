import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import React, { createContext, useContext, useEffect, useState } from "react";

export type UserRole = "customer" | "owner" | null;

export interface Saloon {
  id: string;
  ownerDeviceId: string;
  name: string;
  ownerName: string;
  phone: string;
  address: string;
  city: string;
  description: string;
  services: string[];
  openTime: string;
  closeTime: string;
  isOpen: boolean;
  slotDuration: number;
  registeredAt: string;
}

export interface TimeSlot {
  id: string;
  saloonId: string;
  date: string;
  time: string;
  isBlocked: boolean;
}

export interface Booking {
  id: string;
  saloonId: string;
  saloonName: string;
  customerName: string;
  customerPhone: string;
  slotId: string;
  date: string;
  time: string;
  service: string;
  status: "pending" | "accepted" | "rejected" | "completed" | "cancelled";
  createdAt: string;
  deviceId: string;
}

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  deviceId: string;
  saloons: Saloon[];
  slots: TimeSlot[];
  bookings: Booking[];
  mySaloon: Saloon | null;
  registerSaloon: (data: Omit<Saloon, "id" | "ownerDeviceId" | "registeredAt" | "isOpen">) => void;
  updateSaloon: (updates: Partial<Saloon>) => void;
  generateSlots: (saloonId: string, openTime: string, closeTime: string, duration: number) => void;
  toggleSlotBlock: (slotId: string) => void;
  createBooking: (booking: Omit<Booking, "id" | "createdAt" | "status">) => Promise<void>;
  respondToBooking: (bookingId: string, response: "accepted" | "rejected") => Promise<void>;
  cancelBooking: (bookingId: string) => void;
  getSaloonSlots: (saloonId: string, date: string) => TimeSlot[];
  getBookingsForSlot: (slotId: string) => Booking[];
  isSlotBooked: (slotId: string) => boolean;
}

const AppContext = createContext<AppContextType | null>(null);

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function getDateStr(offsetDays: number) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split("T")[0];
}

function generateSlotsForDay(
  saloonId: string,
  date: string,
  openTime: string,
  closeTime: string,
  duration: number
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const [openH, openM] = openTime.split(":").map(Number);
  const [closeH, closeM] = closeTime.split(":").map(Number);
  let currentMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  while (currentMinutes + duration <= closeMinutes) {
    const h = Math.floor(currentMinutes / 60);
    const m = currentMinutes % 60;
    const time = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    slots.push({
      id: `${saloonId}-${date}-${time}`,
      saloonId,
      date,
      time,
      isBlocked: false,
    });
    currentMinutes += duration;
  }
  return slots;
}

const SAMPLE_SALOONS: Saloon[] = [
  {
    id: "sample-1",
    ownerDeviceId: "sample",
    name: "Sharma Hair Studio",
    ownerName: "Ramesh Sharma",
    phone: "98765-43210",
    address: "12, Main Bazaar Road, Chandni Chowk",
    city: "Delhi",
    description: "Premium haircuts and grooming for men. Expert barbers with 15+ years experience. Traditional shaves available.",
    services: ["Haircut", "Shave", "Hair Color", "Beard Trim", "Head Massage"],
    openTime: "09:00",
    closeTime: "21:00",
    isOpen: true,
    slotDuration: 30,
    registeredAt: "2024-01-01",
  },
  {
    id: "sample-2",
    ownerDeviceId: "sample",
    name: "Royal Barbers",
    ownerName: "Vijay Kumar",
    phone: "87654-32109",
    address: "45, Station Road, Dadar",
    city: "Mumbai",
    description: "Family salon with all hair and beauty services. AC facility, clean environment.",
    services: ["Haircut", "Facial", "Threading", "Waxing", "Hair Spa"],
    openTime: "10:00",
    closeTime: "20:00",
    isOpen: true,
    slotDuration: 30,
    registeredAt: "2024-01-05",
  },
  {
    id: "sample-3",
    ownerDeviceId: "sample",
    name: "Balaji Hair Salon",
    ownerName: "Suresh Balaji",
    phone: "76543-21098",
    address: "7, Temple Street, T. Nagar",
    city: "Chennai",
    description: "Traditional and modern haircuts. Specialising in South Indian hair care and treatments.",
    services: ["Haircut", "Head Massage", "Hair Coloring", "Shave", "Facial"],
    openTime: "08:00",
    closeTime: "19:00",
    isOpen: false,
    slotDuration: 30,
    registeredAt: "2024-01-10",
  },
  {
    id: "sample-4",
    ownerDeviceId: "sample",
    name: "Gupta Gents Parlour",
    ownerName: "Anil Gupta",
    phone: "65432-10987",
    address: "88, MG Road, Koramangala",
    city: "Bangalore",
    description: "Affordable gents salon. Walk-ins welcome. Experienced staff.",
    services: ["Haircut", "Shave", "Hair Wash", "Beard Styling"],
    openTime: "09:30",
    closeTime: "20:30",
    isOpen: true,
    slotDuration: 30,
    registeredAt: "2024-01-15",
  },
];

async function setupNotifications() {
  if (Platform.OS === "web") return;
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status === "granted") {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    }
  } catch {}
}

async function scheduleLocalNotification(title: string, body: string, seconds = 1) {
  if (Platform.OS === "web") return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: seconds <= 1 ? null : { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds, repeats: false },
    });
  } catch {}
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>(null);
  const [deviceId, setDeviceId] = useState("");
  const [saloons, setSaloons] = useState<Saloon[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    init();
    setupNotifications();
  }, []);

  const init = async () => {
    try {
      let id = await AsyncStorage.getItem("deviceId");
      if (!id) {
        id = genId();
        await AsyncStorage.setItem("deviceId", id);
      }
      setDeviceId(id);

      const savedRole = await AsyncStorage.getItem("userRole");
      if (savedRole === "customer" || savedRole === "owner") setRoleState(savedRole);

      const savedSaloons = await AsyncStorage.getItem("saloons");
      const savedSlots = await AsyncStorage.getItem("slots");
      const savedBookings = await AsyncStorage.getItem("bookings");

      const saloonsData = savedSaloons ? JSON.parse(savedSaloons) : SAMPLE_SALOONS;
      const slotsData = savedSlots ? JSON.parse(savedSlots) : [];
      const bookingsData = savedBookings ? JSON.parse(savedBookings) : [];

      setSaloons(saloonsData);
      setSlots(slotsData);
      setBookings(bookingsData);

      // Ensure sample saloons always have slots
      if (!savedSlots || JSON.parse(savedSlots).length === 0) {
        const generatedSlots: TimeSlot[] = [];
        for (const s of SAMPLE_SALOONS) {
          for (let i = 0; i < 7; i++) {
            generatedSlots.push(...generateSlotsForDay(s.id, getDateStr(i), s.openTime, s.closeTime, s.slotDuration));
          }
        }
        setSlots(generatedSlots);
        await AsyncStorage.setItem("slots", JSON.stringify(generatedSlots));
      }
    } catch {}
  };

  const setRole = async (r: UserRole) => {
    setRoleState(r);
    if (r) await AsyncStorage.setItem("userRole", r);
    else await AsyncStorage.removeItem("userRole");
  };

  const saveSaloons = async (data: Saloon[]) => {
    setSaloons(data);
    await AsyncStorage.setItem("saloons", JSON.stringify(data));
  };

  const saveSlots = async (data: TimeSlot[]) => {
    setSlots(data);
    await AsyncStorage.setItem("slots", JSON.stringify(data));
  };

  const saveBookings = async (data: Booking[]) => {
    setBookings(data);
    await AsyncStorage.setItem("bookings", JSON.stringify(data));
  };

  const mySaloon = saloons.find((s) => s.ownerDeviceId === deviceId) ?? null;

  const registerSaloon = async (data: Omit<Saloon, "id" | "ownerDeviceId" | "registeredAt" | "isOpen">) => {
    const existing = saloons.find((s) => s.ownerDeviceId === deviceId);
    if (existing) {
      const updated = saloons.map((s) =>
        s.ownerDeviceId === deviceId ? { ...s, ...data } : s
      );
      await saveSaloons(updated);
    } else {
      const newSaloon: Saloon = {
        ...data,
        id: genId(),
        ownerDeviceId: deviceId,
        isOpen: true,
        registeredAt: new Date().toISOString().split("T")[0],
      };
      const updated = [...saloons, newSaloon];
      await saveSaloons(updated);
      // Auto-generate slots for next 7 days
      const newSlots: TimeSlot[] = [];
      for (let i = 0; i < 7; i++) {
        newSlots.push(...generateSlotsForDay(newSaloon.id, getDateStr(i), data.openTime, data.closeTime, data.slotDuration));
      }
      await saveSlots([...slots, ...newSlots]);
    }
  };

  const updateSaloon = async (updates: Partial<Saloon>) => {
    const updated = saloons.map((s) =>
      s.ownerDeviceId === deviceId ? { ...s, ...updates } : s
    );
    await saveSaloons(updated);
  };

  const generateSlots = async (saloonId: string, openTime: string, closeTime: string, duration: number) => {
    const filtered = slots.filter((s) => s.saloonId !== saloonId);
    const newSlots: TimeSlot[] = [];
    for (let i = 0; i < 7; i++) {
      newSlots.push(...generateSlotsForDay(saloonId, getDateStr(i), openTime, closeTime, duration));
    }
    await saveSlots([...filtered, ...newSlots]);
  };

  const toggleSlotBlock = async (slotId: string) => {
    const updated = slots.map((s) => s.id === slotId ? { ...s, isBlocked: !s.isBlocked } : s);
    await saveSlots(updated);
  };

  const createBooking = async (booking: Omit<Booking, "id" | "createdAt" | "status">) => {
    const newBooking: Booking = {
      ...booking,
      id: genId(),
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    const updated = [...bookings, newBooking];
    await saveBookings(updated);

    // Notify owner (local notification simulating push to owner)
    await scheduleLocalNotification(
      "New Booking Request / नई बुकिंग अनुरोध",
      `${booking.customerName} has requested a slot at ${booking.time} on ${booking.date} (${booking.service})`
    );
  };

  const respondToBooking = async (bookingId: string, response: "accepted" | "rejected") => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    let updated = bookings.map((b) => {
      if (b.id === bookingId) return { ...b, status: response };
      // If accepted, reject other pending bookings for same slot
      if (response === "accepted" && b.slotId === booking.slotId && b.status === "pending" && b.id !== bookingId) {
        return { ...b, status: "rejected" as const };
      }
      return b;
    });
    await saveBookings(updated);

    if (response === "accepted") {
      // Notify customer of acceptance
      await scheduleLocalNotification(
        "Booking Confirmed! / बुकिंग पक्की! 🎉",
        `Your appointment at ${booking.saloonName} is confirmed for ${booking.date} at ${booking.time}`
      );

      // Schedule 10-minute reminder
      const apptDate = new Date(`${booking.date}T${booking.time}:00`);
      const reminderTime = new Date(apptDate.getTime() - 10 * 60 * 1000);
      const secondsUntilReminder = Math.max(1, (reminderTime.getTime() - Date.now()) / 1000);

      if (secondsUntilReminder > 60) {
        await scheduleLocalNotification(
          "Appointment in 10 min! / 10 मिनट में अपॉइंटमेंट!",
          `Your appointment at ${booking.saloonName} is in 10 minutes`,
          secondsUntilReminder
        );
      }
    } else {
      await scheduleLocalNotification(
        "Booking Update / बुकिंग अपडेट",
        `Your slot request at ${booking.saloonName} was not accepted. Please choose another slot.`
      );
    }
  };

  const cancelBooking = async (bookingId: string) => {
    const updated = bookings.map((b) => b.id === bookingId ? { ...b, status: "cancelled" as const } : b);
    await saveBookings(updated);
  };

  const getSaloonSlots = (saloonId: string, date: string): TimeSlot[] => {
    return slots
      .filter((s) => s.saloonId === saloonId && s.date === date)
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  const getBookingsForSlot = (slotId: string): Booking[] => {
    return bookings.filter((b) => b.slotId === slotId);
  };

  const isSlotBooked = (slotId: string): boolean => {
    return bookings.some((b) => b.slotId === slotId && b.status === "accepted");
  };

  return (
    <AppContext.Provider
      value={{
        role, setRole, deviceId,
        saloons, slots, bookings, mySaloon,
        registerSaloon, updateSaloon, generateSlots,
        toggleSlotBlock, createBooking, respondToBooking, cancelBooking,
        getSaloonSlots, getBookingsForSlot, isSlotBooked,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
