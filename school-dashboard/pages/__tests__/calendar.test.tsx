import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders, mockUser, mockCalendarEvent } from '../../__tests__/utils/test-utils';
import CalendarPage from '../calendar';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    query: {},
    pathname: '/calendar',
    route: '/calendar',
    asPath: '/calendar',
  }),
}));

// Mock dependencies
jest.mock('../../components/User', () => ({
  useUser: jest.fn(),
}));

jest.mock('../../lib/useGqlQuery', () => ({
  useGQLQuery: jest.fn(),
}));

jest.mock('../../lib/isAllowed', () => jest.fn());

// Mock calendar components
jest.mock('../../components/calendars/NewCalendar', () => {
  return function MockNewCalendar({ refetchCalendars, hidden }: any) {
    if (hidden) return null;
    return (
      <div data-testid="new-calendar">
        <button onClick={refetchCalendars} data-testid="add-event-button">
          Add New Event
        </button>
      </div>
    );
  };
});

jest.mock('../../components/calendars/Calendars', () => {
  return function MockCalendars({ dates, initialData, googleCalendarEvents }: any) {
    const events = initialData?.calendarEvents || [];
    return (
      <div data-testid="calendar-display">
        <div data-testid="events-count">{events?.length || 0}</div>
        <div data-testid="dates-label">{dates?.label || 'upcoming'}</div>
        {events?.map((event: any, index: number) => (
          <div key={event.id || index} data-testid={`event-${index}`}>
            <span data-testid={`event-name-${index}`}>{event.name}</span>
            <span data-testid={`event-date-${index}`}>{event.date}</span>
          </div>
        ))}
      </div>
    );
  };
});

const { useUser } = require('../../components/User');
const { useGQLQuery } = require('../../lib/useGqlQuery');
const isAllowed = require('../../lib/isAllowed');

describe('CalendarPage', () => {
  const mockEvents = [
    {
      ...mockCalendarEvent,
      id: 'event-1',
      name: 'Test Event 1',
      date: '2024-12-25T00:00:00.000Z',
      status: 'Both',
    },
    {
      ...mockCalendarEvent,
      id: 'event-2',
      name: 'Test Event 2',
      date: '2024-12-26T00:00:00.000Z',
      status: 'Students',
    },
  ];

  const mockProps = {
    initialCalendarDates: { calendarEvents: mockEvents },
    initialGoogleCalendarEvents: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useUser.mockReturnValue(mockUser);
    isAllowed.mockReturnValue(true);
    useGQLQuery.mockReturnValue({
      data: { calendarEvents: mockEvents },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  it('renders calendar for all users', () => {
    isAllowed.mockReturnValue(true);

    renderWithProviders(<CalendarPage {...mockProps} />);

    expect(screen.getByTestId('calendar-display')).toBeInTheDocument();
  });

  it('renders calendar even for null users', () => {
    useUser.mockReturnValue(null);

    renderWithProviders(<CalendarPage {...mockProps} />);

    // Calendar page doesn't have user restrictions
    expect(screen.getByTestId('calendar-display')).toBeInTheDocument();
  });

  it('renders calendar with events', () => {
    renderWithProviders(<CalendarPage {...mockProps} />);

    expect(screen.getByTestId('calendar-display')).toBeInTheDocument();
    expect(screen.getByTestId('events-count')).toHaveTextContent('2');
    expect(screen.getByTestId('event-name-0')).toHaveTextContent('Test Event 1');
    expect(screen.getByTestId('event-name-1')).toHaveTextContent('Test Event 2');
  });

  it('renders calendar component', () => {
    renderWithProviders(<CalendarPage {...mockProps} />);

    expect(screen.getByTestId('calendar-display')).toBeInTheDocument();
  });

  it('renders switch dates button', () => {
    renderWithProviders(<CalendarPage {...mockProps} />);

    expect(screen.getByText('Show All Dates')).toBeInTheDocument();
  });

  it('renders switch dates button correctly', () => {
    renderWithProviders(<CalendarPage {...mockProps} />);

    expect(screen.getByText('Show All Dates')).toBeInTheDocument();
  });

  it('handles null calendar data', () => {
    const nullProps = {
      initialCalendarDates: null,
      initialGoogleCalendarEvents: [],
    };

    useGQLQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    renderWithProviders(<CalendarPage {...nullProps} />);

    expect(screen.getByTestId('calendar-display')).toBeInTheDocument();
    expect(screen.getByTestId('events-count')).toHaveTextContent('0');
  });

  it('handles empty calendar data', () => {
    const emptyProps = {
      initialCalendarDates: { calendarEvents: [] },
      initialGoogleCalendarEvents: [],
    };

    renderWithProviders(<CalendarPage {...emptyProps} />);

    expect(screen.getByTestId('calendar-display')).toBeInTheDocument();
    expect(screen.getByTestId('events-count')).toHaveTextContent('0');
  });

  it('handles loading state', () => {
    useGQLQuery.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    });

    renderWithProviders(<CalendarPage {...mockProps} />);

    // Should still render the calendar component
    expect(screen.getByTestId('calendar-display')).toBeInTheDocument();
  });

  it('handles error state', () => {
    useGQLQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to load calendar'),
      refetch: jest.fn(),
    });

    // Use props without initial data to simulate error state
    const errorProps = {
      initialCalendarDates: { calendarEvents: [] },
      initialGoogleCalendarEvents: [],
    };

    renderWithProviders(<CalendarPage {...errorProps} />);

    // Should still render the calendar component with empty data
    expect(screen.getByTestId('calendar-display')).toBeInTheDocument();
    expect(screen.getByTestId('events-count')).toHaveTextContent('0');
  });

  it('passes initial data to calendar component', () => {
    renderWithProviders(<CalendarPage {...mockProps} />);

    expect(screen.getByTestId('events-count')).toHaveTextContent('2');
  });

  it('renders dates label correctly', () => {
    renderWithProviders(<CalendarPage {...mockProps} />);

    expect(screen.getByTestId('dates-label')).toHaveTextContent('upcoming');
  });
});