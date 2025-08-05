import React from 'react';
import { Navbar } from './Navbar';
import { MobileNavbar } from './MobileNavbar';
interface LayoutProps {
  children: React.ReactNode;
}
export function Layout({
  children
}: LayoutProps) {
  return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Navbar />
      <main className="pt-16 pb-20 md:pb-6 px-4 md:px-6 max-w-7xl mx-auto">
        {children}
      </main>
      <div className="md:hidden">
        <MobileNavbar />
      </div>
    </div>;
}