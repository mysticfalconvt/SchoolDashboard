import {
  chromebookEmails,
  sendChromebookCheckEmails,
} from '../lib/chromebookEmailUtils';

// Mock the formatParentName function
jest.mock('../lib/nameUtils', () => ({
  formatParentName: jest.fn((name: string) => {
    if (!name) return '';
    if (name.includes(',')) {
      const parts = name.split(',').map((part) => part.trim());
      const [last, ...firstParts] = parts;
      const first = firstParts.join(', ');
      return `${first} ${last}`;
    }
    return name;
  }),
}));

describe('chromebookEmailUtils', () => {
  const mockSendEmail = jest.fn();
  const mockOnProgress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock setTimeout to run immediately for faster tests
    jest.spyOn(global, 'setTimeout').mockImplementation((callback) => {
      callback();
      return 0 as any;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('sendChromebookCheckEmails', () => {
    const baseStudent = {
      id: '1',
      name: 'John Doe',
      email: 'john.doe@example.com',
      parent: [
        {
          id: 'p1',
          name: 'Smith, Jane',
          email: 'jane.smith@example.com',
        },
        {
          id: 'p2',
          name: 'Smith, Bob',
          email: 'bob.smith@example.com',
        },
      ],
    };

    const baseParams = {
      student: baseStudent,
      teacherName: 'Ms. Teacher',
      teacherEmail: 'teacher@school.com',
      issueDetails: 'Chromebook has a broken screen',
      sendEmail: mockSendEmail,
    };

    it('should send emails to staff, student, and parents', async () => {
      await sendChromebookCheckEmails(baseParams);

      // Should send to all staff emails
      expect(mockSendEmail).toHaveBeenCalledTimes(6); // 3 staff + 1 student + 2 parents

      // Check staff emails
      chromebookEmails.forEach((email) => {
        expect(mockSendEmail).toHaveBeenCalledWith({
          emailData: expect.objectContaining({
            toAddress: email,
            fromAddress: 'teacher@school.com',
            subject: 'New Chromebook Check for John Doe',
            body: expect.stringContaining('John Doe'),
          }),
        });
      });

      // Check student email
      expect(mockSendEmail).toHaveBeenCalledWith({
        emailData: expect.objectContaining({
          toAddress: 'john.doe@example.com',
          fromAddress: 'teacher@school.com',
          subject: 'Chromebook Check Notification - John Doe',
          body: expect.stringContaining('Dear John Doe'),
        }),
      });

      // Check parent emails
      expect(mockSendEmail).toHaveBeenCalledWith({
        emailData: expect.objectContaining({
          toAddress: 'jane.smith@example.com',
          fromAddress: 'teacher@school.com',
          subject: 'Chromebook Check Notification - John Doe',
          body: expect.stringContaining('Dear Jane Smith'),
        }),
      });

      expect(mockSendEmail).toHaveBeenCalledWith({
        emailData: expect.objectContaining({
          toAddress: 'bob.smith@example.com',
          fromAddress: 'teacher@school.com',
          subject: 'Chromebook Check Notification - John Doe',
          body: expect.stringContaining('Dear Bob Smith'),
        }),
      });
    });

    it('should not send student email if student has no email', async () => {
      const studentWithoutEmail = { ...baseStudent, email: undefined };

      await sendChromebookCheckEmails({
        ...baseParams,
        student: studentWithoutEmail,
      });

      // Should only send to staff and parents (no student email)
      expect(mockSendEmail).toHaveBeenCalledTimes(5); // 3 staff + 2 parents

      // Verify no student email was sent
      const studentEmailCalls = mockSendEmail.mock.calls.filter(
        (call) => call[0].emailData.toAddress === 'john.doe@example.com',
      );
      expect(studentEmailCalls).toHaveLength(0);
    });

    it('should not send parent emails if parents have no emails', async () => {
      const studentWithoutParentEmails = {
        ...baseStudent,
        parent: [
          { id: 'p1', name: 'Smith, Jane', email: undefined },
          { id: 'p2', name: 'Smith, Bob', email: undefined },
        ],
      };

      await sendChromebookCheckEmails({
        ...baseParams,
        student: studentWithoutParentEmails,
      });

      // Should only send to staff and student (no parent emails)
      expect(mockSendEmail).toHaveBeenCalledTimes(4); // 3 staff + 1 student

      // Verify no parent emails were sent
      const parentEmailCalls = mockSendEmail.mock.calls.filter(
        (call) =>
          call[0].emailData.toAddress === 'jane.smith@example.com' ||
          call[0].emailData.toAddress === 'bob.smith@example.com',
      );
      expect(parentEmailCalls).toHaveLength(0);
    });

    it('should handle student with no parents', async () => {
      const studentWithoutParents = { ...baseStudent, parent: undefined };

      await sendChromebookCheckEmails({
        ...baseParams,
        student: studentWithoutParents,
      });

      // Should only send to staff and student (no parents)
      expect(mockSendEmail).toHaveBeenCalledTimes(4); // 3 staff + 1 student

      // Verify no parent emails were sent
      const parentEmailCalls = mockSendEmail.mock.calls.filter(
        (call) =>
          call[0].emailData.toAddress === 'jane.smith@example.com' ||
          call[0].emailData.toAddress === 'bob.smith@example.com',
      );
      expect(parentEmailCalls).toHaveLength(0);
    });

    it('should call onProgress with correct counts', async () => {
      await sendChromebookCheckEmails({
        ...baseParams,
        onProgress: mockOnProgress,
      });

      // Should call onProgress for each email sent
      expect(mockOnProgress).toHaveBeenCalledTimes(6); // 3 staff + 1 student + 2 parents

      // Check progress calls
      expect(mockOnProgress).toHaveBeenNthCalledWith(1, { sent: 1, total: 6 });
      expect(mockOnProgress).toHaveBeenNthCalledWith(2, { sent: 2, total: 6 });
      expect(mockOnProgress).toHaveBeenNthCalledWith(3, { sent: 3, total: 6 });
      expect(mockOnProgress).toHaveBeenNthCalledWith(4, { sent: 4, total: 6 });
      expect(mockOnProgress).toHaveBeenNthCalledWith(5, { sent: 5, total: 6 });
      expect(mockOnProgress).toHaveBeenNthCalledWith(6, { sent: 6, total: 6 });
    });

    it('should calculate correct total emails for student without email', async () => {
      const studentWithoutEmail = { ...baseStudent, email: undefined };

      await sendChromebookCheckEmails({
        ...baseParams,
        student: studentWithoutEmail,
        onProgress: mockOnProgress,
      });

      // Should call onProgress for each email sent (5 total: 3 staff + 2 parents)
      expect(mockOnProgress).toHaveBeenCalledTimes(5);

      // Check progress calls
      expect(mockOnProgress).toHaveBeenNthCalledWith(1, { sent: 1, total: 5 });
      expect(mockOnProgress).toHaveBeenNthCalledWith(5, { sent: 5, total: 5 });
    });

    it('should include issue details in all emails', async () => {
      const issueDetails = 'Screen is completely broken and needs replacement';

      await sendChromebookCheckEmails({
        ...baseParams,
        issueDetails,
      });

      // Check that issue details are included in all emails
      mockSendEmail.mock.calls.forEach((call) => {
        expect(call[0].emailData.body).toContain(issueDetails);
      });
    });

    it('should format parent names correctly', async () => {
      await sendChromebookCheckEmails(baseParams);

      // Check that parent names are formatted correctly
      const parentEmailCalls = mockSendEmail.mock.calls.filter(
        (call) =>
          call[0].emailData.toAddress === 'jane.smith@example.com' ||
          call[0].emailData.toAddress === 'bob.smith@example.com',
      );

      expect(parentEmailCalls).toHaveLength(2);

      // Check that "Smith, Jane" becomes "Jane Smith"
      const janeEmail = parentEmailCalls.find(
        (call) => call[0].emailData.toAddress === 'jane.smith@example.com',
      );
      expect(janeEmail[0].emailData.body).toContain('Dear Jane Smith');

      // Check that "Smith, Bob" becomes "Bob Smith"
      const bobEmail = parentEmailCalls.find(
        (call) => call[0].emailData.toAddress === 'bob.smith@example.com',
      );
      expect(bobEmail[0].emailData.body).toContain('Dear Bob Smith');
    });

    it('should handle parent names without commas', async () => {
      const studentWithSimpleNames = {
        ...baseStudent,
        parent: [
          { id: 'p1', name: 'Jane Smith', email: 'jane.smith@example.com' },
        ],
      };

      await sendChromebookCheckEmails({
        ...baseParams,
        student: studentWithSimpleNames,
      });

      // Check that simple names are handled correctly
      const janeEmail = mockSendEmail.mock.calls.find(
        (call) => call[0].emailData.toAddress === 'jane.smith@example.com',
      );
      expect(janeEmail[0].emailData.body).toContain('Dear Jane Smith');
    });

    it('should handle empty parent names', async () => {
      const studentWithEmptyNames = {
        ...baseStudent,
        parent: [{ id: 'p1', name: '', email: 'jane.smith@example.com' }],
      };

      await sendChromebookCheckEmails({
        ...baseParams,
        student: studentWithEmptyNames,
      });

      // Check that empty names default to 'Parent/Guardian'
      const janeEmail = mockSendEmail.mock.calls.find(
        (call) => call[0].emailData.toAddress === 'jane.smith@example.com',
      );
      expect(janeEmail[0].emailData.body).toContain('Dear Parent/Guardian');
    });
  });

  describe('chromebookEmails', () => {
    it('should contain the expected staff email addresses', () => {
      expect(chromebookEmails).toEqual([
        'robert.boskind@ncsuvt.org',
        'Joyce.Lantagne@ncsuvt.org',
        'katlynn.cochran@ncsuvt.org',
      ]);
    });

    it('should have exactly 3 staff email addresses', () => {
      expect(chromebookEmails).toHaveLength(3);
    });
  });
});
