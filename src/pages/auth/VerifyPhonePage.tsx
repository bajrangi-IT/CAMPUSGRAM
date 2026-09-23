import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Phone, ShieldCheck, ArrowRight, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { toast } from 'sonner';

export const VerifyPhonePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { sendPhoneOtp, verifyPhoneOtp } = useAuth();

  const initialPhone = (location.state as any)?.phone || '';
  const [phone, setPhone] = useState(initialPhone);
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(Boolean(initialPhone));

  // Countdown timer for resend cooldown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0 && !canResend) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown, canResend]);

  const handleSendOtp = async () => {
    if (!phone) {
      setErrorMessage('Please enter a valid phone number with country code (e.g. +14155552671)');
      return;
    }

    setIsSendingOtp(true);
    setErrorMessage(null);

    try {
      const { error } = await sendPhoneOtp(phone);
      if (error) {
        setErrorMessage(error.message);
        toast.error(`Phone OTP Error: ${error.message}`);
        return;
      }

      setOtpSent(true);
      setCanResend(false);
      setCountdown(60);
      toast.success('Verification OTP sent to your phone via SMS!');
    } catch (err: any) {
      setErrorMessage('Failed to send SMS OTP. Please verify your phone number.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      setErrorMessage('Please enter the 6-digit OTP code sent to your phone.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { error } = await verifyPhoneOtp(phone, otp);

      if (error) {
        if (error.message.includes('expired')) {
          setErrorMessage('The OTP has expired. Please request a new code.');
        } else if (error.message.includes('invalid')) {
          setErrorMessage('Invalid verification code. Please check and re-enter.');
        } else {
          setErrorMessage(error.message);
        }
        return;
      }

      toast.success('Phone verified successfully!');
      navigate('/onboarding', { state: { step: 3 } });
    } catch (err: any) {
      setErrorMessage('Network error while verifying OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="rounded-2xl border-slate-200 shadow-card">
      <CardHeader className="text-center space-y-2">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-8 ring-indigo-50/50">
          <Phone className="h-7 w-7" />
        </div>
        <CardTitle className="text-xl font-bold tracking-tight text-slate-900">
          Verify Phone Number
        </CardTitle>
        <CardDescription className="text-xs leading-relaxed max-w-sm mx-auto">
          Private campus security requires two-factor verification. Enter the SMS code
          sent to your phone.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {errorMessage && (
          <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {!otpSent ? (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Phone Number (E.164 format)
              </label>
              <Input
                type="tel"
                placeholder="+14155552671"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                leftIcon={<Phone className="h-4 w-4" />}
              />
            </div>
            <Button
              onClick={handleSendOtp}
              isLoading={isSendingOtp}
              className="w-full font-bold text-xs h-10"
            >
              <span>Send SMS Code</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  SMS Verification Code
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {phone}
                </span>
              </div>
              <Input
                type="text"
                placeholder="6-digit code (e.g. 123456)"
                value={otp}
                onChange={(e) => setOtp(e.target.value.trim())}
                maxLength={8}
                className="text-center font-mono text-lg tracking-widest"
                autoFocus
              />
            </div>

            <Button
              type="submit"
              className="w-full font-bold text-xs h-11"
              isLoading={isLoading}
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              <span>Verify & Continue</span>
            </Button>

            <div className="flex items-center justify-between pt-1 text-xs">
              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="text-slate-500 hover:text-slate-800"
              >
                Change number
              </button>

              <button
                type="button"
                onClick={handleSendOtp}
                disabled={!canResend || isSendingOtp}
                className={`font-semibold transition-colors ${
                  canResend
                    ? 'text-indigo-600 hover:text-indigo-700 hover:underline'
                    : 'text-slate-400 cursor-not-allowed'
                }`}
              >
                {canResend ? (
                  'Resend code'
                ) : (
                  `Resend in ${countdown}s`
                )}
              </button>
            </div>
          </form>
        )}
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
