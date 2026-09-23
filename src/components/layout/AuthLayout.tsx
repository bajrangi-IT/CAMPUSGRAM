import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, GraduationCap, Users, BookOpen } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Subtle modern background aura */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-100/50 via-slate-50/20 to-transparent pointer-events-none -z-10" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <Link to="/" className="inline-flex items-center space-x-2.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md ring-4 ring-indigo-50">
            <Sparkles className="h-6 w-6" />
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900">
            Campus<span className="text-indigo-600">Gram</span>
          </span>
        </Link>
        <p className="mt-2 text-sm text-slate-500 font-medium">
          The verified private social network for your campus community
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Outlet />
      </div>

      {/* Trust badges footer */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md flex items-center justify-center space-x-6 text-xs text-slate-600">
        <div className="flex items-center space-x-1.5">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>Verified Students Only</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <GraduationCap className="h-4 w-4 text-indigo-500" />
          <span>Multi-College Architecture</span>
        </div>
      </div>
    </div>
  );
};
