import React, { useEffect, useState } from 'react';

// Shows a persistent banner while impersonating another user (dev tool), with a
// button to restore the original superadmin session. Relies on the
// `impersonatorToken` saved by ImpersonateButton.
export default function ImpersonationBanner() {
  const [impersonating, setImpersonating] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setImpersonating(!!localStorage.getItem('impersonatorToken'));
    }
  }, []);

  if (!impersonating) return null;

  const returnToSelf = () => {
    const original = localStorage.getItem('impersonatorToken');
    if (original) {
      localStorage.setItem('token', original);
    }
    localStorage.removeItem('impersonatorToken');
    // Full reload so the restored session is picked up everywhere.
    window.location.href = '/';
  };

  return (
    <div className="bg-yellow-400 text-black text-center py-2 px-4 flex items-center justify-center gap-4 flex-wrap">
      <span className="font-semibold">
        ⚠️ You are impersonating another user.
      </span>
      <button
        type="button"
        onClick={returnToSelf}
        className="underline font-bold hover:opacity-80"
      >
        Return to your account
      </button>
    </div>
  );
}
