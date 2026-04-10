import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SaloonCard } from '../components/SaloonCard';

// Mock the hooks
jest.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    card: '#ffffff',
    border: '#e0e0e0',
    secondary: '#f0f0f0',
    primary: '#007bff',
    foreground: '#000000',
    mutedForeground: '#666666',
    green: '#28a745',
    greenBg: '#d4edda',
    red: '#dc3545',
    redBg: '#f8d7da',
  }),
}));

jest.mock('@/context/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key, // Return key as is for simplicity
  }),
}));

// Mock Haptics
jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(),
}));

describe('SaloonCard', () => {
  const mockSaloon = {
    id: 1,
    ownerId: 1,
    name: 'Test Saloon',
    ownerName: 'Owner',
    phone: '+1234567890',
    address: '123 Main St',
    city: 'Test City',
    description: 'A great place for haircuts',
    services: ['Haircut', 'Shave', 'Color'],
    openTime: '09:00',
    closeTime: '18:00',
    isOpen: true,
    slotDuration: 30,
    createdAt: new Date(),
  };

  it('renders saloon information correctly', () => {
    const mockOnPress = jest.fn();

    const { getByText, getAllByText } = render(
      <SaloonCard saloon={mockSaloon} onPress={mockOnPress} />
    );

    expect(getByText('Test Saloon')).toBeTruthy();
    expect(getByText('Test City · 123 Main St')).toBeTruthy();
    expect(getByText('A great place for haircuts')).toBeTruthy();
    expect(getByText('Haircut')).toBeTruthy();
    expect(getByText('Shave')).toBeTruthy();
    expect(getByText('Color')).toBeTruthy();
    expect(getByText('09:00 – 18:00')).toBeTruthy();
    expect(getByText('open')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const mockOnPress = jest.fn();

    const { getByText } = render(
      <SaloonCard saloon={mockSaloon} onPress={mockOnPress} />
    );

    fireEvent.press(getByText('Test Saloon'));

    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('shows closed status when saloon is closed', () => {
    const closedSaloon = { ...mockSaloon, isOpen: false };
    const mockOnPress = jest.fn();

    const { getByText } = render(
      <SaloonCard saloon={closedSaloon} onPress={mockOnPress} />
    );

    expect(getByText('closed')).toBeTruthy();
  });

  it('shows +more when there are more than 3 services', () => {
    const saloonWithManyServices = {
      ...mockSaloon,
      services: ['Haircut', 'Shave', 'Color', 'Massage', 'Facial'],
    };
    const mockOnPress = jest.fn();

    const { getByText } = render(
      <SaloonCard saloon={saloonWithManyServices} onPress={mockOnPress} />
    );

    expect(getByText('+2')).toBeTruthy();
  });
});
