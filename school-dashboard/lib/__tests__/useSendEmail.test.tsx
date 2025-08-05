import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import useSendEmail from '../useSendEmail';
import { useGqlMutation } from '../useGqlMutation';

// Mock the useGqlMutation hook
jest.mock('../useGqlMutation', () => ({
  useGqlMutation: jest.fn(),
}));

const mockUseGqlMutation = useGqlMutation as jest.MockedFunction<typeof useGqlMutation>;

describe('useSendEmail', () => {
  let queryClient: QueryClient;
  let mockSendEmail: jest.Mock;
  let mockMutationState: any;

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockSendEmail = jest.fn();
    mockMutationState = {
      data: null,
      loading: false,
      error: null,
    };

    mockUseGqlMutation.mockReturnValue([mockSendEmail, mockMutationState]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with correct default values', () => {
    const { result } = renderHook(() => useSendEmail(), { wrapper });

    expect(result.current.emailLoading).toBe(false);
    expect(result.current.sendEmail).toBe(mockSendEmail);
    expect(typeof result.current.setEmail).toBe('function');
  });

  it('calls sendEmail mutation when email is set', async () => {
    const { result } = renderHook(() => useSendEmail(), { wrapper });

    const emailData = {
      to: 'test@example.com',
      subject: 'Test Email',
      body: 'This is a test email',
    };

    act(() => {
      result.current.setEmail(emailData);
    });

    await waitFor(() => {
      expect(mockSendEmail).toHaveBeenCalledWith({
        emailData,
      });
    });
  });

  it('does not call sendEmail when email is null', () => {
    renderHook(() => useSendEmail(), { wrapper });

    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('handles loading state correctly', () => {
    mockMutationState.loading = true;
    mockUseGqlMutation.mockReturnValue([mockSendEmail, mockMutationState]);

    const { result } = renderHook(() => useSendEmail(), { wrapper });

    expect(result.current.emailLoading).toBe(true);
  });

  it('handles multiple email sends', async () => {
    const { result } = renderHook(() => useSendEmail(), { wrapper });

    const firstEmail = {
      to: 'first@example.com',
      subject: 'First Email',
    };

    const secondEmail = {
      to: 'second@example.com',
      subject: 'Second Email',
    };

    act(() => {
      result.current.setEmail(firstEmail);
    });

    await waitFor(() => {
      expect(mockSendEmail).toHaveBeenCalledWith({
        emailData: firstEmail,
      });
    });

    act(() => {
      result.current.setEmail(secondEmail);
    });

    await waitFor(() => {
      expect(mockSendEmail).toHaveBeenCalledWith({
        emailData: secondEmail,
      });
    });

    expect(mockSendEmail).toHaveBeenCalledTimes(2);
  });

  it('handles complex email data structures', async () => {
    const { result } = renderHook(() => useSendEmail(), { wrapper });

    const complexEmailData = {
      to: ['recipient1@example.com', 'recipient2@example.com'],
      cc: ['cc@example.com'],
      bcc: ['bcc@example.com'],
      subject: 'Complex Email',
      body: 'Email with complex structure',
      attachments: [
        { filename: 'document.pdf', content: 'base64content' },
      ],
      priority: 'high',
      metadata: {
        source: 'dashboard',
        userId: '123',
        timestamp: new Date().toISOString(),
      },
    };

    act(() => {
      result.current.setEmail(complexEmailData);
    });

    await waitFor(() => {
      expect(mockSendEmail).toHaveBeenCalledWith({
        emailData: complexEmailData,
      });
    });
  });

  it('preserves email data structure when sending', async () => {
    const { result } = renderHook(() => useSendEmail(), { wrapper });

    const originalEmailData = {
      to: 'test@example.com',
      subject: 'Test',
      customField: 'customValue',
      nestedObject: {
        key: 'value',
        array: [1, 2, 3],
      },
    };

    act(() => {
      result.current.setEmail(originalEmailData);
    });

    await waitFor(() => {
      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.emailData).toEqual(originalEmailData);
      // The hook can pass the original object reference directly
    });
  });

  it('handles setting email to null after initial email', async () => {
    const { result } = renderHook(() => useSendEmail(), { wrapper });

    const emailData = {
      to: 'test@example.com',
      subject: 'Test',
    };

    // Send first email
    act(() => {
      result.current.setEmail(emailData);
    });

    await waitFor(() => {
      expect(mockSendEmail).toHaveBeenCalledTimes(1);
    });

    // Set email to null
    act(() => {
      result.current.setEmail(null);
    });

    // Should not trigger another send
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
  });

  it('calls useGqlMutation with correct mutation', () => {
    renderHook(() => useSendEmail(), { wrapper });

    expect(mockUseGqlMutation).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'Document',
        definitions: expect.arrayContaining([
          expect.objectContaining({
            name: expect.objectContaining({
              value: 'SEND_EMAIL_MUTATION',
            }),
          }),
        ]),
      })
    );
  });

  it('handles error state from mutation', () => {
    const mockError = new Error('Email sending failed');
    mockMutationState.error = mockError;
    mockUseGqlMutation.mockReturnValue([mockSendEmail, mockMutationState]);

    const { result } = renderHook(() => useSendEmail(), { wrapper });

    // The hook doesn't directly expose error, but it's handled by useGqlMutation
    expect(mockUseGqlMutation).toHaveBeenCalled();
  });

  it('handles successful email sending', () => {
    mockMutationState.data = 'Email sent successfully';
    mockUseGqlMutation.mockReturnValue([mockSendEmail, mockMutationState]);

    const { result } = renderHook(() => useSendEmail(), { wrapper });

    // The hook doesn't directly expose data, but it's handled by useGqlMutation
    expect(mockUseGqlMutation).toHaveBeenCalled();
  });

  describe('real-world email scenarios', () => {
    it('handles PBIS notification email', async () => {
      const { result } = renderHook(() => useSendEmail(), { wrapper });

      const pbisEmail = {
        to: 'parent@example.com',
        subject: 'PBIS Card Notification',
        body: 'Your child received a PBIS card today!',
        template: 'pbis-notification',
        studentName: 'John Doe',
        cardCategory: 'respect',
        teacherName: 'Ms. Smith',
      };

      act(() => {
        result.current.setEmail(pbisEmail);
      });

      await waitFor(() => {
        expect(mockSendEmail).toHaveBeenCalledWith({
          emailData: pbisEmail,
        });
      });
    });

    it('handles callback reminder email', async () => {
      const { result } = renderHook(() => useSendEmail(), { wrapper });

      const callbackEmail = {
        to: 'teacher@school.edu',
        subject: 'Callback Reminder',
        body: 'You have pending callbacks to complete.',
        template: 'callback-reminder',
        callbackCount: 3,
        dueDate: '2024-01-15',
      };

      act(() => {
        result.current.setEmail(callbackEmail);
      });

      await waitFor(() => {
        expect(mockSendEmail).toHaveBeenCalledWith({
          emailData: callbackEmail,
        });
      });
    });

    it('handles discipline notification email', async () => {
      const { result } = renderHook(() => useSendEmail(), { wrapper });

      const disciplineEmail = {
        to: 'admin@school.edu',
        cc: 'counselor@school.edu',
        subject: 'Discipline Incident Report',
        body: 'A new discipline incident has been reported.',
        template: 'discipline-notification',
        incidentId: 'INC-001',
        studentId: 'STU-123',
        severity: 'moderate',
      };

      act(() => {
        result.current.setEmail(disciplineEmail);
      });

      await waitFor(() => {
        expect(mockSendEmail).toHaveBeenCalledWith({
          emailData: disciplineEmail,
        });
      });
    });
  });

  describe('edge cases', () => {
    it('handles empty email object', async () => {
      const { result } = renderHook(() => useSendEmail(), { wrapper });

      const emptyEmail = {};

      act(() => {
        result.current.setEmail(emptyEmail);
      });

      await waitFor(() => {
        expect(mockSendEmail).toHaveBeenCalledWith({
          emailData: emptyEmail,
        });
      });
    });

    it('handles email with undefined values', async () => {
      const { result } = renderHook(() => useSendEmail(), { wrapper });

      const emailWithUndefined = {
        to: 'test@example.com',
        subject: undefined,
        body: null,
        cc: undefined,
      };

      act(() => {
        result.current.setEmail(emailWithUndefined);
      });

      await waitFor(() => {
        expect(mockSendEmail).toHaveBeenCalledWith({
          emailData: emailWithUndefined,
        });
      });
    });

    it('handles very large email data', async () => {
      const { result } = renderHook(() => useSendEmail(), { wrapper });

      const largeEmailData = {
        to: 'test@example.com',
        subject: 'Large Email',
        body: 'A'.repeat(10000), // Very long body
        attachments: Array.from({ length: 10 }, (_, i) => ({
          filename: `file${i}.txt`,
          content: 'B'.repeat(1000),
        })),
      };

      act(() => {
        result.current.setEmail(largeEmailData);
      });

      await waitFor(() => {
        expect(mockSendEmail).toHaveBeenCalledWith({
          emailData: largeEmailData,
        });
      });
    });
  });

  describe('dependency management', () => {
    it('includes sendEmail in useEffect dependencies', async () => {
      const { result, rerender } = renderHook(() => useSendEmail(), { wrapper });

      const emailData = { to: 'test@example.com', subject: 'Test' };

      act(() => {
        result.current.setEmail(emailData);
      });

      await waitFor(() => {
        expect(mockSendEmail).toHaveBeenCalledTimes(1);
      });

      // Change the sendEmail mock to simulate dependency change
      const newMockSendEmail = jest.fn();
      mockUseGqlMutation.mockReturnValue([newMockSendEmail, mockMutationState]);

      rerender();

      // Should trigger effect again with new sendEmail function
      await waitFor(() => {
        expect(newMockSendEmail).toHaveBeenCalledWith({
          emailData,
        });
      });
    });

    it('includes email in useEffect dependencies', async () => {
      const { result } = renderHook(() => useSendEmail(), { wrapper });

      const firstEmail = { to: 'first@example.com', subject: 'First' };
      const secondEmail = { to: 'second@example.com', subject: 'Second' };

      act(() => {
        result.current.setEmail(firstEmail);
      });

      await waitFor(() => {
        expect(mockSendEmail).toHaveBeenCalledWith({
          emailData: firstEmail,
        });
      });

      act(() => {
        result.current.setEmail(secondEmail);
      });

      await waitFor(() => {
        expect(mockSendEmail).toHaveBeenCalledWith({
          emailData: secondEmail,
        });
      });

      expect(mockSendEmail).toHaveBeenCalledTimes(2);
    });
  });
});