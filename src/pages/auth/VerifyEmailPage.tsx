import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Mail, CheckCircle2, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { toast } from 'sonner';

export const VerifyEmailPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = (location.state as any)?.email || '';
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleResend = async () => {
    if (!email) {
      toast.error('Email address not found. Please log in or sign up again.');
      return;
    }
    if (!isSupabaseConfigured) {
      toast.info('Simulated email resend (Supabase keys not yet configured).');
      return;
    }

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) {
        toast.error(error.message);
      } else {
        setResendSuccess(true);
        toast.success('Verification email resent successfully!');
      }
    } catch (err) {
      toast.error('Failed to resend verification email.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="rounded-2xl border-slate-200 shadow-card text-center">
      <CardHeader className="space-y-3 pb-2">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-8 ring-indigo-50/50">
          <Mail className="h-7 w-7" />
        </div>
        <CardTitle className="text-xl font-bold tracking-tight text-slate-900">
          Check your student email
        </CardTitle>
        <CardDescription className="max-w-sm mx-auto text-xs leading-relaxed">
          We’ve sent an email verification link to{' '}
          <strong className="text-slate-900 font-semibold">{email || 'your registered email'}</strong>.
          Click the link to verify your identity.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {resendSuccess && (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700 font-medium border border-emerald-100">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>Verification link sent! Check your inbox and spam folder.</span>
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          <Button
            variant="outline"
            onClick={handleResend}
            isLoading={isResending}
            className="w-full font-semibold text-xs h-10"
          >
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Resend Verification Link
          </Button>

          <Button
            onClick={() => navigate('/onboarding', { state: { step: 2, email } })}
            className="w-full font-bold text-xs h-10"
          >
            <span>Proceed to Phone Verification</span>
            <ArrowRight className="ml-2 h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>

      <CardFooter className="flex justify-center border-t border-slate-100 pt-4">
        <Link
          to="/login"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
        >
          Return to Sign In
        </Link>
      </CardFooter>
    </Card>
  );
};
