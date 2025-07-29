import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';
import { FaHome } from 'react-icons/fa';
import { callbackDisabled, disciplineDisabled } from '../../config';
import isAllowed from '../../lib/isAllowed';
import MagicLinkSignIn from '../loginComponents/MagicLinkSignIn';
import MessagesCount from '../Messages/MessagesCount';
import { useUser } from '../User';

interface NavProps {
  mobile?: boolean;
  onClickLink?: () => void;
}

interface NavCardProps {
  href: string;
  children: React.ReactNode;
  mobile?: boolean;
  onClickLink?: () => void;
}

const Nav: React.FC<NavProps> = ({ mobile = false, onClickLink }) => {
  const me = useUser();
  const router = useRouter();

  // check if path is /reset
  const isReset = router.pathname.includes('/reset');
  if (isReset) {
    return null;
  }

  if (!me) {
    return <MagicLinkSignIn />;
  }

  // Helper to render a nav link in a skewed card
  const NavCard: React.FC<NavCardProps> = ({ href, children }) => (
    <div
      className={
        mobile
          ? 'bg-gradient-to-tl from-[var(--blue)] to-[var(--red)] rounded-lg my-2 w-full flex items-center justify-center skew-x-[-20deg] shadow transition-transform duration-200 hover:brightness-110 hover:shadow-lg'
          : 'bg-gradient-to-tl from-[var(--blue)] to-[var(--red)] rounded-lg mx-1 min-w-[90px] h-10 flex items-center justify-center skew-x-[-20deg] shadow transition-transform duration-200 hover:brightness-110 hover:shadow-lg'
      }
    >
      <Link
        href={href}
        className={
          mobile
            ? 'uppercase font-bold text-white text-center px-4 py-3 block text-lg skew-x-[20deg] whitespace-nowrap w-full'
            : 'uppercase font-bold text-white text-center px-2 py-1 block text-base skew-x-[20deg] whitespace-nowrap'
        }
        onClick={mobile && onClickLink ? onClickLink : undefined}
      >
        {children}
      </Link>
    </div>
  );

  if (mobile) {
    return (
      <div className="flex flex-col items-stretch w-full p-2">
        <NavCard href="/calendar">Calendar</NavCard>
        <NavCard href="/links">Links</NavCard>
        <NavCard href="/pbis">PBIS</NavCard>
        {isAllowed(me, 'hasTA') && (
          <NavCard href={`/taPage/${me?.id}`}>TA</NavCard>
        )}
        {isAllowed(me, 'hasClasses') && !callbackDisabled && (
          <NavCard href="/callback">Callback</NavCard>
        )}
        {isAllowed(me, 'isStaff') && <NavCard href="/users">Users</NavCard>}
        {isAllowed(me, 'isStaff') && !disciplineDisabled && (
          <NavCard href="/discipline">Discipline</NavCard>
        )}
        {isAllowed(me, 'isStaff') && (
          <NavCard href="/chromebooks">Chromebook</NavCard>
        )}
        {isAllowed(me, 'canHaveSpecialGroups') && (
          <NavCard href="/specialGroup">SpGroup</NavCard>
        )}
        <NavCard href="/ePortfolio">E-Portfolio</NavCard>
        {isAllowed(me, 'isSuperAdmin') && (
          <div className="flex items-center justify-center my-2">
            <Link
              href="/superUserSettings"
              className="flex items-center justify-center bg-gradient-to-tl from-[var(--blue)] to-[var(--red)] text-white font-bold rounded-lg w-10 h-10 px-2 shadow transition-transform duration-200 hover:brightness-110 skew-x-[-20deg] border-none focus:outline-none"
              aria-label="Super User Settings"
            >
              <span className="skew-x-[20deg] w-full text-center text-xl">
                ⚙️
              </span>
            </Link>
          </div>
        )}
        <div className="flex items-center justify-center mt-2">
          <MessagesCount mobile={true} />
        </div>
      </div>
    );
  }

  return (
    <nav className="flex flex-row items-center justify-end w-full px-2 py-1 flex-wrap">
      {/* Home icon for mobile */}
      <div className="md:hidden mr-1">
        <NavCard href="/">
          <FaHome />
        </NavCard>
      </div>
      <div className="flex flex-row flex-wrap items-center justify-end w-full">
        <NavCard href="/calendar">Calendar</NavCard>
        <NavCard href="/links">Links</NavCard>
        <NavCard href="/pbis">PBIS</NavCard>
        {isAllowed(me, 'hasTA') && (
          <NavCard href={`/taPage/${me?.id}`}>TA</NavCard>
        )}
        {isAllowed(me, 'hasClasses') && !callbackDisabled && (
          <NavCard href="/callback">Callback</NavCard>
        )}
        {isAllowed(me, 'isStaff') && <NavCard href="/users">Users</NavCard>}
        {isAllowed(me, 'isStaff') && !disciplineDisabled && (
          <NavCard href="/discipline">Discipline</NavCard>
        )}
        {isAllowed(me, 'isStaff') && (
          <NavCard href="/chromebooks">Chromebook</NavCard>
        )}
        {isAllowed(me, 'canHaveSpecialGroups') && (
          <NavCard href="/specialGroup">SpGroup</NavCard>
        )}
        <NavCard href="/ePortfolio">E-Portfolio</NavCard>
        {isAllowed(me, 'isSuperAdmin') && (
          <div className="flex items-center justify-center my-2">
            <Link
              href="/superUserSettings"
              className="flex items-center justify-center bg-gradient-to-tl from-[var(--blue)] to-[var(--red)] text-white font-bold rounded-lg w-10 h-10 px-2 shadow transition-transform duration-200 hover:brightness-110 skew-x-[-20deg] border-none focus:outline-none"
              aria-label="Super User Settings"
            >
              <span className="skew-x-[20deg] w-full text-center text-xl">
                ⚙️
              </span>
            </Link>
          </div>
        )}
        <div className="flex items-center ml-2">
          <MessagesCount />
        </div>
      </div>
    </nav>
  );
};

export default Nav;
