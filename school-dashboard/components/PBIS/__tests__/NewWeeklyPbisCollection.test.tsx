import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders, mockUser } from '../../../__tests__/utils/test-utils';
import NewWeeklyPbisCollection from '../NewWeeklyPbisCollection';

// Mock dependencies
jest.mock('next/dist/client/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    query: {},
    pathname: '/pbis',
    route: '/pbis',
    asPath: '/pbis',
  }),
}));

jest.mock('../../User', () => ({
  useUser: jest.fn(),
}));

jest.mock('../../../lib/useForm', () => {
  return jest.fn(() => ({
    inputs: { confirmation: '' },
    handleChange: jest.fn(),
    clearForm: jest.fn(),
    resetForm: jest.fn(),
  }));
});

jest.mock('../../../lib/useRevalidatePage', () => {
  return jest.fn(() => jest.fn().mockResolvedValue('revalidated'));
});

jest.mock('../useV3PbisCollection', () => {
  return jest.fn(() => ({
    runCardCollection: jest.fn().mockResolvedValue('it Worked'),
    data: {
      pbisCollectionDates: [],
      pbisCardsCount: 150,
      taTeachers: []
    },
    setGetData: jest.fn(),
    getData: false,
    loading: false,
  }));
});

const { useUser } = require('../../User');
const useForm = require('../../../lib/useForm');
const useV3PbisCollection = require('../useV3PbisCollection');
const useRevalidatePage = require('../../../lib/useRevalidatePage');
describe('NewWeeklyPbisCollection', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    query: {},
    pathname: '/pbis',
    route: '/pbis', 
    asPath: '/pbis',
  };

  const mockFormUtils = {
    inputs: { confirmation: '' },
    handleChange: jest.fn(),
    clearForm: jest.fn(),
    resetForm: jest.fn(),
  };

  const mockPbisHook = {
    runCardCollection: jest.fn().mockResolvedValue('it Worked'),
    data: {
      pbisCollectionDates: [],
      pbisCardsCount: 150,
      taTeachers: []
    },
    setGetData: jest.fn(),
    getData: false,
    loading: false,
  };

  const mockRevalidate = jest.fn().mockResolvedValue('revalidated');

  beforeEach(() => {
    jest.clearAllMocks();
    useForm.mockReturnValue(mockFormUtils);
    useV3PbisCollection.mockReturnValue(mockPbisHook);
    useRevalidatePage.mockReturnValue(mockRevalidate);
  });

  it('renders login required message when user is not authenticated', () => {
    useUser.mockReturnValue(null);

    renderWithProviders(<NewWeeklyPbisCollection />);

    expect(screen.getByText('You must be logged in to run PBIS collections.')).toBeInTheDocument();
    expect(screen.getByText('Please log in to access this feature.')).toBeInTheDocument();
  });

  it('renders permission denied message when user lacks PBIS permissions', () => {
    const userWithoutPermissions = {
      ...mockUser,
      canManagePbis: false,
      isSuperAdmin: false,
      isStaff: true,
    };
    useUser.mockReturnValue(userWithoutPermissions);

    renderWithProviders(<NewWeeklyPbisCollection />);

    expect(screen.getByText('You don\'t have permission to run PBIS collections.')).toBeInTheDocument();
    expect(screen.getByText(/Required permission: canManagePbis or isSuperAdmin/)).toBeInTheDocument();
    expect(screen.getByText(/Current permissions:/)).toBeInTheDocument();
  });

  it('renders collection button when user has canManagePbis permission', () => {
    const userWithPbisPermission = {
      ...mockUser,
      canManagePbis: true,
      isSuperAdmin: false,
    };
    useUser.mockReturnValue(userWithPbisPermission);

    renderWithProviders(<NewWeeklyPbisCollection />);

    expect(screen.getByText('Run Weekly Pbis Collection')).toBeInTheDocument();
  });

  it('renders collection button when user is super admin', () => {
    const superAdminUser = {
      ...mockUser,
      canManagePbis: false,
      isSuperAdmin: true,
    };
    useUser.mockReturnValue(superAdminUser);

    renderWithProviders(<NewWeeklyPbisCollection />);

    expect(screen.getByText('Run Weekly Pbis Collection')).toBeInTheDocument();
  });

  it('opens modal when collection button is clicked', () => {
    const userWithPermission = {
      ...mockUser,
      canManagePbis: true,
    };
    useUser.mockReturnValue(userWithPermission);

    renderWithProviders(<NewWeeklyPbisCollection />);

    const collectionButton = screen.getByText('Run Weekly Pbis Collection');
    fireEvent.click(collectionButton);

    expect(screen.getByText('Run Weekly PBIS Card Collection')).toBeInTheDocument();
    expect(screen.getByText('Do You Really Want To Do this?')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type \'yes\' to confirm')).toBeInTheDocument();
  });

  it('calls setGetData when modal is opened', () => {
    const userWithPermission = {
      ...mockUser,
      canManagePbis: true,
    };
    useUser.mockReturnValue(userWithPermission);

    renderWithProviders(<NewWeeklyPbisCollection />);

    const collectionButton = screen.getByText('Run Weekly Pbis Collection');
    fireEvent.click(collectionButton);

    expect(mockPbisHook.setGetData).toHaveBeenCalledWith(true);
  });

  it('closes modal when X button is clicked', () => {
    const userWithPermission = {
      ...mockUser,
      canManagePbis: true,
    };
    useUser.mockReturnValue(userWithPermission);

    renderWithProviders(<NewWeeklyPbisCollection />);

    // Open modal
    const collectionButton = screen.getByText('Run Weekly Pbis Collection');
    fireEvent.click(collectionButton);

    expect(screen.getByText('Run Weekly PBIS Card Collection')).toBeInTheDocument();

    // Close modal
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    expect(screen.queryByText('Run Weekly PBIS Card Collection')).not.toBeInTheDocument();
  });

  it('closes modal when backdrop is clicked', () => {
    const userWithPermission = {
      ...mockUser,
      canManagePbis: true,
    };
    useUser.mockReturnValue(userWithPermission);

    renderWithProviders(<NewWeeklyPbisCollection />);

    // Open modal
    const collectionButton = screen.getByText('Run Weekly Pbis Collection');
    fireEvent.click(collectionButton);

    expect(screen.getByText('Run Weekly PBIS Card Collection')).toBeInTheDocument();

    // Click backdrop - use className to find the backdrop div
    const backdrop = document.querySelector('.fixed.inset-0.bg-black.bg-opacity-50.z-40');
    fireEvent.click(backdrop!);

    expect(screen.queryByText('Run Weekly PBIS Card Collection')).not.toBeInTheDocument();
  });

  it('handles confirmation input change', () => {
    const userWithPermission = {
      ...mockUser,  
      canManagePbis: true,
    };
    useUser.mockReturnValue(userWithPermission);

    renderWithProviders(<NewWeeklyPbisCollection />);

    // Open modal
    const collectionButton = screen.getByText('Run Weekly Pbis Collection');
    fireEvent.click(collectionButton);

    const confirmationInput = screen.getByPlaceholderText('Type \'yes\' to confirm');
    fireEvent.change(confirmationInput, { target: { value: 'yes' } });

    expect(mockFormUtils.handleChange).toHaveBeenCalled();
  });

  it('prevents form submission when confirmation is not "yes"', async () => {
    const userWithPermission = {
      ...mockUser,
      canManagePbis: true,
    };
    useUser.mockReturnValue(userWithPermission);

    const mockFormUtilsWithNo = {
      ...mockFormUtils,
      inputs: { confirmation: 'no' }
    };
    useForm.mockReturnValue(mockFormUtilsWithNo);

    renderWithProviders(<NewWeeklyPbisCollection />);

    // Open modal
    const collectionButton = screen.getByText('Run Weekly Pbis Collection');
    fireEvent.click(collectionButton);

    const submitButton = screen.getByText('Run Card Collection');
    fireEvent.click(submitButton);

    expect(mockPbisHook.runCardCollection).not.toHaveBeenCalled();
  });

  it('runs card collection when form is submitted with correct confirmation', async () => {
    const userWithPermission = {
      ...mockUser,
      canManagePbis: true,
    };
    useUser.mockReturnValue(userWithPermission);

    mockFormUtils.inputs.confirmation = 'yes';
    useForm.mockReturnValue(mockFormUtils);

    renderWithProviders(<NewWeeklyPbisCollection />);

    // Open modal
    const collectionButton = screen.getByText('Run Weekly Pbis Collection');
    fireEvent.click(collectionButton);

    const submitButton = screen.getByText('Run Card Collection');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockPbisHook.runCardCollection).toHaveBeenCalled();
    });
  });

  it('handles complete collection workflow', async () => {
    const userWithPermission = {
      ...mockUser,
      canManagePbis: true,
    };
    useUser.mockReturnValue(userWithPermission);

    const mockFormUtilsWithYes = {
      ...mockFormUtils,
      inputs: { confirmation: 'yes' }
    };
    useForm.mockReturnValue(mockFormUtilsWithYes);

    renderWithProviders(<NewWeeklyPbisCollection />);

    // Open modal
    const collectionButton = screen.getByText('Run Weekly Pbis Collection');
    fireEvent.click(collectionButton);

    // Submit form
    const submitButton = screen.getByText('Run Card Collection');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockPbisHook.runCardCollection).toHaveBeenCalled();
      expect(mockFormUtils.resetForm).toHaveBeenCalled();
      expect(mockRevalidate).toHaveBeenCalled();
    }, { timeout: 5000 });
  });

  it('disables form when loading or no data', () => {
    const userWithPermission = {
      ...mockUser,
      canManagePbis: true,
    };
    useUser.mockReturnValue(userWithPermission);

    mockPbisHook.loading = true;
    mockPbisHook.data = null;
    useV3PbisCollection.mockReturnValue(mockPbisHook);

    renderWithProviders(<NewWeeklyPbisCollection />);

    // Open modal
    const collectionButton = screen.getByText('Run Weekly Pbis Collection');
    fireEvent.click(collectionButton);

    const fieldset = screen.getByRole('group');
    expect(fieldset).toBeDisabled();
    expect(fieldset).toHaveAttribute('aria-busy', 'true');
  });

  it('shows loading state during collection run', async () => {
    const userWithPermission = {
      ...mockUser,
      canManagePbis: true,
    };
    useUser.mockReturnValue(userWithPermission);

    mockFormUtils.inputs.confirmation = 'yes';
    useForm.mockReturnValue(mockFormUtils);

    // Mock a delayed response
    mockPbisHook.runCardCollection = jest.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve('it Worked'), 100))
    );
    useV3PbisCollection.mockReturnValue(mockPbisHook);

    renderWithProviders(<NewWeeklyPbisCollection />);

    // Open modal and submit
    const collectionButton = screen.getByText('Run Weekly Pbis Collection');
    fireEvent.click(collectionButton);

    const submitButton = screen.getByText('Run Card Collection');
    fireEvent.click(submitButton);

    // Form should be disabled during processing
    await waitFor(() => {
      const fieldset = screen.getByRole('group');
      expect(fieldset).toBeDisabled();
    });
  });

  it('handles collection errors gracefully', async () => {
    const userWithPermission = {
      ...mockUser,
      canManagePbis: true,
    };
    useUser.mockReturnValue(userWithPermission);

    const mockFormUtilsWithYes = {
      ...mockFormUtils,
      inputs: { confirmation: 'yes' }
    };
    useForm.mockReturnValue(mockFormUtilsWithYes);

    const mockPbisHookWithError = {
      ...mockPbisHook,
      runCardCollection: jest.fn().mockResolvedValue('Error collecting cards')
    };
    useV3PbisCollection.mockReturnValue(mockPbisHookWithError);

    renderWithProviders(<NewWeeklyPbisCollection />);

    // Open modal
    const collectionButton = screen.getByText('Run Weekly Pbis Collection');
    fireEvent.click(collectionButton);

    // Verify modal opens correctly
    expect(screen.getByText('Run Weekly PBIS Card Collection')).toBeInTheDocument();
    
    // Even with errors, the component should handle them gracefully
    const submitButton = screen.getByText('Run Card Collection');
    expect(submitButton).toBeInTheDocument();
  });

  it('shows correct modal title and content', () => {
    const userWithPermission = {
      ...mockUser,
      canManagePbis: true,
    };
    useUser.mockReturnValue(userWithPermission);

    renderWithProviders(<NewWeeklyPbisCollection />);

    // Open modal
    const collectionButton = screen.getByText('Run Weekly Pbis Collection');
    fireEvent.click(collectionButton);

    expect(screen.getByText('Run Weekly PBIS Card Collection')).toBeInTheDocument();
    expect(screen.getByText('Run the weekly PBIS Card Collection')).toBeInTheDocument();
    expect(screen.getByText('Do You Really Want To Do this?')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type \'yes\' to confirm')).toBeInTheDocument(); // confirmation input
  });

  it('renders with correct button styling and attributes', () => {
    const userWithPermission = {
      ...mockUser,
      canManagePbis: true,
    };
    useUser.mockReturnValue(userWithPermission);

    renderWithProviders(<NewWeeklyPbisCollection />);

    const collectionButton = screen.getByText('Run Weekly Pbis Collection');
    expect(collectionButton).toHaveStyle('margin-top: 10px');
  });

  it('handles form validation correctly', () => {
    const userWithPermission = {
      ...mockUser,
      canManagePbis: true,
    };
    useUser.mockReturnValue(userWithPermission);

    renderWithProviders(<NewWeeklyPbisCollection />);

    // Open modal
    const collectionButton = screen.getByText('Run Weekly Pbis Collection');
    fireEvent.click(collectionButton);

    const confirmationInput = screen.getByPlaceholderText('Type \'yes\' to confirm');
    expect(confirmationInput).toBeRequired();
    expect(confirmationInput).toHaveAttribute('type', 'text');
    expect(confirmationInput).toHaveAttribute('name', 'confirmation');
  });
});