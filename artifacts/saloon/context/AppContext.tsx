import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  category: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  createdAt: string;
  totalVisits: number;
}

export interface Appointment {
  id: string;
  customerId: string;
  customerName: string;
  serviceId: string;
  serviceName: string;
  date: string;
  time: string;
  duration: number;
  price: number;
  status: "scheduled" | "completed" | "cancelled" | "no-show";
  notes: string;
}

interface AppContextType {
  customers: Customer[];
  appointments: Appointment[];
  services: Service[];
  addCustomer: (customer: Omit<Customer, "id" | "createdAt" | "totalVisits">) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  addAppointment: (appointment: Omit<Appointment, "id">) => void;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  addService: (service: Omit<Service, "id">) => void;
  updateService: (id: string, updates: Partial<Service>) => void;
  deleteService: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const DEFAULT_SERVICES: Service[] = [
  { id: "s1", name: "Haircut", duration: 30, price: 25, category: "Hair" },
  { id: "s2", name: "Shave", duration: 20, price: 15, category: "Grooming" },
  { id: "s3", name: "Haircut & Shave", duration: 45, price: 35, category: "Hair" },
  { id: "s4", name: "Hair Color", duration: 90, price: 60, category: "Hair" },
  { id: "s5", name: "Beard Trim", duration: 15, price: 10, category: "Grooming" },
  { id: "s6", name: "Hot Towel Treatment", duration: 20, price: 18, category: "Grooming" },
];

const DEFAULT_CUSTOMERS: Customer[] = [
  {
    id: "c1",
    name: "James Mitchell",
    phone: "555-0101",
    email: "james@example.com",
    notes: "Prefers short sides",
    createdAt: "2024-01-15",
    totalVisits: 8,
  },
  {
    id: "c2",
    name: "Robert Chen",
    phone: "555-0102",
    email: "robert@example.com",
    notes: "Allergic to certain dyes",
    createdAt: "2024-02-01",
    totalVisits: 3,
  },
  {
    id: "c3",
    name: "Marcus Thompson",
    phone: "555-0103",
    email: "marcus@example.com",
    notes: "",
    createdAt: "2024-03-10",
    totalVisits: 5,
  },
];

const today = new Date().toISOString().split("T")[0];

const DEFAULT_APPOINTMENTS: Appointment[] = [
  {
    id: "a1",
    customerId: "c1",
    customerName: "James Mitchell",
    serviceId: "s1",
    serviceName: "Haircut",
    date: today,
    time: "09:00",
    duration: 30,
    price: 25,
    status: "scheduled",
    notes: "",
  },
  {
    id: "a2",
    customerId: "c2",
    customerName: "Robert Chen",
    serviceId: "s3",
    serviceName: "Haircut & Shave",
    date: today,
    time: "10:30",
    duration: 45,
    price: 35,
    status: "scheduled",
    notes: "Wants a fade",
  },
  {
    id: "a3",
    customerId: "c3",
    customerName: "Marcus Thompson",
    serviceId: "s5",
    serviceName: "Beard Trim",
    date: today,
    time: "14:00",
    duration: 15,
    price: 10,
    status: "completed",
    notes: "",
  },
];

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [savedCustomers, savedAppointments, savedServices] = await Promise.all([
        AsyncStorage.getItem("customers"),
        AsyncStorage.getItem("appointments"),
        AsyncStorage.getItem("services"),
      ]);

      setCustomers(savedCustomers ? JSON.parse(savedCustomers) : DEFAULT_CUSTOMERS);
      setAppointments(savedAppointments ? JSON.parse(savedAppointments) : DEFAULT_APPOINTMENTS);
      setServices(savedServices ? JSON.parse(savedServices) : DEFAULT_SERVICES);
    } catch {
      setCustomers(DEFAULT_CUSTOMERS);
      setAppointments(DEFAULT_APPOINTMENTS);
      setServices(DEFAULT_SERVICES);
    }
  };

  const saveCustomers = async (data: Customer[]) => {
    await AsyncStorage.setItem("customers", JSON.stringify(data));
  };

  const saveAppointments = async (data: Appointment[]) => {
    await AsyncStorage.setItem("appointments", JSON.stringify(data));
  };

  const saveServices = async (data: Service[]) => {
    await AsyncStorage.setItem("services", JSON.stringify(data));
  };

  const addCustomer = (customer: Omit<Customer, "id" | "createdAt" | "totalVisits">) => {
    const newCustomer: Customer = {
      ...customer,
      id: generateId(),
      createdAt: new Date().toISOString().split("T")[0],
      totalVisits: 0,
    };
    const updated = [...customers, newCustomer];
    setCustomers(updated);
    saveCustomers(updated);
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    const updated = customers.map((c) => (c.id === id ? { ...c, ...updates } : c));
    setCustomers(updated);
    saveCustomers(updated);
  };

  const deleteCustomer = (id: string) => {
    const updated = customers.filter((c) => c.id !== id);
    setCustomers(updated);
    saveCustomers(updated);
  };

  const addAppointment = (appointment: Omit<Appointment, "id">) => {
    const newAppointment: Appointment = { ...appointment, id: generateId() };
    const updated = [...appointments, newAppointment];
    setAppointments(updated);
    saveAppointments(updated);

    const cust = customers.find((c) => c.id === appointment.customerId);
    if (cust) {
      updateCustomer(cust.id, { totalVisits: cust.totalVisits + 1 });
    }
  };

  const updateAppointment = (id: string, updates: Partial<Appointment>) => {
    const updated = appointments.map((a) => (a.id === id ? { ...a, ...updates } : a));
    setAppointments(updated);
    saveAppointments(updated);
  };

  const deleteAppointment = (id: string) => {
    const updated = appointments.filter((a) => a.id !== id);
    setAppointments(updated);
    saveAppointments(updated);
  };

  const addService = (service: Omit<Service, "id">) => {
    const newService: Service = { ...service, id: generateId() };
    const updated = [...services, newService];
    setServices(updated);
    saveServices(updated);
  };

  const updateService = (id: string, updates: Partial<Service>) => {
    const updated = services.map((s) => (s.id === id ? { ...s, ...updates } : s));
    setServices(updated);
    saveServices(updated);
  };

  const deleteService = (id: string) => {
    const updated = services.filter((s) => s.id !== id);
    setServices(updated);
    saveServices(updated);
  };

  return (
    <AppContext.Provider
      value={{
        customers,
        appointments,
        services,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addAppointment,
        updateAppointment,
        deleteAppointment,
        addService,
        updateService,
        deleteService,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
