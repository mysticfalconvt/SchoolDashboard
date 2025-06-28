import { useState } from 'react';
import { useTable, useFilters, useSortBy } from 'react-table';
import { UserTableStyles } from './styles/TableStyles';

export default function Table({
  columns,
  data,
  searchColumn,
  showSearch = true,
  hiddenColumns = [],
}) {
  const [filterInput, setFilterInput] = useState('');
  // Use the state and functions returned from useTable to build your UI
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    setFilter,
  } = useTable(
    {
      columns,
      data,
      initialState: {
        hiddenColumns,
      },
      autoResetSortBy: false,
    },
    useFilters,
    useSortBy
  );

  const handleFilterChange = (e) => {
    const value = e.target.value || undefined;
    setFilter(searchColumn, value);
    setFilterInput(value);
  };

  // Render the UI for your table
  return (
    <UserTableStyles>
      {showSearch && (
        <input
          className="hidePrint"
          value={filterInput}
          onChange={handleFilterChange}
          placeholder={`Search ${searchColumn.replace('.', ' ')}`}
        />
      )}
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map((headerGroup) => {
            const { key: headerGroupKey, ...headerGroupProps } = headerGroup.getHeaderGroupProps();
            return (
              <tr
                key={headerGroupKey}
                {...headerGroupProps}>
                {headerGroup.headers.map((column) => {
                  const { key: thKey, ...thProps } = column.getHeaderProps(column.getSortByToggleProps());
                  return (
                    <th
                      key={thKey || column.id}
                      {...thProps}
                      className={
                        column.isSorted
                          ? column.isSortedDesc
                            ? 'sort-desc'
                            : 'sort-asc'
                          : ''
                      }
                    >
                      {column.render('Header')}
                    </th>
                  );
                })}
              </tr>
            );
          })}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row, i) => {
            prepareRow(row);
            const { key: rowKey, ...rowProps } = row.getRowProps();
            return (
              <tr key={rowKey || `row${i}`} {...rowProps}>
                {row.cells.map((cell) => {
                  const { key: cellKey, ...cellProps } = cell.getCellProps();
                  return (
                    <td
                      key={cellKey || `${cell.column.id}${i}`}
                      {...cellProps}>{cell.render('Cell')}</td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </UserTableStyles>
  );
}
