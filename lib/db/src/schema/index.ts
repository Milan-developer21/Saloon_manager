import { pgTable, text, integer, boolean, timestamp, serial, jsonb } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("customer"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const saloonsTable = pgTable("saloons", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull().references(() => usersTable.id),
  name: text("name").notNull(),
  ownerName: text("owner_name").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull().default(""),
  city: text("city").notNull(),
  description: text("description").default(""),
  services: jsonb("services").$type<string[]>().notNull().default([]),
  openTime: text("open_time").notNull().default("09:00"),
  closeTime: text("close_time").notNull().default("20:00"),
  isOpen: boolean("is_open").notNull().default(true),
  slotDuration: integer("slot_duration").notNull().default(30),
  createdAt: timestamp("created_at").defaultNow(),
});

export const timeSlotsTable = pgTable("time_slots", {
  id: serial("id").primaryKey(),
  saloonId: integer("saloon_id").notNull().references(() => saloonsTable.id),
  date: text("date").notNull(),
  time: text("time").notNull(),
  isBlocked: boolean("is_blocked").notNull().default(false),
});

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  saloonId: integer("saloon_id").notNull().references(() => saloonsTable.id),
  slotId: integer("slot_id").notNull().references(() => timeSlotsTable.id),
  customerId: integer("customer_id").notNull().references(() => usersTable.id),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  service: text("service").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type User = typeof usersTable.$inferSelect;
export type Saloon = typeof saloonsTable.$inferSelect;
export type TimeSlot = typeof timeSlotsTable.$inferSelect;
export type Booking = typeof bookingsTable.$inferSelect;