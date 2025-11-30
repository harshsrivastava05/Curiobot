"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";
import { Menu, X, User, LogOut, Settings, BookOpen, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-[#e0e5ec]/80 backdrop-blur-md border-b border-white/20 px-4 transition-all duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-[#e0e5ec] neo-shadow flex items-center justify-center text-primary font-bold text-lg group-hover:scale-105 transition-transform">
              C
            </div>
            <span className="text-lg font-bold text-gray-800 tracking-tight group-hover:text-primary transition-colors">CurioBot</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <Link href="/" className="px-3 py-1.5 rounded-lg text-sm text-gray-600 font-medium hover:text-primary hover:bg-[#e0e5ec] hover:neo-shadow transition-all">
              Home
            </Link>
            <Link href="/dashboard" className="px-3 py-1.5 rounded-lg text-sm text-gray-600 font-medium hover:text-primary hover:bg-[#e0e5ec] hover:neo-shadow transition-all">
              Dashboard
            </Link>
            <Link href="/#features" className="px-3 py-1.5 rounded-lg text-sm text-gray-600 font-medium hover:text-primary hover:bg-[#e0e5ec] hover:neo-shadow transition-all">
              Features
            </Link>
            <Link href="/#about" className="px-3 py-1.5 rounded-lg text-sm text-gray-600 font-medium hover:text-primary hover:bg-[#e0e5ec] hover:neo-shadow transition-all">
              About
            </Link>
          </div>

          {/* Auth / Profile */}
          <div className="hidden md:flex items-center gap-3">
            {session ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="w-10 h-10 rounded-full bg-[#e0e5ec] neo-shadow flex items-center justify-center text-gray-700 hover:text-primary hover:scale-105 transition-all"
                >
                  {session.user?.image ? (
                    <img src={session.user.image} alt="Profile" className="w-full h-full rounded-full object-cover border-2 border-[#e0e5ec]" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-48 bg-[#e0e5ec] rounded-xl neo-shadow overflow-hidden py-2 z-50"
                    >
                      <div className="px-4 py-2 border-b border-gray-200/50">
                        <p className="text-xs font-bold text-gray-800 truncate">{session.user?.name}</p>
                        <p className="text-[10px] text-gray-500 truncate">{session.user?.email}</p>
                      </div>
                      <div className="p-1">
                        <Link href="/dashboard" className="block px-3 py-1.5 rounded-lg text-xs text-gray-700 hover:bg-[#e0e5ec] hover:neo-inset flex items-center gap-2 transition-all">
                          <LayoutDashboard className="w-3 h-3" /> Dashboard
                        </Link>
                        <button className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-gray-700 hover:bg-[#e0e5ec] hover:neo-inset flex items-center gap-2 transition-all">
                          <Settings className="w-3 h-3" /> Settings
                        </button>
                        <button
                          onClick={() => signOut()}
                          className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-red-600 hover:bg-[#e0e5ec] hover:neo-inset flex items-center gap-2 transition-all mt-1"
                        >
                          <LogOut className="w-3 h-3" /> Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => signIn()} className="px-4 py-1.5 rounded-lg text-sm text-gray-600 font-bold hover:text-primary hover:neo-shadow transition-all">
                  Log In
                </button>
                <button onClick={() => signIn()} className="neo-btn px-4 py-1.5 rounded-lg text-sm font-bold text-primary hover:scale-105 transition-transform">
                  Sign Up
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="w-8 h-8 rounded-lg bg-[#e0e5ec] neo-shadow flex items-center justify-center text-gray-700 active:neo-inset transition-all"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden"
          >
            <div className="px-4 pt-2 pb-4 space-y-2">
              <Link href="/" className="block px-4 py-2 rounded-lg bg-[#e0e5ec] neo-shadow text-center text-sm font-bold text-gray-700 active:neo-inset">
                Home
              </Link>
              <Link href="/dashboard" className="block px-4 py-2 rounded-lg bg-[#e0e5ec] neo-shadow text-center text-sm font-bold text-gray-700 active:neo-inset">
                Dashboard
              </Link>
              <Link href="/#features" className="block px-4 py-2 rounded-lg bg-[#e0e5ec] neo-shadow text-center text-sm font-bold text-gray-700 active:neo-inset">
                Features
              </Link>
              {session ? (
                <button
                  onClick={() => signOut()}
                  className="block w-full px-4 py-2 rounded-lg bg-[#e0e5ec] neo-shadow text-center text-sm font-bold text-red-600 active:neo-inset"
                >
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={() => signIn()}
                  className="block w-full px-4 py-2 rounded-lg bg-[#e0e5ec] neo-shadow text-center text-sm font-bold text-primary active:neo-inset"
                >
                  Sign In
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
