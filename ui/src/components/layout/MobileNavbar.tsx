import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, LayersIcon, PlusIcon, SearchIcon } from 'lucide-react';
export function MobileNavbar() {
  const location = useLocation();
  return <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 h-16 z-10">
      <div className="grid grid-cols-5 h-full">
        <NavItem to="/" active={location.pathname === '/'} icon={<HomeIcon className="w-6 h-6" aria-hidden="true" />} label="Events" />
        <NavItem to="/anticipation" active={location.pathname === '/anticipation'} icon={<LayersIcon className="w-6 h-6" aria-hidden="true" />} label="Anticipation" />
        <div className="flex items-center justify-center">
          <Link to="/create" className="w-14 h-14 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center -mt-5 shadow-lg">
            <PlusIcon className="w-8 h-8 text-white" />
          </Link>
        </div>
        <NavItem to="/discover" active={location.pathname === '/discover'} icon={<SearchIcon className="w-6 h-6" aria-hidden="true" />} label="Discover" />
        <NavItem to="/profile" active={location.pathname === '/profile'} icon={<div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600" aria-hidden="true" />} label="Profile" />
      </div>
    </nav>;
}
interface NavItemProps {
  to: string;
  active: boolean;
  icon: React.ReactNode;
  label: string;
}
function NavItem({
  to,
  active,
  icon,
  label
}: NavItemProps) {
  return <Link to={to} className={`flex flex-col items-center justify-center ${active ? 'text-orange-500 dark:text-pink-400' : 'text-gray-500 dark:text-gray-300'}`}>
      {icon}
      <span className="text-xs mt-1">{label}</span>
    </Link>;
}