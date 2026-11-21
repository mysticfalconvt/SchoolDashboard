import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import AdminSignInButton, { backendOrigin } from '../AdminSignInButton';

describe('AdminSignInButton', () => {
  it('opens the backend (Keystone Admin UI) in a new tab', () => {
    const open = jest.spyOn(window, 'open').mockImplementation(() => null);
    render(<AdminSignInButton />);
    fireEvent.click(screen.getByRole('button', { name: /Keystone Admin/ }));
    expect(open).toHaveBeenCalledWith(backendOrigin, '_blank', 'noopener');
    open.mockRestore();
  });

  it('never puts the session token in the URL', () => {
    localStorage.setItem('token', 'sealed-session-token');
    const open = jest.spyOn(window, 'open').mockImplementation(() => null);
    render(<AdminSignInButton />);
    fireEvent.click(screen.getByRole('button', { name: /Keystone Admin/ }));
    expect(String(open.mock.calls[0][0])).not.toContain('sealed-session-token');
    open.mockRestore();
    localStorage.clear();
  });
});
