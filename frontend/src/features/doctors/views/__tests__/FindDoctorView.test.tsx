import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { useFindDoctorViewModel } from '../../viewmodels/useFindDoctorViewModel';
import { FindDoctorView } from '../FindDoctorView';

jest.mock('../../viewmodels/useFindDoctorViewModel');
jest.mock('expo-router', () => {
  const mockReact = require('react');
  const { View: MockView } = require('react-native');
  return {
    Link: ({ children, href }: { children: React.ReactNode; href: string }) =>
      mockReact.createElement(
        MockView,
        { accessibilityRole: 'link', accessibilityLabel: href },
        children
      ),
  };
});

test('shows each doctor hospital, available schedule, and booking action', async () => {
  (useFindDoctorViewModel as jest.Mock).mockReturnValue({
    doctors: [
      {
        doctor_id: 'd1',
        hospital_id: 'h1',
        department_id: 'dep1',
        name: 'Dr. Ali',
        specialization: 'Cardiology',
        is_active: true,
        hospital: { hospital_id: 'h1', name: 'City Hospital' },
        department: { department_id: 'dep1', name: 'Cardiology' },
        schedules: [
          {
            schedule_id: 's1',
            doctor_id: 'd1',
            day_of_week: 'MONDAY',
            start_time: '09:00',
            end_time: '12:00',
            appointment_duration: 30,
            is_active: true,
          },
        ],
      },
    ],
    isLoading: false,
    isError: false,
    query: 'Ali',
    setQuery: jest.fn(),
    selector: {
      mode: 'manual',
      coordinates: null,
      manualCity: 'Karachi',
      permissionDenied: false,
      isRequestingGps: false,
      requestGpsLocation: jest.fn(),
      setManualCity: jest.fn(),
      reset: jest.fn(),
    },
  });

  await render(<FindDoctorView />);

  expect(screen.getByText('Dr. Ali')).toBeOnTheScreen();
  expect(screen.getByText('City Hospital')).toBeOnTheScreen();
  expect(screen.getByText('MONDAY')).toBeOnTheScreen();
  expect(screen.getByText('Available Timings')).toBeOnTheScreen();
  expect(screen.getByText('09:00 - 12:00')).toBeOnTheScreen();
  expect(screen.getByText('Book Appointment')).toBeOnTheScreen();
  expect(
    screen.getByLabelText('/appointments?doctorId=d1&hospitalId=h1&departmentId=dep1')
  ).toBeOnTheScreen();
});
