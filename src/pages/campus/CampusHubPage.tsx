import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Users,
  Calendar,
  Megaphone,
  BookOpen,
  Briefcase,
  UserPlus,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Building2,
  Sparkles,
  Gift,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';

export const CampusHubPage: React.FC = () => {
  const { college } = useAuth();

  const sections = [
    {
      title: 'Clubs & Societies',
      description: 'Join student chapters, cultural groups, and technical clubs across campus.',
      icon: Users,
      color: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
      href: '/campus/clubs',
      badge: 'Student Life',
    },
    {
      title: 'Campus Events & QR Check-in',
      description: 'Discover workshops, hackathons, and fests with instant QR attendance check-in.',
      icon: Calendar,
      color: 'bg-amber-50 text-amber-600 ring-amber-100',
      href: '/campus/events',
      badge: 'Calendar',
    },
    {
      title: 'Official Announcements',
      description: 'Verified administrative notices and emergency updates from campus leadership.',
      icon: Megaphone,
      color: 'bg-rose-50 text-rose-600 ring-rose-100',
      href: '/campus/announcements',
      badge: 'Verified Notices',
    },
    {
      title: 'Notes & Study Resources',
      description: 'Search and upload previous exam papers, lecture slides, and course formulas.',
      icon: BookOpen,
      color: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
      href: '/campus/notes',
      badge: 'Academics',
    },
    {
      title: 'Opportunities',
      description: 'Explore verified internships, lab research roles, and campus scholarships.',
      icon: Briefcase,
      color: 'bg-blue-50 text-blue-600 ring-blue-100',
      href: '/campus/opportunities',
      badge: 'Career',
    },
    {
      title: 'Team Finder',
      description: 'Recruit teammates with complementary skills for hackathons and group projects.',
      icon: UserPlus,
      color: 'bg-purple-50 text-purple-600 ring-purple-100',
      href: '/campus/team-finder',
      badge: 'Collaborate',
    },
    {
      title: 'Campus Marketplace',
      description: 'Buy and sell textbooks, calculators, cycles, and dorm essentials directly with peers.',
      icon: ShoppingBag,
      color: 'bg-teal-50 text-teal-600 ring-teal-100',
      href: '/campus/marketplace',
      badge: 'Buy & Sell',
    },
    {
      title: 'Campus Deals & Discounts',
      description: 'Verified student discounts, food coupons, and exclusive brand perks. 100% free for students.',
      icon: Gift,
      color: 'bg-rose-50 text-rose-600 ring-rose-100',
      href: '/campus/deals',
      badge: 'Student Savings',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 sm:p-7 text-white shadow-card relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 h-48 w-48 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center space-x-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md">
            <Building2 className="h-3.5 w-3.5 text-indigo-300" />
            <span className="truncate max-w-[240px]">
              {college?.name || 'Verified Campus Node'}
            </span>
          </div>

          <h1 className="mt-3 text-xl sm:text-2xl font-black tracking-tight text-white">
            Campus Central Hub
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-indigo-200/90 max-w-xl leading-relaxed">
            The private gateway to everything happening inside your university. Explore student
            organizations, course study guides, upcoming fests, and campus opportunities.
          </p>
        </div>
      </div>

      {/* Grid of Sections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sections.map((sec) => {
          const Icon = sec.icon;
          return (
            <NavLink
              key={sec.title}
              to={sec.href}
              className="group block"
            >
              <Card className="h-full rounded-2xl border-slate-200/80 p-5 shadow-card hover:shadow-card-hover hover:border-indigo-200 transition-all duration-200">
                <CardContent className="p-0 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${sec.color} ring-4 transition-transform group-hover:scale-105`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                        {sec.badge}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {sec.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {sec.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
                    <span>Enter Section</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </div>
                </CardContent>
              </Card>
            </NavLink>
          );
        })}
      </div>

      {/* Commercial Partner Callout */}
      <div className="rounded-2xl border border-slate-200 bg-slate-900 text-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-white">Partner with CampusGram</span>
            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950/80 border border-indigo-800 px-2 py-0.5 rounded uppercase">
              Business Portal
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Are you a local cafe, tech recruiter, or student brand? Reach verified campus students with precision targeting.
          </p>
        </div>

        <NavLink
          to="/business/register"
          className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shrink-0 shadow-sm"
        >
          <span>Advertise With Us</span>
          <ArrowRight className="h-4 w-4" />
        </NavLink>
      </div>
    </div>
  );
};
