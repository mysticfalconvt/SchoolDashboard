import Image from 'next/image';
import Link from 'next/link';
import React, { useState } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';
import { useIsFetching } from 'react-query';
import isAllowed from '../../lib/isAllowed';
import Search from '../Search';
import { useUser } from '../User';
import Nav from './Nav';

const Header: React.FC = () => {
  const me = useUser();
  const isFetching = useIsFetching();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header style={{ background: 'linear-gradient(to top right, #38B6FF, #760D08)' }}>
        {/* Mobile: NCUJHS left, hamburger right */}
        <div className="flex flex-row items-center w-full px-2 py-2 relative md:static">
          {/* Mobile NCUJHS link with falcon icon */}
          <div className="flex md:hidden flex-1 items-center gap-2">
            <Image
              src="/falcon.svg"
              alt="Falcon"
              width={28}
              height={28}
              className="md:hidden inline-block"
            />
            <Link
              href="/"
              className="text-white font-extrabold text-2xl tracking-wide px-2 py-1"
            >
              NCUJHS
            </Link>
          </div>
          {/* Desktop skewed logo/title card */}
          <div
            className={`rounded-2xl mx-2 min-w-[220px] h-16 md:h-20 items-center justify-center skew-x-[-20deg] shadow-lg ${isFetching ? 'animate-pulse' : ''} hidden md:flex`}
            style={{ background: 'linear-gradient(to top left, #38B6FF, #760D08)' }}
          >
            <Link href="/" className="block skew-x-[20deg]">
              <span className="flex flex-row items-center justify-center px-4 md:px-6 py-2 gap-3">
                <Image
                  src="/falcon.svg"
                  alt="Falcon"
                  width={48}
                  height={48}
                  className="hidden md:inline-block"
                  priority
                />
                <span className="flex flex-col items-start justify-center">
                  <span className="uppercase font-extrabold text-white text-2xl md:text-4xl leading-none tracking-wide">
                    NCUJHS
                  </span>
                  <span className="uppercase font-extrabold text-white text-xl md:text-3xl leading-none tracking-wide">
                    Dashboard
                  </span>
                </span>
              </span>
            </Link>
          </div>
          {/* Hamburger for mobile (right) */}
          <button
            className="md:hidden ml-auto text-white text-3xl focus:outline-none z-30 bg-transparent border-none"
            aria-label="Open menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <FaBars />
          </button>
          {/* Desktop nav */}
          <div className="flex-1 hidden md:block">
            <Nav mobile={false} onClickLink={() => {}} />
          </div>
        </div>
        {/* Mobile dropdown menu - covers entire screen, always visible when open */}
        {menuOpen && (
          <div 
            className="fixed inset-0 shadow-lg z-[9999] animate-fade-in-down overflow-y-auto flex flex-col"
            style={{ background: 'linear-gradient(to top right, #38B6FF, #760D08)' }}
          >
            <button
              className="absolute top-4 right-4 text-white text-3xl focus:outline-none z-60 bg-transparent border-none"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
            >
              <FaTimes />
            </button>
            <div className="mt-16 flex flex-col items-center">
              <Link
                href="/"
                className="mb-4 text-white font-extrabold text-2xl tracking-wide px-4 py-2 rounded-lg shadow-lg hover:brightness-110 transition-all duration-200"
                style={{ background: 'linear-gradient(to top left, #38B6FF, #760D08)' }}
                onClick={() => setMenuOpen(false)}
              >
                Home
              </Link>
              <Nav mobile={true} onClickLink={() => setMenuOpen(false)} />
            </div>
          </div>
        )}
        {isAllowed(me, 'isStaff') && (
          <div className="grid grid-cols-[1fr_auto] border-b border-black">
            <Search />
          </div>
        )}
      </header>
    </>
  );
};

export default Header;
