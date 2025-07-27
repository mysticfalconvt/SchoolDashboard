import Head from 'next/head';
import React, { useEffect, useState } from 'react';
import { ToastBar, Toaster, toast } from 'react-hot-toast';
import Header from './navagation/Header';
import { SmallGradientButton } from './styles/Button';
import ThemeSwitcher from './styles/ThemeSwitcher';

interface PageProps {
  children: React.ReactNode;
}

export default function Page({ children }: PageProps) {
  // get theme from local storage
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // set theme to local storage and update document class
  const setLocalTheme = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);

    // Update document class for Tailwind dark mode
    if (typeof document !== 'undefined') {
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  // get theme from local storage if it exists and on client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const localTheme = localStorage.getItem('theme');
      if (localTheme && (localTheme === 'light' || localTheme === 'dark')) {
        setTheme(localTheme);
        // Set initial document class
        if (localTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-[var(--backgroundColor)] text-[var(--textColor)]">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>NCUJHS Dashboard</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      <ThemeSwitcher theme={theme} setTheme={setLocalTheme} />
      <Toaster
        toastOptions={{
          style: {
            backgroundColor: 'var(--blueTrans)',
            border: `1px solid var(--red)`,
            padding: '.5rem',
            color: 'var(--textColor)',
            fontWeight: 'lighter',
            letterSpacing: '1px',
          },
          success: {
            duration: 3000,
            icon: '👍',
            ariaProps: {
              role: 'status',
              'aria-live': 'polite',
            },
          },
        }}
      >
        {(t) => (
          <ToastBar toast={t}>
            {({ icon, message }) => (
              <>
                {icon}
                {message}
                {t.type !== 'loading' && (
                  <SmallGradientButton onClick={() => toast.dismiss(t.id)}>
                    &times;
                  </SmallGradientButton>
                )}
              </>
            )}
          </ToastBar>
        )}
      </Toaster>
      <div className="max-w-[var(--maxWidth)] mx-auto p-8">{children}</div>
    </div>
  );
}
