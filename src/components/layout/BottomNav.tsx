import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Compass, GraduationCap, MessageSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const { profile } = useAuth();

  const items = [
    { label: 'Feed', href: '/', icon: Home, matchPrefix: null },
    { label: 'Discover', href: '/discover', icon: Compass, matchPrefix: '/discover' },
    { label: 'Campus', href: '/campus', icon: GraduationCap, matchPrefix: '/campus' },
    { label: 'Messages', href: '/messages', icon: MessageSquare, matchPrefix: '/messages' },
    { label: 'Profile', href: '/profile', icon: User, isProfile: true, matchPrefix: '/profile' },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-slate-200/90 bg-white/95 px-2 backdrop-blur-md lg:hidden shadow-lg safe-bottom"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = item.matchPrefix
          ? location.pathname.startsWith(item.matchPrefix)
          : location.pathname === item.href;

        if (item.isProfile) {
          return (
            <NavLink
              key={item.href}
              to={item.href}
              aria-label={item.label}
              className={cn(
                'relative flex min-h-[48px] min-w-[56px] flex-col items-center justify-center py-1 px-2 text-[10px] font-bold transition-all select-none',
                isActive ? 'text-indigo-600 font-extrabold' : 'text-slate-500 hover:text-slate-900'
              )}
            >
              <div className="relative">
                <Avatar
                  className={cn(
                    'h-6 w-6 ring-2 transition-all',
                    isActive ? 'ring-indigo-600 ring-offset-1 scale-105' : 'ring-transparent'
                  )}
                >
                  <AvatarImage src={profile?.profile_photo || ''} />
                  <AvatarFallback className="text-[9px] font-bold">
                    {profile?.full_name ? profile.full_name.substring(0, 2).toUpperCase() : 'AD'}
                  </AvatarFallback>
                </Avatar>
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-indigo-600" />
                )}
              </div>
              <span className="mt-1 leading-none">{item.label}</span>
            </NavLink>
          );
        }

        return (
          <NavLink
            key={item.href}
            to={item.href}
            aria-label={item.label}
            className={cn(
              'relative flex min-h-[48px] min-w-[56px] flex-col items-center justify-center py-1 px-2 text-[10px] font-bold transition-all select-none',
              isActive ? 'text-indigo-600 font-extrabold' : 'text-slate-500 hover:text-slate-900'
            )}
          >
            <div className="relative flex items-center justify-center">
              <Icon
                className={cn(
                  'h-5 w-5 transition-transform duration-150',
                  isActive ? 'text-indigo-600 stroke-[2.4] scale-110' : 'text-slate-400 group-hover:text-slate-600'
                )}
              />
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-indigo-600" />
              )}
            </div>
            <span className="mt-1 leading-none">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
