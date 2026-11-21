import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import toast from 'react-hot-toast';
import AdminSignInButton, { backendOrigin } from '../AdminSignInButton';

jest.mock('react-hot-toast', () => ({ __esModule: true, default: { error: jest.fn() } }));

describe('AdminSignInButton', () => {
  beforeEach(() => {
    localStorage.clear();
    (toast.error as jest.Mock).mockClear();
  });

  const form = () => screen.getByRole('button').closest('form') as HTMLFormElement;

  it('posts to the backend admin sign-in route in a new tab, not via the URL', () => {
    render(<AdminSignInButton />);
    expect(form().method).toBe('post');
    expect(form().action).toBe(`${backendOrigin}/admin-signin`);
    expect(form().target).toBe('_blank');
    expect(form().action).not.toContain('token');
  });

  it('puts the session token in the form body at submit time, then clears it', () => {
    jest.useFakeTimers();
    try {
      localStorage.setItem('token', 'sealed-session-token');
      render(<AdminSignInButton />);
      fireEvent.submit(form());
      // What the browser sends is the form as it stands when the handler returns.
      expect(new FormData(form()).get('token')).toBe('sealed-session-token');
      expect(toast.error).not.toHaveBeenCalled();
      jest.runAllTimers();
      expect(new FormData(form()).get('token')).toBe('');
    } finally {
      jest.useRealTimers();
    }
  });

  it('does not submit without a session token', () => {
    render(<AdminSignInButton />);
    const event = new Event('submit', { bubbles: true, cancelable: true });
    form().dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(toast.error).toHaveBeenCalled();
  });
});
