import { useRef } from 'react';
import toast from 'react-hot-toast';
import { endpoint } from '../config';
import GradientButton from './styles/Button';

// The backend serving the GraphQL endpoint also serves the Keystone Admin UI.
export const backendOrigin = new URL(endpoint).origin;

/**
 * Opens the Keystone Admin UI already signed in.
 *
 * The Admin UI can't see the dashboard's session (it lives in localStorage
 * here and is sent as a Bearer header), so this posts it to the backend's
 * /admin-signin route, which checks it belongs to a super admin, sets the
 * Admin UI's cookie and redirects into the Admin UI. A form POST keeps the
 * token out of the URL, history and logs.
 */
export default function AdminSignInButton() {
  const tokenInput = useRef<HTMLInputElement>(null);

  return (
    <form
      method="post"
      action={`${backendOrigin}/admin-signin`}
      target="_blank"
      onSubmit={(e) => {
        let token: string | null = null;
        try {
          token = localStorage.getItem('token');
        } catch {
          token = null;
        }
        if (!token) {
          e.preventDefault();
          toast.error('Sign out and back in, then try again.');
          return;
        }
        const input = tokenInput.current;
        if (!input) return;
        input.value = token;
        // The browser reads the form when this handler returns; clear the
        // token from the page right after.
        setTimeout(() => {
          input.value = '';
        }, 0);
      }}
    >
      <input ref={tokenInput} type="hidden" name="token" defaultValue="" />
      <GradientButton type="submit">Keystone Admin (be careful in here)</GradientButton>
    </form>
  );
}
