import React, { useState } from 'react';
import { Column, useFilters, useSortBy, useTable } from 'react-table';

interface TableProps {
  columns: Column<any>[];
  data: any[];
  searchColumn: string;
  showSearch?: boolean;
  hiddenColumns?: string[];
}

const Table: React.FC<TableProps> = ({
  columns,
  data,
  searchColumn,
  showSearch = true,
  hiddenColumns = [],
}) => {
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
    useSortBy,
  );

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value || undefined;
    setFilter(searchColumn, value);
    setFilterInput(value);
  };

  // Render the UI for your table
  return (
    <div className="overflow-x-auto w-full">
      {showSearch && (
        <input
          className="hidePrint p-2 mt-2 ml-20 mb-5 text-lg rounded border border-gray-300 bg-[var(--tableAccentColor)] text-[var(--textColor)] focus:outline-none focus:ring-2 focus:ring-blue-200"
          value={filterInput}
          onChange={handleFilterChange}
          placeholder={`Search ${searchColumn.replace('.', ' ')}`}
        />
      )}
      <table
        {...getTableProps()}
        className="w-full border border-gray-200 text-base min-w-[600px]"
      >
        <thead>
          {headerGroups.map((headerGroup) => {
            const { key: headerGroupKey, ...headerGroupProps } =
              headerGroup.getHeaderGroupProps();
            return (
              <tr
                key={headerGroupKey}
                {...headerGroupProps}
                className="bg-[var(--backgroundColor)]"
              >
                {headerGroup.headers.map((column) => {
                  const { key: thKey, ...thProps } = column.getHeaderProps(
                    column.getSortByToggleProps(),
                  );
                  return (
                    <th
                      key={thKey || column.id}
                      {...thProps}
                      className={
                        `sticky top-0 z-10 bg-[var(--backgroundColor)] px-2 py-2 min-w-[3rem] border-b border-r border-gray-200 text-[var(--textColor)] text-left font-semibold ` +
                        (column.isSorted
                          ? column.isSortedDesc
                            ? 'after:content-[" 25B2"] after:text-green-700'
                            : 'after:content-[" 5BC"] after:text-green-700'
                          : '')
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
              <tr
                key={rowKey || `row${i}`}
                {...rowProps}
                className={i % 2 === 1 ? 'bg-[var(--tableAccentColor)]' : ''}
              >
                {row.cells.map((cell) => {
                  const { key: cellKey, ...cellProps } = cell.getCellProps();
                  return (
                    <td
                      key={cellKey || `${cell.column.id}${i}`}
                      {...cellProps}
                      className="px-2 py-2 min-w-[3rem] border-b border-r border-gray-200 text-[var(--textColor)]"
                    >
                      {cell.render('Cell')}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
