
import React from 'react';
import MainNav from './MainNav';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useAuth } from './AuthProvider';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { signOut } = useAuth();
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      <MainNav />
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm p-4 flex justify-end">
          <Button variant="ghost" size="icon" onClick={signOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
