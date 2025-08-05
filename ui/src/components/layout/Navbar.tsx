import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PlusIcon, CalendarIcon, SearchIcon, LayersIcon, UserIcon } from 'lucide-react';
export function Navbar() {
  const location = useLocation();
  return <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 shadow-sm z-10">
      <div className="max-w-7xl mx-auto h-full px-4 md:px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <div className="font-bold text-2xl bg-gradient-to-r from-orange-500 to-pink-500 text-transparent bg-clip-text">
            Tunc
          </div>
        </Link>
        <nav className="hidden md:flex items-center space-x-1">
          <NavLink to="/" active={location.pathname === '/'}>
            <CalendarIcon className="w-5 h-5 mr-2" />
            Events
          </NavLink>
          <NavLink to="/anticipation" active={location.pathname === '/anticipation'}>
            <LayersIcon className="w-5 h-5 mr-2" />
            Anticipation
          </NavLink>
          <NavLink to="/discover" active={location.pathname === '/discover'}>
            <SearchIcon className="w-5 h-5 mr-2" />
            Discover
          </NavLink>
          <Link to="/create" className="ml-2 flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium hover:opacity-90 transition-opacity">
            <PlusIcon className="w-5 h-5 mr-2" />
            Create
          </Link>
        </nav>
        <div className="flex items-center">
          <button className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>
      </div>
    </header>;
}
interface NavLinkProps {
  to: string;
  active: boolean;
  children: React.ReactNode;
}
function NavLink({
  to,
  active,
  children
}: NavLinkProps) {
  return <Link to={to} className={`flex items-center px-4 py-2 rounded-full font-medium transition-colors ${active ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
      {children}
    </Link>;
}