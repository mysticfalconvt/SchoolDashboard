import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../__tests__/utils/test-utils';
import PbisFalcon from '../PbisFalcon';

jest.mock('../../../lib/useGqlQuery', () => ({
  useGQLQuery: jest.fn(),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: () => <span data-testid="falcon-image" />,
}));

const { useGQLQuery } = require('../../../lib/useGqlQuery');

describe('PbisFalcon', () => {
  it('displays only student PBIS cards', () => {
    useGQLQuery.mockReturnValue({
      data: { pbisCardsCount: 125, staffPbisCardsCount: 75 },
      isLoading: false,
      error: null,
    });

    renderWithProviders(<PbisFalcon />);

    expect(screen.getByText('125 cards')).toBeInTheDocument();
    expect(screen.queryByText('200 cards')).not.toBeInTheDocument();
  });
});
