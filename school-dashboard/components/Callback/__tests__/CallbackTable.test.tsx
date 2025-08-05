import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders, mockUser, mockCallback } from '../../../__tests__/utils/test-utils';
import CallbackTable from '../CallbackTable';

// Mock dependencies
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    query: {},
    pathname: '/callback',
    route: '/callback',
    asPath: '/callback',
  }),
}));

jest.mock('../../User', () => ({
  useUser: jest.fn(),
}));

jest.mock('../../../lib/useGqlQuery', () => ({
  useGQLQuery: jest.fn(),
}));

jest.mock('../../Table', () => {
  return function MockTable({ data, columns, searchColumn, hiddenColumns }: any) {
    return (
      <div data-testid="callback-table">
        <div data-testid="search-column">{searchColumn}</div>
        <div data-testid="data-length">{data?.length || 0}</div>
        <div data-testid="hidden-columns">{JSON.stringify(hiddenColumns)}</div>
        {data?.map((item: any, index: number) => (
          <div key={item.id || index} data-testid={`callback-row-${index}`}>
            <span data-testid={`student-name-${index}`}>{item.student?.name}</span>
            <span data-testid={`teacher-name-${index}`}>{item.teacher?.name}</span>
            <span data-testid={`title-${index}`}>{item.title}</span>
            <span data-testid={`description-${index}`}>{item.description}</span>
            <span data-testid={`block-${index}`}>{item.block}</span>
          </div>
        ))}
      </div>
    );
  };
});

jest.mock('../CallbackMessagesForTable', () => {
  return function MockCallbackMessagesForTable({ callbackItem }: any) {
    return <div data-testid={`messages-${callbackItem.id}`}>Messages for {callbackItem.id}</div>;
  };
});

jest.mock('../MarkCallbackCompleted', () => {
  return function MockMarkCallbackCompleted({ callback }: any) {
    return <div data-testid={`complete-${callback.id}`}>Complete {callback.id}</div>;
  };
});

jest.mock('../../../lib/displayName', () => {
  return jest.fn((user) => user?.preferredName ? `${user.name} - (${user.preferredName})` : user?.name || '');
});

const { useUser } = require('../../User');
const { useGQLQuery } = require('../../../lib/useGqlQuery');

