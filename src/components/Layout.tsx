import React, { useState } from 'react';
import { Button } from './ui/button';
import { 
  LayoutDashboard, 
  Receipt, 
  Target, 
  BarChart3, 
  Settings,
  Menu,
  X,
  Sun,
  Moon,
  Monitor,
  LogOut
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useFinance } from '../contexts/FinanceContext';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
}

export function Layout({ children, currentView, onNavigate }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { settings, updateSettings } = useFinance();
  const { logout } = useAuth();

  const navigationItems = [
    { id: 'dashboard', label: 'Bảng Điều Khiển', icon: LayoutDashboard },
    { id: 'transactions', label: 'Giao Dịch', icon: Receipt },
    { id: 'budgets', label: 'Ngân Sách', icon: Target },
    { id: 'reports', label: 'Báo Cáo', icon: BarChart3 },
    { id: 'settings', label: 'Cài Đặt', icon: Settings },
  ];

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    void updateSettings({ theme });
    
    // Apply theme immediately
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    }
  };

  // Apply theme on component mount
  React.useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'light') {
      root.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    }
  }, [settings.theme]);

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:bg-card">
        <div className="flex h-16 items-center px-6 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-primary-foreground font-semibold">P1</span>
            </div>
            <span className="font-semibold">Project1</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-4">
          <ul className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <Button
                    variant={currentView === item.id ? "secondary" : "ghost"}
                    className="w-full justify-start gap-3"
                    onClick={() => onNavigate(item.id)}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full gap-2 mb-2">
                {settings.theme === 'light' ? <Sun size={16} /> : 
                 settings.theme === 'dark' ? <Moon size={16} /> : <Monitor size={16} />}
                Giao Diện
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleThemeChange('light')}>
                <Sun size={16} className="mr-2" />
                Sáng
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleThemeChange('dark')}>
                <Moon size={16} className="mr-2" />
                Tối
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleThemeChange('system')}>
                <Monitor size={16} className="mr-2" />
                Hệ Thống
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button 
            variant="outline" 
            className="w-full gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={logout}
          >
            <LogOut size={16} />
            Đăng Xuất
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between h-16 px-4 border-b bg-card">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">P1</span>
          </div>
          <span className="font-semibold text-lg">Project1</span>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-card border-b shadow-lg z-50">
          <nav className="p-4">
            <ul className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <Button
                      variant={currentView === item.id ? "secondary" : "ghost"}
                      className="w-full justify-start gap-3"
                      onClick={() => {
                        onNavigate(item.id);
                        setMobileMenuOpen(false);
                      }}
                    >
                      <Icon size={18} />
                      {item.label}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}