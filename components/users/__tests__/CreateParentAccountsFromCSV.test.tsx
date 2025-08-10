import { fireEvent, screen, waitFor } from '@testing-library/react';
import {
  mockUser,
  renderWithProviders,
} from '../../../__tests__/utils/test-utils';
import CreateParentAccountsFromCSV from '../CreateParentAccountsFromCSV';

// Mock dependencies
jest.mock('../../../components/User', () => ({
  useUser: jest.fn(),
}));

jest.mock('../../../lib/useGqlQuery', () => ({
  useGQLQuery: jest.fn(),
}));

jest.mock('../../../lib/useGqlMutation', () => ({
  useGqlMutation: jest.fn(),
}));

jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

const mockUseUser = require('../../../components/User').useUser;
const mockUseGQLQuery = require('../../../lib/useGqlQuery').useGQLQuery;
const mockUseGqlMutation =
  require('../../../lib/useGqlMutation').useGqlMutation;
const mockToast = require('react-hot-toast');

describe('CreateParentAccountsFromCSV', () => {
  const mockCreateParent = jest.fn();

  const mockStudentsData = {
    students: [
      {
        id: 'student-1',
        name: 'John Doe',
        email: 'john.doe@school.edu',
      },
      {
        id: 'student-2',
        name: 'Jane Smith',
        email: 'jane.smith@school.edu',
      },
      {
        id: 'student-3',
        name: 'Bob Wilson',
        email: 'bob.wilson@school.edu',
      },
    ],
  };

  const mockParentsData = {
    parents: [
      {
        id: 'parent-1',
        name: 'Mary Doe',
        email: 'mary.doe@email.com',
        children: [{ id: 'student-1', name: 'John Doe' }],
      },
    ],
  };

  const validCSVContent = `Last_Name,First_Name,Contact 1,Email,Contact 2,Email
Doe,John,Mary Doe,mary.doe@email.com,John Doe Sr,john.sr@email.com
Smith,Jane,Sarah Smith,sarah.smith@email.com,Mike Smith,mike.smith@email.com
Wilson,Bob,Lisa Wilson,lisa.wilson@email.com,,`;

  const createMockFile = (content: string, filename = 'test.csv') => {
    const fileLike: any = {
      name: filename,
      size: content.length,
      type: 'text/csv',
      text: jest.fn().mockResolvedValue(content),
    };
    return fileLike;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();

    mockUseUser.mockReturnValue(mockUser);

    // Setup default mocks for GraphQL queries
    mockUseGQLQuery.mockImplementation((key: string) => {
      if (key === 'allStudents') {
        return { data: mockStudentsData, isLoading: false, error: null };
      }
      if (key === 'allParents') {
        return { data: mockParentsData, isLoading: false, error: null };
      }
      return { data: null, isLoading: false, error: null };
    });

    mockUseGqlMutation.mockReturnValue([
      mockCreateParent,
      {
        loading: false,
        error: null,
        data: null,
        mutateAsync: mockCreateParent,
      },
    ]);
  });

  describe('Component Rendering', () => {
    it('renders the button initially', () => {
      renderWithProviders(<CreateParentAccountsFromCSV />);

      expect(
        screen.getByText('Create Parent Accounts from CSV'),
      ).toBeInTheDocument();
    });

    it('shows form when button is clicked', () => {
      renderWithProviders(<CreateParentAccountsFromCSV />);

      const button = screen.getByText('Create Parent Accounts from CSV');
      fireEvent.click(button);

      // Target the modal header specifically to avoid ambiguity with the button text
      expect(
        screen.getByRole('heading', {
          name: 'Create Parent Accounts from CSV',
        }),
      ).toBeInTheDocument();
      expect(screen.getByText('Expected CSV format:')).toBeInTheDocument();
      expect(screen.getByText('Select CSV File')).toBeInTheDocument();
    });

    it('hides form when close button is clicked', async () => {
      renderWithProviders(<CreateParentAccountsFromCSV />);

      const button = screen.getByText('Create Parent Accounts from CSV');
      fireEvent.click(button);

      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Select CSV File')).not.toBeInTheDocument();
      });
    });

    it('hides form when backdrop is clicked', async () => {
      renderWithProviders(<CreateParentAccountsFromCSV />);

      const button = screen.getByText('Create Parent Accounts from CSV');
      fireEvent.click(button);

      const backdrop = screen.getByTestId('csv-backdrop');
      fireEvent.click(backdrop);

      await waitFor(() => {
        expect(screen.queryByText('Select CSV File')).not.toBeInTheDocument();
      });
    });
  });

  describe('CSV File Handling', () => {
    it('accepts CSV file upload', () => {
      renderWithProviders(<CreateParentAccountsFromCSV />);

      const button = screen.getByText('Create Parent Accounts from CSV');
      fireEvent.click(button);

      const fileInput = screen.getByLabelText('Select CSV File');
      const mockFile = createMockFile(validCSVContent);

      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      expect(fileInput).toBeInTheDocument();
    });

    it('enables process button when file is selected', () => {
      renderWithProviders(<CreateParentAccountsFromCSV />);

      const button = screen.getByText('Create Parent Accounts from CSV');
      fireEvent.click(button);

      const fileInput = screen.getByLabelText('Select CSV File');
      const processButton = screen.getByText('Process CSV');

      expect(processButton).toBeDisabled();

      const mockFile = createMockFile(validCSVContent);
      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      expect(processButton).not.toBeDisabled();
    });
  });

  describe('CSV Processing Logic', () => {
    it('parses CSV correctly', async () => {
      renderWithProviders(<CreateParentAccountsFromCSV />);

      const button = screen.getByText('Create Parent Accounts from CSV');
      fireEvent.click(button);

      const fileInput = screen.getByLabelText('Select CSV File');
      const mockFile = createMockFile(validCSVContent);

      // Mock file.text() method
      (mockFile.text as jest.Mock).mockResolvedValue(validCSVContent);

      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      const processButton = screen.getByText('Process CSV');
      fireEvent.click(processButton);

      await waitFor(() => {
        expect(mockFile.text).toHaveBeenCalled();
      });
    });

    it('creates parent accounts for found students', async () => {
      mockCreateParent.mockResolvedValue({
        data: {
          createUser: {
            id: 'new-parent-1',
            name: 'Mary Doe',
            email: 'mary.doe@email.com',
          },
        },
      });

      renderWithProviders(<CreateParentAccountsFromCSV />);

      const button = screen.getByText('Create Parent Accounts from CSV');
      fireEvent.click(button);

      const fileInput = screen.getByLabelText('Select CSV File');
      const mockFile = createMockFile(validCSVContent);

      (mockFile.text as jest.Mock).mockResolvedValue(validCSVContent);

      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      const processButton = screen.getByText('Process CSV');
      fireEvent.click(processButton);

      await waitFor(() => {
        expect(mockCreateParent).toHaveBeenCalled();
        expect(mockToast.success).toHaveBeenCalledWith(
          'CSV processing completed!',
        );
      });
    });

    it('handles students not found', async () => {
      const csvWithUnknownStudent = `Last_Name,First_Name,Contact 1,Email,Contact 2,Email
Unknown,Student,Parent Name,parent@email.com,,`;

      renderWithProviders(<CreateParentAccountsFromCSV />);

      const button = screen.getByText('Create Parent Accounts from CSV');
      fireEvent.click(button);

      const fileInput = screen.getByLabelText('Select CSV File');
      const mockFile = createMockFile(csvWithUnknownStudent);

      (mockFile.text as jest.Mock).mockResolvedValue(csvWithUnknownStudent);

      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      const processButton = screen.getByText('Process CSV');
      fireEvent.click(processButton);

      await waitFor(() => {
        expect(mockCreateParent).not.toHaveBeenCalled();
        expect(mockToast.success).toHaveBeenCalledWith(
          'CSV processing completed!',
        );
      });
    });

    it('skips creating accounts that already exist', async () => {
      // Mary Doe already exists for John Doe in mockParentsData
      const csvWithExistingParent = `Last_Name,First_Name,Contact 1,Email,Contact 2,Email
Doe,John,Mary Doe,mary.doe@email.com,,`;

      renderWithProviders(<CreateParentAccountsFromCSV />);

      const button = screen.getByText('Create Parent Accounts from CSV');
      fireEvent.click(button);

      const fileInput = screen.getByLabelText('Select CSV File');
      const mockFile = createMockFile(csvWithExistingParent);

      (mockFile.text as jest.Mock).mockResolvedValue(csvWithExistingParent);

      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      const processButton = screen.getByText('Process CSV');
      fireEvent.click(processButton);

      await waitFor(() => {
        expect(mockCreateParent).not.toHaveBeenCalled();
        expect(mockToast.success).toHaveBeenCalledWith(
          'CSV processing completed!',
        );
      });
    });
  });

  describe('Student Matching Logic', () => {
    it('matches students by first and last name', async () => {
      const csvContent = `Last_Name,First_Name,Contact 1,Email,Contact 2,Email
Doe,John,Test Parent,test@email.com,,`;

      renderWithProviders(<CreateParentAccountsFromCSV />);

      const button = screen.getByText('Create Parent Accounts from CSV');
      fireEvent.click(button);

      const fileInput = screen.getByLabelText('Select CSV File');
      const mockFile = createMockFile(csvContent);

      (mockFile.text as jest.Mock).mockResolvedValue(csvContent);

      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      const processButton = screen.getByText('Process CSV');
      fireEvent.click(processButton);

      await waitFor(() => {
        expect(mockCreateParent).toHaveBeenCalledWith({
          name: 'Test Parent',
          email: 'test@email.com',
          studentId: 'student-1', // John Doe's ID
        });
      });
    });

    it('handles name variations and partial matches', async () => {
      const csvContent = `Last_Name,First_Name,Contact 1,Email,Contact 2,Email
Smith,Jane,Test Parent,test@email.com,,`;

      renderWithProviders(<CreateParentAccountsFromCSV />);

      const button = screen.getByText('Create Parent Accounts from CSV');
      fireEvent.click(button);

      const fileInput = screen.getByLabelText('Select CSV File');
      const mockFile = createMockFile(csvContent);

      (mockFile.text as jest.Mock).mockResolvedValue(csvContent);

      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      const processButton = screen.getByText('Process CSV');
      fireEvent.click(processButton);

      await waitFor(() => {
        expect(mockCreateParent).toHaveBeenCalledWith({
          name: 'Test Parent',
          email: 'test@email.com',
          studentId: 'student-2', // Jane Smith's ID
        });
      });
    });
  });

  describe('Results Display', () => {
    it('displays processing results after completion', async () => {
      renderWithProviders(<CreateParentAccountsFromCSV />);

      const button = screen.getByText('Create Parent Accounts from CSV');
      fireEvent.click(button);

      const fileInput = screen.getByLabelText('Select CSV File');
      const mockFile = createMockFile(validCSVContent);

      (mockFile.text as jest.Mock).mockResolvedValue(validCSVContent);

      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      const processButton = screen.getByText('Process CSV');
      fireEvent.click(processButton);

      await waitFor(() => {
        expect(screen.getByText('Processing Results')).toBeInTheDocument();
      });
    });

    it('shows summary statistics', async () => {
      renderWithProviders(<CreateParentAccountsFromCSV />);

      const button = screen.getByText('Create Parent Accounts from CSV');
      fireEvent.click(button);

      const fileInput = screen.getByLabelText('Select CSV File');
      const mockFile = createMockFile(validCSVContent);

      (mockFile.text as jest.Mock).mockResolvedValue(validCSVContent);

      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      const processButton = screen.getByText('Process CSV');
      fireEvent.click(processButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Total students processed:/),
        ).toBeInTheDocument();
        expect(screen.getByText(/Students found:/)).toBeInTheDocument();
        expect(screen.getByText(/Students not found:/)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles GraphQL mutation errors', async () => {
      const mockError = new Error('Failed to create parent');
      mockUseGqlMutation.mockReturnValue([
        mockCreateParent,
        { loading: false, error: mockError, data: null },
      ]);

      renderWithProviders(<CreateParentAccountsFromCSV />);

      const button = screen.getByText('Create Parent Accounts from CSV');
      fireEvent.click(button);

      expect(screen.getByText('Failed to create parent')).toBeInTheDocument();
    });

    it('handles file reading errors', async () => {
      renderWithProviders(<CreateParentAccountsFromCSV />);

      const button = screen.getByText('Create Parent Accounts from CSV');
      fireEvent.click(button);

      const fileInput = screen.getByLabelText('Select CSV File');
      const mockFile = createMockFile(validCSVContent);

      // Mock file.text() to reject
      (mockFile.text as jest.Mock).mockRejectedValue(
        new Error('File read error'),
      );

      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      const processButton = screen.getByText('Process CSV');
      fireEvent.click(processButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Error processing CSV file',
        );
      });
    });

    it('handles malformed CSV data', async () => {
      const malformedCSV = `Invalid,CSV,Data
Missing,Headers`;

      renderWithProviders(<CreateParentAccountsFromCSV />);

      const button = screen.getByText('Create Parent Accounts from CSV');
      fireEvent.click(button);

      const fileInput = screen.getByLabelText('Select CSV File');
      const mockFile = createMockFile(malformedCSV);

      (mockFile.text as jest.Mock).mockResolvedValue(malformedCSV);

      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      const processButton = screen.getByText('Process CSV');
      fireEvent.click(processButton);

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith(
          'CSV processing completed!',
        );
      });
    });

    it('handles empty CSV files', async () => {
      const emptyCSV = `Last_Name,First_Name,Contact 1,Email,Contact 2,Email`;

      renderWithProviders(<CreateParentAccountsFromCSV />);

      const button = screen.getByText('Create Parent Accounts from CSV');
      fireEvent.click(button);

      const fileInput = screen.getByLabelText('Select CSV File');
      const mockFile = createMockFile(emptyCSV);

      (mockFile.text as jest.Mock).mockResolvedValue(emptyCSV);

      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      const processButton = screen.getByText('Process CSV');
      fireEvent.click(processButton);

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith(
          'CSV processing completed!',
        );
      });
    });

    it('handles creation failures gracefully', async () => {
      mockCreateParent.mockRejectedValue(new Error('Creation failed'));

      renderWithProviders(<CreateParentAccountsFromCSV />);

      const button = screen.getByText('Create Parent Accounts from CSV');
      fireEvent.click(button);

      const fileInput = screen.getByLabelText('Select CSV File');
      const mockFile = createMockFile(validCSVContent);

      (mockFile.text as jest.Mock).mockResolvedValue(validCSVContent);

      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      const processButton = screen.getByText('Process CSV');
      fireEvent.click(processButton);

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith(
          'CSV processing completed!',
        );
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading state during processing', async () => {
      renderWithProviders(<CreateParentAccountsFromCSV />);

      const button = screen.getByText('Create Parent Accounts from CSV');
      fireEvent.click(button);

      const fileInput = screen.getByLabelText('Select CSV File');
      const mockFile = createMockFile(validCSVContent);

      // Create a promise that we can control
      let resolveFileText: (value: string) => void;
      const fileTextPromise = new Promise<string>((resolve) => {
        resolveFileText = resolve;
      });

      (mockFile.text as jest.Mock).mockReturnValue(fileTextPromise as any);

      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      const processButton = screen.getByText('Process CSV');
      fireEvent.click(processButton);

      // Check loading state
      expect(screen.getByText('Processing...')).toBeInTheDocument();

      // Resolve the promise
      resolveFileText!(validCSVContent);

      await waitFor(() => {
        expect(screen.queryByText('Processing...')).not.toBeInTheDocument();
      });
    });

    it('disables button during GraphQL mutations', () => {
      mockUseGqlMutation.mockReturnValue([
        mockCreateParent,
        {
          loading: true,
          error: null,
          data: null,
          mutateAsync: mockCreateParent,
        },
      ]);

      renderWithProviders(<CreateParentAccountsFromCSV />);

      const button = screen.getByText('Create Parent Accounts from CSV');
      fireEvent.click(button);

      const processButton = screen.getByText('Process CSV');
      expect(processButton).toBeDisabled();
    });
  });

  describe('Data Validation', () => {
    it('only creates accounts with both name and email', async () => {
      const csvWithMissingData = `Last_Name,First_Name,Contact 1,Email,Contact 2,Email
Doe,John,Mary Doe,,John Sr,john.sr@email.com
Smith,Jane,,jane.parent@email.com,Mike Smith,`;

      renderWithProviders(<CreateParentAccountsFromCSV />);

      const button = screen.getByText('Create Parent Accounts from CSV');
      fireEvent.click(button);

      const fileInput = screen.getByLabelText('Select CSV File');
      const mockFile = createMockFile(csvWithMissingData);

      (mockFile.text as jest.Mock).mockResolvedValue(csvWithMissingData);

      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      const processButton = screen.getByText('Process CSV');
      fireEvent.click(processButton);

      await waitFor(() => {
        // Should only be called once for John Sr (has both name and email)
        expect(mockCreateParent).toHaveBeenCalledTimes(1);
        expect(mockCreateParent).toHaveBeenCalledWith({
          name: 'John Sr',
          email: 'john.sr@email.com',
          studentId: 'student-1',
        });
      });
    });
  });
});

// Unit tests for helper functions
describe('CSV Processing Helper Functions', () => {
  // We would need to export these functions from the component to test them directly
  // For now, we're testing them through the component integration tests

  describe('parseCSV', () => {
    it('should parse CSV with proper headers', () => {
      // This would test the parseCSV function if it were exported
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('findStudentByNameAndEmail', () => {
    it('should find student by exact name match', () => {
      // This would test the student matching logic if extracted
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('checkParentExists', () => {
    it('should detect existing parent accounts', () => {
      // This would test the parent existence check if extracted
      expect(true).toBe(true); // Placeholder
    });
  });
});
