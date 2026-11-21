import { endpoint } from '../config';
import GradientButton from './styles/Button';

// The backend serving the GraphQL endpoint also serves the Keystone Admin UI.
export const backendOrigin = new URL(endpoint).origin;

/**
 * Opens the Keystone Admin UI in a new tab.
 *
 * No extra sign-in step is needed: dashboard requests go to the backend with
 * credentials, so signing in here (magic link or Google) also sets the
 * backend's session cookie, and signing out clears it. The Admin UI reads
 * that cookie and lets super admins in.
 */
export default function AdminSignInButton() {
  return (
    <GradientButton
      type="button"
      onClick={() => window.open(backendOrigin, '_blank', 'noopener')}
    >
      Keystone Admin (be careful in here)
    </GradientButton>
  );
}
