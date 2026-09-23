import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Compass,
  GraduationCap,
  MessageSquare,
  Bell,
  User,
  PlusCircle,
  ChevronDown,
  Users,
  Calendar,
  Megaphone,
  BookOpen,
  Briefcase,
  UserPlus,
  ShoppingBag,
  LogOut,
  Settings,
  Sparkles,
  Building2,
  Gift,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface SidebarLeftProps {
  onCreateClick?: () => void;
}

export const SidebarLeft: React.FC<SidebarLeftProps> = ({ onCreateClick }) => {
  const { profile, college, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isCampusActive = location.pathname.startsWith('/campus');
  const [isCampusOpen, setIsCampusOpen] = useState(isCampusActive);

  const mainNavItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Discover', href: '/discover', icon: Compass },
  ];

  const campusSubItems = [
    { label: 'Campus Hub', href: '/campus', icon: Sparkles },
    { label: 'Campus Deals', href: '/campus/deals', icon: Gift },
    { label: 'Clubs', href: '/campus/clubs', icon: Users },
    { label: 'Events', href: '/campus/events', icon: Calendar },
    { label: 'Announcements', href: '/campus/announcements', icon: Megaphone },
    { label: 'Notes & Resources', href: '/campus/notes', icon: BookOpen },
    { label: 'Opportunities', href: '/campus/opportunities', icon: Briefcase },
    { label: 'Team Finder', href: '/campus/team-finder', icon: UserPlus },
    { label: 'Marketplace', href: '/campus/marketplace', icon: ShoppingBag },
  ];

  const secondaryNavItems = [
    { label: 'Messages', href: '/messages', icon: MessageSquare },
    { label: 'Notifications', href: '/notifications', icon: Bell },
    { label: 'Profile', href: '/profile', icon: User },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <aside className="sticky top-0 hidden h-screen w-64 xl:w-72 flex-col justify-between border-r border-slate-200/80 bg-white/90 px-4 py-5 backdrop-blur-md lg:flex select-none">
      <div className="flex flex-col space-y-6">
        {/* Brand & Campus Badge */}
        <div className="px-2">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm ring-4 ring-indigo-50">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900">
                Campus<span className="text-indigo-600">Gram</span>
              </span>
              <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                Private Network
              </p>
            </div>
          </div>

          {/* College Identity Chip */}
          <div className="mt-4 flex items-center space-x-2 rounded-xl bg-slate-50 border border-slate-100 p-2 text-xs">
            <Building2 className="h-4 w-4 text-indigo-600 shrink-0" />
            <span className="font-semibold text-slate-700 truncate">
              {college?.name || 'Verified Campus Node'}
            </span>
          </div>
        </div>

        {/* Global Create Button */}
        <div className="px-1">
          <Button
            onClick={onCreateClick}
            className="w-full justify-center gap-2.5 py-2.5 font-bold shadow-md hover:shadow-indigo-100 transition-all text-sm rounded-xl"
            size="lg"
          >
            <PlusCircle className="h-5 w-5" />
            <span>Create</span>
          </Button>
        </div>

        {/* Main Navigation */}
        <nav className="flex flex-col space-y-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center space-x-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors',
                  isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <Icon className={cn('h-5 w-5', isActive ? 'text-indigo-600' : 'text-slate-500')} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          {/* Campus Accordion Nav */}
          <div>
            <button
              onClick={() => setIsCampusOpen(!isCampusOpen)}
              className={cn(
                'flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors',
                isCampusActive
                  ? 'bg-indigo-50/70 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <div className="flex items-center space-x-3">
                <GraduationCap
                  className={cn('h-5 w-5', isCampusActive ? 'text-indigo-600' : 'text-slate-500')}
                />
                <span>Campus</span>
              </div>
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-slate-400 transition-transform duration-200',
                  isCampusOpen && 'rotate-180 text-indigo-600'
                )}
              />
            </button>

            {isCampusOpen && (
              <div className="ml-5 mt-1 flex flex-col space-y-0.5 border-l-2 border-indigo-100 pl-3">
                {campusSubItems.map((sub) => {
                  const SubIcon = sub.icon;
                  const isSubActive = location.pathname === sub.href;
                  return (
                    <NavLink
                      key={sub.href}
                      to={sub.href}
                      className={cn(
                        'flex items-center space-x-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors',
                        isSubActive
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                      )}
                    >
                      <SubIcon
                        className={cn('h-4 w-4', isSubActive ? 'text-indigo-600' : 'text-slate-400')}
                      />
                      <span>{sub.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>

          {/* Secondary Nav */}
          {secondaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center space-x-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors',
                  isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <Icon className={cn('h-5 w-5', isActive ? 'text-indigo-600' : 'text-slate-500')} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Business & Advertiser Portal Link */}
        <div className="pt-2 px-1">
          <NavLink
            to="/business/dashboard"
            className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/60 border border-slate-200/60 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Briefcase className="h-3.5 w-3.5 text-indigo-600" />
              <span>Business & Ads</span>
            </span>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
              B2B
            </span>
          </NavLink>
        </div>
      </div>

      {/* Footer Profile & Quick Links */}
      <div className="border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between rounded-xl p-2 hover:bg-slate-50 transition-colors">
          <NavLink to="/profile" className="flex items-center space-x-3 min-w-0">
            <Avatar className="h-9 w-9">
              <AvatarImage src={profile?.profile_photo || ''} />
              <AvatarFallback>
                {profile?.full_name ? profile.full_name.substring(0, 2).toUpperCase() : 'CG'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-slate-800">
                {profile?.full_name || 'My Account'}
              </p>
              <p className="truncate text-[11px] text-slate-400">
                @{profile?.username || 'user'}
              </p>
            </div>
          </NavLink>

          <div className="flex items-center space-x-1 text-slate-400">
            <NavLink
              to="/settings"
              title="Settings"
              className="rounded-lg p-1.5 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <Settings className="h-4 w-4" />
            </NavLink>
            <button
              onClick={handleSignOut}
              title="Log out"
              className="rounded-lg p-1.5 hover:bg-rose-50 hover:text-rose-600 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