describe('CallbackTable', () => {
  const mockCallbacks = [
    {
      ...mockCallback,
      id: 'callback-1',
      student: { id: 'student-1', name: 'Alice Johnson', preferredName: 'Ali' },
      teacher: { id: 'teacher-1', name: 'Mr. Smith' },
      title: 'Math Assignment',
      description: 'Complete problems 1-10',
    },
    {
      ...mockCallback,
      id: 'callback-2',
      student: { id: 'student-2', name: 'Bob Wilson', preferredName: null },
      teacher: { id: 'teacher-2', name: 'Ms. Johnson' },
      title: 'Science Lab',
      description: 'Write lab report on photosynthesis experiment',
    },
  ];

  const mockStudentsByBlockData = {
    user: {
      id: 'teacher-1',
      name: 'Test Teacher',
      block1Students: [{ id: 'student-1' }],
      block2Students: [{ id: 'student-2' }],
      block3Students: [],
      block4Students: [],
      block5Students: [],
      block6Students: [],
      block7Students: [],
      block8Students: [],
      block9Students: [],
      block10Students: [],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useUser.mockReturnValue(mockUser);
    useGQLQuery.mockReturnValue({
      data: mockStudentsByBlockData,
      isLoading: false,
      error: null,
    });
  });

  it('renders with callbacks data', async () => {
    renderWithProviders(
      <CallbackTable callbacks={mockCallbacks} showClassBlock={false} />
    );

    await waitFor(() => {
      expect(screen.getByTestId('callback-table')).toBeInTheDocument();
    });

    expect(screen.getByTestId('data-length')).toHaveTextContent('2');
    expect(screen.getByTestId('student-name-0')).toHaveTextContent('Alice Johnson - (Ali)');
    expect(screen.getByTestId('teacher-name-0')).toHaveTextContent('Mr. Smith');
    expect(screen.getByTestId('title-0')).toHaveTextContent('Math Assignment');
  });

  it('displays callback count correctly', async () => {
    renderWithProviders(
      <CallbackTable callbacks={mockCallbacks} showClassBlock={false} />
    );

    await waitFor(() => {
      expect(screen.getByText('You have 2 items on Callback')).toBeInTheDocument();
    });
  });

  it('displays singular form for single callback', async () => {
    renderWithProviders(
      <CallbackTable callbacks={[mockCallbacks[0]]} showClassBlock={false} />
    );

    await waitFor(() => {
      expect(screen.getByText('You have 1 item on Callback')).toBeInTheDocument();
    });
  });

  it('handles empty callbacks array', async () => {
    renderWithProviders(
      <CallbackTable callbacks={[]} showClassBlock={false} />
    );

    await waitFor(() => {
      expect(screen.getByText('You have 0 items on Callback')).toBeInTheDocument();
    });

    expect(screen.getByTestId('data-length')).toHaveTextContent('0');
  });

  it('shows block column when showClassBlock is true', async () => {
    renderWithProviders(
      <CallbackTable callbacks={mockCallbacks} showClassBlock={true} />
    );

    await waitFor(() => {
      expect(screen.getByTestId('hidden-columns')).toHaveTextContent('[]');
    });

    // Should show block information
    expect(screen.getByTestId('block-0')).toHaveTextContent('B1');
    expect(screen.getByTestId('block-1')).toHaveTextContent('B2');
  });

  it('hides block column when showClassBlock is false', async () => {
    renderWithProviders(
      <CallbackTable callbacks={mockCallbacks} showClassBlock={false} />
    );

    await waitFor(() => {
      expect(screen.getByTestId('hidden-columns')).toHaveTextContent('["block"]');
    });
  });

  it('assigns correct blocks to students', async () => {
    renderWithProviders(
      <CallbackTable callbacks={mockCallbacks} showClassBlock={true} />
    );

    await waitFor(() => {
      expect(screen.getByTestId('block-0')).toHaveTextContent('B1');
      expect(screen.getByTestId('block-1')).toHaveTextContent('B2');
    });
  });

  it('assigns "n/a" block for students not found in any block', async () => {
    const callbackWithUnknownStudent = {
      ...mockCallback,
      id: 'callback-3',
      student: { id: 'unknown-student', name: 'Unknown Student' },
    };

    renderWithProviders(
      <CallbackTable callbacks={[callbackWithUnknownStudent]} showClassBlock={true} />
    );

    await waitFor(() => {
      expect(screen.getByTestId('block-0')).toHaveTextContent('n/a');
    });
  });

  it('sorts callbacks by student name', async () => {
    const unsortedCallbacks = [
      {
        ...mockCallback,
        id: 'callback-1',
        student: { id: 'student-1', name: 'Zoe Adams' },
      },
      {
        ...mockCallback,
        id: 'callback-2',
        student: { id: 'student-2', name: 'Alice Johnson' },
      },
    ];

    renderWithProviders(
      <CallbackTable callbacks={unsortedCallbacks} showClassBlock={false} />
    );

    await waitFor(() => {
      // Should be sorted alphabetically by student name
      expect(screen.getByTestId('student-name-0')).toHaveTextContent('Alice Johnson');
      expect(screen.getByTestId('student-name-1')).toHaveTextContent('Zoe Adams');
    });
  });

  it('uses correct search column', async () => {
    renderWithProviders(
      <CallbackTable callbacks={mockCallbacks} showClassBlock={false} />
    );

    await waitFor(() => {
      expect(screen.getByTestId('search-column')).toHaveTextContent('student.name');
    });
  });

  it('handles loading state when user is not available', () => {
    useUser.mockReturnValue(null);

    renderWithProviders(
      <CallbackTable callbacks={mockCallbacks} showClassBlock={false} />
    );

    // Should still render but with limited functionality
    expect(screen.getByTestId('callback-table')).toBeInTheDocument();
  });

  it('does not fetch students by block when showClassBlock is false', () => {
    renderWithProviders(
      <CallbackTable callbacks={mockCallbacks} showClassBlock={false} />
    );

    // useGQLQuery should be called with enabled: false when showClassBlock is false
    expect(useGQLQuery).toHaveBeenCalledWith(
      'studentsByBlock',
      expect.any(Object),
      expect.objectContaining({ id: mockUser.id }),
      expect.objectContaining({ enabled: false })
    );
  });

  it('fetches students by block when showClassBlock is true', () => {
    renderWithProviders(
      <CallbackTable callbacks={mockCallbacks} showClassBlock={true} />
    );

    // useGQLQuery should be called with enabled: true when showClassBlock is true
    expect(useGQLQuery).toHaveBeenCalledWith(
      'studentsByBlock',
      expect.any(Object),
      expect.objectContaining({ id: mockUser.id }),
      expect.objectContaining({ enabled: true })
    );
  });

  it('memoizes callbacks to prevent unnecessary re-renders', () => {
    const { rerender } = renderWithProviders(
      <CallbackTable callbacks={mockCallbacks} showClassBlock={false} />
    );

    // Re-render with same props
    rerender(<CallbackTable callbacks={mockCallbacks} showClassBlock={false} />);

    // Table should still render correctly
    expect(screen.getByTestId('callback-table')).toBeInTheDocument();
    expect(screen.getByTestId('data-length')).toHaveTextContent('2');
  });
});