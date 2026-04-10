import mongoose, { Schema, type Model } from "mongoose";

const configuredMongoUri = process.env.MONGODB_URI;

if (!configuredMongoUri) {
  throw new Error("MONGODB_URI must be set. Did you forget to provision a MongoDB database?");
}

const mongoUri = configuredMongoUri;

type UserRole = "customer" | "owner";
type BookingStatus = "pending" | "accepted" | "rejected" | "completed" | "cancelled";

export interface User {
  id: number;
  name: string;
  phone: string;
  password: string;
  role: UserRole;
  createdAt: Date;
}

export interface Saloon {
  id: number;
  ownerId: number;
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
  createdAt: Date;
}

export interface TimeSlot {
  id: number;
  saloonId: number;
  date: string;
  time: string;
  isBlocked: boolean;
}

export interface Booking {
  id: number;
  saloonId: number;
  slotId: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  service: string;
  status: BookingStatus;
  createdAt: Date;
}

interface Counter {
  _id: string;
  seq: number;
}

declare global {
  var __workspaceMongoConnectionPromise: Promise<typeof mongoose> | undefined;
}

function stripMongoFields(_doc: unknown, ret: Record<string, unknown>) {
  delete ret._id;
  delete ret.__v;
  return ret;
}

const schemaOptions = {
  versionKey: false,
  id: false,
  toJSON: { transform: stripMongoFields },
  toObject: { transform: stripMongoFields },
} as const;

const counterSchema = new Schema<Counter>(
  {
    _id: { type: String, required: true },
    seq: { type: Number, required: true, default: 0 },
  },
  {
    versionKey: false,
  },
);

const userSchema = new Schema<User>(
  {
    id: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ["customer", "owner"], default: "customer" },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  schemaOptions,
);

const saloonSchema = new Schema<Saloon>(
  {
    id: { type: Number, required: true, unique: true, index: true },
    ownerId: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    ownerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, default: "" },
    city: { type: String, required: true, trim: true },
    description: { type: String, required: true, default: "" },
    services: { type: [String], required: true, default: [] },
    openTime: { type: String, required: true, default: "09:00" },
    closeTime: { type: String, required: true, default: "20:00" },
    isOpen: { type: Boolean, required: true, default: true },
    slotDuration: { type: Number, required: true, default: 30 },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  schemaOptions,
);

const timeSlotSchema = new Schema<TimeSlot>(
  {
    id: { type: Number, required: true, unique: true, index: true },
    saloonId: { type: Number, required: true, index: true },
    date: { type: String, required: true, index: true },
    time: { type: String, required: true },
    isBlocked: { type: Boolean, required: true, default: false },
  },
  schemaOptions,
);

timeSlotSchema.index({ saloonId: 1, date: 1, time: 1 }, { unique: true });

const bookingSchema = new Schema<Booking>(
  {
    id: { type: Number, required: true, unique: true, index: true },
    saloonId: { type: Number, required: true, index: true },
    slotId: { type: Number, required: true, index: true },
    customerId: { type: Number, required: true, index: true },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },
    service: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ["pending", "accepted", "rejected", "completed", "cancelled"],
      default: "pending",
    },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  schemaOptions,
);

bookingSchema.index({ slotId: 1, status: 1 });
bookingSchema.index({ customerId: 1, createdAt: 1 });
bookingSchema.index({ saloonId: 1, createdAt: 1 });

function getModel<T>(name: string, schema: Schema<T>): Model<T> {
  return (mongoose.models[name] as Model<T> | undefined) ?? mongoose.model<T>(name, schema);
}

export const CounterModel = getModel<Counter>("Counter", counterSchema);
export const UserModel = getModel<User>("User", userSchema);
export const SaloonModel = getModel<Saloon>("Saloon", saloonSchema);
export const TimeSlotModel = getModel<TimeSlot>("TimeSlot", timeSlotSchema);
export const BookingModel = getModel<Booking>("Booking", bookingSchema);

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (!globalThis.__workspaceMongoConnectionPromise) {
    globalThis.__workspaceMongoConnectionPromise = mongoose.connect(mongoUri, {
      autoIndex: true,
    });
  }

  return globalThis.__workspaceMongoConnectionPromise;
}

export async function getNextSequence(name: string): Promise<number> {
  await connectToDatabase();
  const counter = await CounterModel.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).exec();

  if (!counter) {
    throw new Error(`Failed to allocate ID for sequence "${name}"`);
  }

  return counter.seq;
}

export async function getNextSequenceRange(name: string, count: number): Promise<number[]> {
  if (count <= 0) {
    return [];
  }

  await connectToDatabase();
  const counter = await CounterModel.findByIdAndUpdate(
    name,
    { $inc: { seq: count } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).exec();

  if (!counter) {
    throw new Error(`Failed to allocate IDs for sequence "${name}"`);
  }

  const start = counter.seq - count + 1;
  return Array.from({ length: count }, (_, index) => start + index);
}

void connectToDatabase();
