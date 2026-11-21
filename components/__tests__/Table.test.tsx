// react-table 7 does not declare React 19 support; package.json overrides its
// peer dependency. This checks the parts the app relies on still work.
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Table from '../Table';

const columns = [
  { Header: 'Name', accessor: 'name' },
  { Header: 'TA', accessor: 'taTeacher.name' },
  {
    Header: 'Cards',
    accessor: 'cards',
    Cell: ({ cell: { value } }: any) => <strong>{value} cards</strong>,
  },
  { Header: 'Secret', accessor: 'secret' },
];

const data = [
  { name: 'Bea', taTeacher: { name: 'Ms. Ortiz' }, cards: 3, secret: 'x' },
  { name: 'Al', taTeacher: { name: 'Mr. Chen' }, cards: 10, secret: 'y' },
  { name: 'Cy', taTeacher: { name: 'Ms. Ortiz' }, cards: 7, secret: 'z' },
];

const bodyNames = () =>
  screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[0].textContent);

describe('Table (react-table 7 on React 19)', () => {
  it('renders rows, custom cells and hides hidden columns', () => {
    render(<Table columns={columns as any} data={data} searchColumn="name" hiddenColumns={['secret']} />);
    expect(bodyNames()).toEqual(['Bea', 'Al', 'Cy']);
    expect(screen.getByText('10 cards')).toBeInTheDocument();
    expect(screen.queryByText('Secret')).not.toBeInTheDocument();
  });

  it('sorts when a header is clicked', async () => {
    render(<Table columns={columns as any} data={data} searchColumn="name" />);
    await userEvent.click(screen.getByText('Name'));
    expect(bodyNames()).toEqual(['Al', 'Bea', 'Cy']);
  });

  it('filters on the search column', async () => {
    render(<Table columns={columns as any} data={data} searchColumn="taTeacher.name" />);
    await userEvent.type(screen.getByPlaceholderText('Search taTeacher name'), 'Ortiz');
    expect(bodyNames()).toEqual(['Bea', 'Cy']);
  });
});
