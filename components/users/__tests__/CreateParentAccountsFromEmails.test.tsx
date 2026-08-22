import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '../../../__tests__/utils/test-utils';
import CreateParentAccountsFromEmails from '../CreateParentAccountsFromEmails';

jest.mock('../../../lib/useGqlQuery', () => ({
  useGQLQuery: jest.fn(),
}));
jest.mock('../../../lib/useGqlMutation', () => ({
  useGqlMutation: jest.fn(),
}));

const { useGQLQuery } = require('../../../lib/useGqlQuery');
const { useGqlMutation } = require('../../../lib/useGqlMutation');

const openDialog = () => {
  renderWithProviders(<CreateParentAccountsFromEmails />);
  fireEvent.click(
    screen.getByRole('button', { name: /create parent accounts from emails/i }),
  );
};

describe('CreateParentAccountsFromEmails', () => {
  beforeEach(() => {
    useGqlMutation.mockReturnValue([
      jest.fn(),
      { error: null, mutateAsync: jest.fn() },
    ]);
    useGQLQuery.mockImplementation((key: string) =>
      key === 'allStudentsForParentEmails'
        ? { data: { students: [] } }
        : { data: { users: [] } },
    );
  });

  it('shows the expected format and a styled file picker', () => {
    openDialog();
    expect(screen.getByText('Expected CSV format')).toBeInTheDocument();
    expect(screen.getByText('Choose a CSV file')).toBeInTheDocument();
  });

  it('explains that the email doubles as the parent name', () => {
    openDialog();
    expect(
      screen.getByText(/each parent's email is used as their name/i),
    ).toBeInTheDocument();
  });

  it('enables the picker once students and users have loaded', () => {
    openDialog();
    const input = screen.getByLabelText(/choose a csv file/i);
    expect(input).not.toBeDisabled();
  });

  it('disables the picker while data is still loading', () => {
    useGQLQuery.mockReturnValue({ data: undefined });
    openDialog();
    expect(screen.getByLabelText(/choose a csv file/i)).toBeDisabled();
    expect(
      screen.getByText(/loading students and existing users/i),
    ).toBeInTheDocument();
  });

  it('closes on the backdrop', () => {
    openDialog();
    fireEvent.click(screen.getByTestId('parent-emails-backdrop'));
    expect(screen.queryByText('Expected CSV format')).not.toBeInTheDocument();
  });
});
