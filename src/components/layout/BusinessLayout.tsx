import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Briefcase,
  Layers,
  PlusCircle,
  BarChart3,
  Building2,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  Wallet,
  Sparkles,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { advertisingService } from '@/services/advertisingService';
import { AdvertiserAccount } from '@/types/business.types';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export const BusinessLayout: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [account, setAccount] = useState<AdvertiserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAccount() {
      if (!user) return;
      setIsLoading(true);
      const acc = await advertisingService.getAdvertiserAccount(user.id);
      setAccount(acc);
      setIsLoading(false);

      // If user has not registered a business yet and is on dashboard, redirect to register
      if (!acc && location.pathname !== '/business/register') {
        navigate('/business/register');
      }
    }
    loadAccount();
  }, [user, location.pathname]);

  const navItems = [
    { label: 'Dashboard', href: '/business/dashboard', icon: Layers },
    { label: 'Campaigns', href: '/business/campaigns', icon: Briefcase },
    { label: 'Create Campaign', href: '/business/campaigns/create', icon: PlusCircle },
    { label: 'Analytics', href: '/business/analytics', icon: BarChart3 },
    { label: 'Business Profile', href: '/business/profile', icon: Building2 },
  ];

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="h-3 w-3 text-emerald-600" />
            <span>Verified Partner</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="h-3 w-3 text-rose-600" />
            <span>Application Rejected</span>
          </span>
        );
      case 'suspended':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="h-3 w-3 text-amber-600" />
            <span>Account Suspended</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="h-3 w-3 text-amber-600" />
            <span>Pending Review</span>
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Business Top Header */}
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-xl bg-indigo-500 text-white flex items-center justify-center font-black shadow-sm ring-2 ring-indigo-400/30">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-white text-base">
                CampusGram <span className="text-indigo-400 font-bold text-xs uppercase px-1.5 py-0.5 bg-indigo-950/80 rounded border border-indigo-700">Business</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Campus Advertising & Recruitment Portal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {account && (
            <div className="hidden sm:flex items-center gap-3">
              {getStatusBadge(account.verification_status)}
              <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 border border-slate-700 rounded-xl text-xs">
                <Wallet className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-slate-400">Ad Balance:</span>
                <span className="font-bold text-white">₹{account.balance.toLocaleString()}</span>
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 gap-1.5 h-8 rounded-lg"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Campus Network</span>
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto p-4 sm:p-6 gap-6">
        {/* Isolated Business Left Navigation */}
        {account && (
          <aside className="w-56 shrink-0 hidden md:flex flex-col space-y-1">
            <div className="p-3 bg-white border border-slate-200/80 rounded-2xl mb-3 shadow-xs">
              <p className="text-xs font-bold text-slate-900 truncate">{account.business_name}</p>
              <p className="text-[10px] text-slate-500 capitalize">{account.category}</p>
            </div>

            <nav className="flex flex-col space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    className={cn(
                      'flex items-center space-x-2.5 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all',
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                        : 'text-slate-600 hover:bg-white hover:text-slate-900 border border-transparent'
                    )}
                  >
                    <Icon className={cn('h-4 w-4', isActive ? 'text-white' : 'text-slate-400')} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="mt-auto pt-6">
              <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-900 leading-relaxed">
                <span className="font-bold block mb-0.5">Privacy First Guarantee</span>
                Your targeting reaches verified campus students without ever revealing their personal identity or contact info.
              </div>
            </div>
          </aside>
        )}

        {/* Sub-view Outlet */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
