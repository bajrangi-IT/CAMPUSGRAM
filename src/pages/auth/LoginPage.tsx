import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, Lock, AlertCircle, ArrowRight, Eye, EyeOff, GraduationCap, Building2, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { toast } from 'sonner';

const loginSchema = z.object({
  identifier: z.string().min(2, 'Please enter your username or email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;
type LoginMode = 'student' | 'business';

export const LoginPage: React.FC = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loginMode, setLoginMode] = useState<LoginMode>('student');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: 'ashu.devops',
      password: '12345678',
    },
  });

  const handleFillStudent = () => {
    setLoginMode('student');
    setValue('identifier', 'ashu.devops');
    setValue('password', '12345678');
    setServerError(null);
  };

  const handleFillBusiness = () => {
    setLoginMode('business');
    setValue('identifier', 'business@campusgram.com');
    setValue('password', '12345678');
    setServerError(null);
  };

  const onSubmit = async (values: LoginFormData) => {
    setIsLoading(true);
    setServerError(null);

    try {
      const { error, isBusiness } = await signIn(values.identifier, values.password);

      if (error) {
        setServerError(error.message);
        return;
      }

      if (isBusiness || loginMode === 'business') {
        toast.success('Welcome to Campus Business & Advertising Dashboard!');
        navigate('/business/dashboard', { replace: true });
      } else {
        toast.success('Welcome back to CampusGram, Ashu!');
        navigate(from || '/', { replace: true });
      }
    } catch {
      setServerError('An unexpected connection error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="rounded-2xl border-slate-200/90 shadow-card bg-white overflow-hidden">
      {/* Mode Switcher Tabs */}
      <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50/70 p-1.5 gap-1.5">
        <button
          type="button"
          onClick={() => {
            setLoginMode('student');
            setValue('identifier', 'ashu.devops');
            setValue('password', '12345678');
            setServerError(null);
          }}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
            loginMode === 'student'
              ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <GraduationCap className="h-4 w-4" />
          <span>Student Access</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setLoginMode('business');
            setValue('identifier', 'business@campusgram.com');
            setValue('password', '12345678');
            setServerError(null);
          }}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
            loginMode === 'business'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Business Portal</span>
        </button>
      </div>

      <CardHeader className="space-y-1.5 pt-6">
        <CardTitle className="text-xl font-black tracking-tight text-slate-900 flex items-center justify-between">
          <span>{loginMode === 'student' ? 'Sign In to Campus' : 'Advertiser & Partner Sign In'}</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
            {loginMode === 'student' ? '100% Free' : 'B2B Portal'}
          </span>
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          {loginMode === 'student'
            ? 'Enter your campus username or email to access feeds, notes, and events.'
            : 'Access your dedicated business dashboard, campaign pacing, and student reach.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {serverError && (
          <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
              {loginMode === 'student' ? 'Username or Campus Email' : 'Business Email or ID'}
            </label>
            <Input
              type="text"
              placeholder={loginMode === 'student' ? 'e.g. ashu.devops or email' : 'e.g. business@campusgram.com'}
              leftIcon={loginMode === 'student' ? <GraduationCap className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
              error={errors.identifier?.message}
              {...register('identifier')}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="hover:text-slate-600 focus:outline-none p-1"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              error={errors.password?.message}
              {...register('password')}
            />
          </div>

          {/* Quick Pre-fill helper badges */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-500" />
                Quick Test Credentials:
              </span>
            </div>
            <div className="flex flex-wrap gap-2 pt-0.5">
              <button
                type="button"
                onClick={handleFillStudent}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-semibold text-slate-700 hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center gap-1 shadow-2xs"
              >
                <CheckCircle2 className="h-3 w-3 text-indigo-600" />
                <span>Fill: ashu.devops / 12345678</span>
              </button>
              <button
                type="button"
                onClick={handleFillBusiness}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-semibold text-slate-700 hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center gap-1 shadow-2xs"
              >
                <Building2 className="h-3 w-3 text-slate-600" />
                <span>Fill: business@campusgram.com</span>
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className={`w-full font-bold text-sm h-11 rounded-xl mt-2 ${
              loginMode === 'business' ? 'bg-slate-900 hover:bg-slate-800' : ''
            }`}
            isLoading={isLoading}
          >
            <span>{loginMode === 'student' ? 'Sign In as Student' : 'Enter Business Dashboard'}</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 border-t border-slate-100 p-4 bg-slate-50/50 text-center">
        {loginMode === 'student' ? (
          <>
            <p className="text-xs text-slate-500">
              Don't have a student account?{' '}
              <Link
                to="/signup"
                className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                Sign up for free campus access
              </Link>
            </p>
            <p className="text-[11px] text-slate-400">
              Are you a sponsor or local business?{' '}
              <Link
                to="/business/register"
                className="font-semibold text-slate-700 hover:underline"
              >
                Register as an Advertiser
              </Link>
            </p>
          </>
        ) : (
          <>
            <p className="text-xs text-slate-500">
              New campus business or event sponsor?{' '}
              <Link
                to="/business/register"
                className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                Register your business account
              </Link>
            </p>
            <p className="text-[11px] text-slate-400">
              Looking for student feed?{' '}
              <button
                type="button"
                onClick={() => setLoginMode('student')}
                className="font-semibold text-slate-700 hover:underline"
              >
                Switch to Student Login
              </button>
            </p>
          </>
        )}
      </CardFooter>
    </Card>
  );
};
