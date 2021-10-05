import styled from 'styled-components';

export const UserTableStyles = styled.div`
  table {
    width: 100%;
    border-spacing: 0;
    border: 1px solid #ededed;
  }
  table tr:last-child td {
    border-bottom: 0;
  }
  table th,
  table td {
    margin: 0;
    padding: 0.5rem;
    min-width: 8rem;
    border-bottom: 1px solid #ededed;
    border-right: 1px solid #ededed;
    position: relative;
    color: var(--textColor);
  }
  table th:last-child,
  table td:last-child {
    border-right: 0;
  }
  table tr:nth-child(even) {
    background-color: var(--tableAccentColor);
  }

  table th::before {
    position: absolute;
    right: 15px;
    top: 16px;
    content: '';
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
  }
  table th.sort-asc::before {
    border-bottom: 5px solid #22543d;
  }
  table th.sort-desc::before {
    border-top: 5px solid #22543d;
  }
  table th {
    position: sticky;
    top: 0;
    background-color: var(--backgroundColor);
    z-index: 100;
  }
  .App {
    display: flex;
    flex-direction: column;
    padding: 20px;
  }
  .badge {
    background: radial-gradient(var(--red), var(--blue));
    color: white;
    margin-right: 4px;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: bold;
    text-transform: uppercase;
  }
  input {
    padding: 10px;
    margin-top: 10px;
    margin-left: 100px;
    margin-bottom: 20px;
    font-size: 18px;
    border-radius: 5px;
    border: 1px solid #ddd;
    box-shadow: none;
    color: var(--textColor);
    background-color: var(--tableAccentColor);
  }
`;
