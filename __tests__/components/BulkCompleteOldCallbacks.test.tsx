import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from 'react-query';
import BulkCompleteOldCallbacks from '../../components/Callback/BulkCompleteOldCallbacks';

// Mock the GraphQL hooks
jest.mock('../../lib/useGqlQuery', () => ({
    useGQLQuery: jest.fn(() => ({
        data: null,
        isLoading: false,
        error: null
    })),
}));

jest.mock('../../lib/useGqlMutation', () => ({
    useGqlMutation: jest.fn(() => [
        jest.fn(),
        { loading: false }
    ]),
}));

// Mock the user hook
jest.mock('../../components/User', () => ({
    useUser: jest.fn(),
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
    success: jest.fn(),
    error: jest.fn(),
}));

describe('BulkCompleteOldCallbacks', () => {
    const mockUseUser = require('../../components/User').useUser;
    let queryClient: QueryClient;

    const renderWithQueryClient = (component: React.ReactElement) => {
        return render(
            <QueryClientProvider client={queryClient}>
                {component}
            </QueryClientProvider>
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();

        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                    cacheTime: 0,
                    staleTime: 0,
                },
            },
        });
    });

    describe('Permission Checks', () => {
        it('should not render for non-super admin users', () => {
            mockUseUser.mockReturnValue({
                id: 'user-123',
                isSuperAdmin: false
            });

            renderWithQueryClient(<BulkCompleteOldCallbacks />);

            expect(screen.queryByText('Bulk Complete Old Callbacks')).not.toBeInTheDocument();
        });

        it('should render for super admin users', () => {
            mockUseUser.mockReturnValue({
                id: 'user-123',
                isSuperAdmin: true
            });

            renderWithQueryClient(<BulkCompleteOldCallbacks />);

            expect(screen.getByText('Bulk Complete Old Callbacks')).toBeInTheDocument();
        });
    });

    describe('Modal Behavior', () => {
        beforeEach(() => {
            mockUseUser.mockReturnValue({
                id: 'user-123',
                isSuperAdmin: true
            });
        });

        it('should open modal when button is clicked', async () => {
            const user = userEvent.setup();
            renderWithQueryClient(<BulkCompleteOldCallbacks />);

            const button = screen.getByText('Bulk Complete Old Callbacks');
            await user.click(button);

            // Should have both the button text and modal title
            expect(screen.getAllByText('Bulk Complete Old Callbacks')).toHaveLength(2);
            expect(screen.getByRole('button', { name: '×' })).toBeInTheDocument();
        });

        it('should close modal when X button is clicked', async () => {
            const user = userEvent.setup();
            renderWithQueryClient(<BulkCompleteOldCallbacks />);

            // Open modal
            const button = screen.getByText('Bulk Complete Old Callbacks');
            await user.click(button);

            // Close modal
            const closeButton = screen.getByRole('button', { name: '×' });
            await user.click(closeButton);

            // Should only have the main button
            expect(screen.getAllByText('Bulk Complete Old Callbacks')).toHaveLength(1);
        });

        it('should show no callbacks message by default', async () => {
            const user = userEvent.setup();
            renderWithQueryClient(<BulkCompleteOldCallbacks />);

            const button = screen.getByText('Bulk Complete Old Callbacks');
            await user.click(button);

            expect(screen.getByText('No old callbacks found to complete.')).toBeInTheDocument();
        });
    });

    describe('Component Structure', () => {
        beforeEach(() => {
            mockUseUser.mockReturnValue({
                id: 'user-123',
                isSuperAdmin: true
            });
        });

        it('should render the main button with correct styling', () => {
            renderWithQueryClient(<BulkCompleteOldCallbacks />);

            const button = screen.getByText('Bulk Complete Old Callbacks');
            expect(button).toBeInTheDocument();
            expect(button.tagName).toBe('BUTTON');
        });

        it('should have proper modal structure when opened', async () => {
            const user = userEvent.setup();
            renderWithQueryClient(<BulkCompleteOldCallbacks />);

            const button = screen.getByText('Bulk Complete Old Callbacks');
            await user.click(button);

            // Check for modal elements
            expect(screen.getByRole('button', { name: '×' })).toBeInTheDocument();

            // Check for backdrop
            const backdrop = document.querySelector('.fixed.inset-0.bg-black');
            expect(backdrop).toBeInTheDocument();
        });
    });
});