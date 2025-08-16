'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/authStore';

// User interface is now imported from authStore

export default function Header() {
  const { user, isLoading, isAuthenticated, logout, checkAuth } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);



  const handleLogout = async () => {
    await logout();
    setDropdownOpen(false);
    setMenuOpen(false);
    router.push('/');
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-gradient-to-r from-violet-900/80 via-purple-900/80 to-indigo-900/80 backdrop-blur-lg shadow-md">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        
        {/* Logo */}
        <Link
          href="/"
          className="text-white font-extrabold text-2xl tracking-wide"
          style={{ fontFamily: 'Pacifico, serif' }}
        >
          Tripy
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-6 text-white font-medium text-sm">
          <Link href="#features" className="hover:text-violet-300 transition">Features</Link>
          <Link href="#how-it-works" className="hover:text-violet-300 transition">How It Works</Link>
          <Link href="#contact" className="hover:text-violet-300 transition">Contact</Link>
        </nav>

        {/* Auth/Profile (Desktop) */}
        <div className="hidden md:flex items-center gap-4 relative">
          {!isLoading && isAuthenticated && user ? (
            <div
              className="relative"
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <button
                className="flex items-center gap-2 text-white hover:text-violet-300 transition"
                aria-haspopup="true"
              >
                <i className="ri-user-3-line text-xl" aria-hidden="true"></i>
                <span>{user.firstName}</span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 bg-white text-sm text-gray-800 rounded shadow-lg p-2 w-40 z-10">
                  <Link href="/dashboard" className="block px-3 py-2 hover:bg-gray-100 rounded">Dashboard</Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 rounded-full border border-white text-white hover:bg-white hover:text-purple-800 transition"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 rounded-full bg-white text-purple-800 font-semibold hover:bg-violet-200 transition"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* ✅ Mobile Menu Toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-white text-2xl"
          aria-label="Toggle menu"
        >
          <i className={menuOpen ? 'ri-close-line' : 'ri-menu-line'} aria-hidden="true"></i>
        </button>
      </div>

      {/* ✅ Mobile Menu Dropdown */}
      {menuOpen && (
        <div className="md:hidden px-6 pb-4 space-y-3 text-white text-sm">
          <Link href="#features" className="block">Features</Link>
          <Link href="#how-it-works" className="block">How It Works</Link>
          <Link href="#contact" className="block">Contact</Link>
          <hr className="border-white/20" />
          {!isLoading && user ? (
            <>
              <Link href="/dashboard" className="block">Dashboard</Link>
              <button
                onClick={handleLogout}
                className="block w-full text-left"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="block">Login</Link>
              <Link href="/signup" className="block">Sign Up</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
