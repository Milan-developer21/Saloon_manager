import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  UserModel,
  SaloonModel,
  TimeSlotModel,
  BookingModel,
  CounterModel,
  connectToDatabase,
  getNextSequence,
  getNextSequenceRange,
} from '../index.js';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await mongoose.connection.db.dropDatabase();
});

describe('Database Models', () => {
  describe('UserModel', () => {
    it('should create and save a user', async () => {
      const userData = {
        id: 1,
        name: 'John Doe',
        phone: '+1234567890',
        password: 'hashedpassword',
        role: 'customer' as const,
        createdAt: new Date(),
      };

      const user = new UserModel(userData);
      const savedUser = await user.save();

      expect(savedUser.id).toBe(1);
      expect(savedUser.name).toBe('John Doe');
      expect(savedUser.phone).toBe('+1234567890');
      expect(savedUser.role).toBe('customer');
    });

    it('should enforce unique phone', async () => {
      const userData = {
        id: 1,
        name: 'John Doe',
        phone: '+1234567890',
        password: 'hashedpassword',
        role: 'customer' as const,
        createdAt: new Date(),
      };

      await new UserModel(userData).save();

      await expect(new UserModel({ ...userData, id: 2 }).save()).rejects.toThrow();
    });
  });

  describe('SaloonModel', () => {
    it('should create and save a saloon', async () => {
      const saloonData = {
        id: 1,
        ownerId: 1,
        name: 'Barber Shop',
        ownerName: 'Owner Name',
        phone: '+1234567890',
        address: '123 Main St',
        city: 'City',
        description: 'Description',
        services: ['Haircut'],
        openTime: '09:00',
        closeTime: '20:00',
        isOpen: true,
        slotDuration: 30,
        createdAt: new Date(),
      };

      const saloon = new SaloonModel(saloonData);
      const savedSaloon = await saloon.save();

      expect(savedSaloon.id).toBe(1);
      expect(savedSaloon.name).toBe('Barber Shop');
      expect(savedSaloon.services).toEqual(['Haircut']);
    });
  });

  describe('TimeSlotModel', () => {
    it('should create and save a time slot', async () => {
      const slotData = {
        id: 1,
        saloonId: 1,
        date: '2024-01-01',
        time: '10:00',
        isBlocked: false,
      };

      const slot = new TimeSlotModel(slotData);
      const savedSlot = await slot.save();

      expect(savedSlot.id).toBe(1);
      expect(savedSlot.isBlocked).toBe(false);
    });

    it('should enforce unique saloonId, date, time', async () => {
      const slotData = {
        id: 1,
        saloonId: 1,
        date: '2024-01-01',
        time: '10:00',
        isBlocked: false,
      };

      await new TimeSlotModel(slotData).save();

      await expect(new TimeSlotModel({ ...slotData, id: 2 }).save()).rejects.toThrow();
    });
  });

  describe('BookingModel', () => {
    it('should create and save a booking', async () => {
      const bookingData = {
        id: 1,
        saloonId: 1,
        slotId: 1,
        customerId: 1,
        customerName: 'Customer Name',
        customerPhone: '+1234567890',
        service: 'Haircut',
        status: 'pending' as const,
        createdAt: new Date(),
      };

      const booking = new BookingModel(bookingData);
      const savedBooking = await booking.save();

      expect(savedBooking.id).toBe(1);
      expect(savedBooking.status).toBe('pending');
    });
  });

  describe('CounterModel', () => {
    it('should create and save a counter', async () => {
      const counterData = {
        _id: 'user',
        seq: 0,
      };

      const counter = new CounterModel(counterData);
      const savedCounter = await counter.save();

      expect(savedCounter._id).toBe('user');
      expect(savedCounter.seq).toBe(0);
    });
  });
});

describe('Database Functions', () => {
  describe('connectToDatabase', () => {
    it('should connect to the database', async () => {
      const connection = await connectToDatabase();
      expect(connection.connection.readyState).toBe(1);
    });
  });

  describe('getNextSequence', () => {
    it('should return incrementing sequence numbers', async () => {
      const seq1 = await getNextSequence('test');
      const seq2 = await getNextSequence('test');

      expect(seq1).toBe(1);
      expect(seq2).toBe(2);
    });

    it('should handle different sequences independently', async () => {
      const seq1 = await getNextSequence('test1');
      const seq2 = await getNextSequence('test2');

      expect(seq1).toBe(1);
      expect(seq2).toBe(1);
    });
  });

  describe('getNextSequenceRange', () => {
    it('should return a range of sequence numbers', async () => {
      const range = await getNextSequenceRange('test', 3);

      expect(range).toEqual([1, 2, 3]);
    });

    it('should return empty array for count <= 0', async () => {
      const range = await getNextSequenceRange('test', 0);

      expect(range).toEqual([]);
    });
  });
});
