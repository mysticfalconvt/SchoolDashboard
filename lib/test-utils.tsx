import { render, RenderOptions } from '@testing-library/react';
import React, { ReactElement } from 'react';

// Add any providers here if needed for your app
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { customRender as render };

// Common test data
export const mockUser = {
  id: 'user1',
  name: 'Test User',
  email: 'test@example.com',
  isStaff: true,
  hasTA: true,
};

export const mockStudent = {
  id: 'student1',
  name: 'Test Student',
  email: 'student@example.com',
  isStaff: false,
  hasTA: false,
};

export const mockTeacher = {
  id: 'teacher1',
  name: 'Test Teacher',
  email: 'teacher@example.com',
  isStaff: true,
  hasTA: true,
};

// GraphQL mock helpers
export const createMockGraphQLResponse = <T,>(data: T) => ({
  data,
  loading: false,
  error: null,
});

export const createMockGraphQLError = (message: string) => ({
  data: undefined,
  loading: false,
  error: { message },
});
