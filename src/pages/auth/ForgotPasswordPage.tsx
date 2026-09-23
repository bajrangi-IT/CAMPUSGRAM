import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { toast } from 'sonner';

export const ForgotPasswordPage: React.FC = () => {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter your campus email address.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const { error } = await sendPasswordReset(email);
      if (error) {
        setErrorMsg(error.message);
        return;
      }

      setSubmitted(true);
      toast.success('Password reset link sent to your email.');
    } catch (err: any) {
      setErrorMsg('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="rounded-2xl border-slate-200 shadow-card">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-bold tracking-tight text-slate-900">
          Reset password
        </CardTitle>
        <CardDescription>
          Enter your registered student email and we'll send you instructions to reset your password.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {errorMsg && (
          <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {submitted ? (
          <div className="space-y-4 text-center py-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Check your email</h4>
              <p className="mt-1 text-xs text-slate-500">
                We've sent a password reset link to <strong className="text-slate-800">{email}</strong>.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setSubmitted(false)}
              className="text-xs h-9 font-semibold"
            >
              Try another email
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Campus Email
              </label>
              <Input
                type="email"
                placeholder="student@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="h-4 w-4" />}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full font-bold text-sm h-11 rounded-xl"
              isLoading={isLoading}
            >
              <span>Send Reset Instructions</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        )}
      </CardContent>

      <CardFooter className="flex justify-center border-t border-slate-100 pt-4">
        <Link
          to="/login"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
        >
          Back to Login
        </Link>
      </CardFooter>
    </Card>
  );
};
