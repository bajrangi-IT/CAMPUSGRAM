import React from 'react';
import { NavLink } from 'react-router-dom';
import { Sparkles, Bell, MessageSquare, Plus, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';

interface NavbarProps {
  onOpenMobileMenu?: () => void;
  onCreateClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobileMenu, onCreateClick }) => {
  const { profile, college } = useAuth();

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md lg:hidden">
      {/* Brand & Drawer trigger */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenMobileMenu}
          className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <NavLink to="/" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-slate-900">
            Campus<span className="text-indigo-600">Gram</span>
          </span>
        </NavLink>
      </div>

      {/* College Info Pill */}
      {college && (
        <div className="hidden sm:flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 max-w-[200px] truncate">
          {college.name}
        </div>
      )}

      {/* Right Actions */}
      <div className="flex items-center space-x-2">
        <Button
          onClick={onCreateClick}
          size="sm"
          className="h-8 rounded-lg px-2.5 sm:px-3 text-xs gap-1 font-bold"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Create</span>
        </Button>

        <NavLink
          to="/notifications"
          className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </NavLink>

        <NavLink to="/profile" className="ml-1">
          <Avatar className="h-8 w-8 ring-1 ring-slate-200">
            <AvatarImage src={profile?.profile_photo || ''} />
            <AvatarFallback className="text-[10px]">
              {profile?.full_name ? profile.full_name.substring(0, 2).toUpperCase() : 'CG'}
            </AvatarFallback>
          </Avatar>
        </NavLink>
      </div>
    </header>
  );
};
