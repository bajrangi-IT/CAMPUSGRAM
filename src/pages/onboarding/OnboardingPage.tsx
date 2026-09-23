import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Mail,
  Phone,
  User,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Upload,
  Check,
  Building2,
  GraduationCap,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { toast } from 'sonner';

const AVAILABLE_SKILLS = [
  'Python', 'JavaScript', 'React', 'AI / ML', 'Competitive Programming',
  'UI/UX Design', 'Video Editing', 'Content Writing', 'Public Speaking',
  'Event Management', 'Robotics', 'Data Analytics', 'Marketing', 'Photography'
];

const AVAILABLE_INTERESTS = [
  'Tech & Hackathons', 'Entrepreneurship', 'Cultural Festivals', 'Debating Society',
  'Sports & Fitness', 'Music & Jamming', 'Photography & Film', 'Research & Academia',
  'Gaming & Esports', 'Community Service', 'Finance & Investing', 'Book Club'
];

export const OnboardingPage: React.FC = () => {
  const { user, profile, refreshProfile, sendPhoneOtp, verifyPhoneOtp, updateProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const initialStep = (location.state as any)?.step || profile?.onboarding_step || 1;
  const [currentStep, setCurrentStep] = useState<number>(initialStep);

  // Form states
  const [emailStatus, setEmailStatus] = useState<boolean>(Boolean(user?.email_confirmed_at));
  const [phone, setPhone] = useState(profile?.phone || (location.state as any)?.phone || '');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState<boolean>(Boolean(profile?.phone_verified));

  // Profile setup
  const [username, setUsername] = useState(profile?.username || '');
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState<string>(profile?.profile_photo || '');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(profile?.skills || []);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(profile?.interests || []);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user?.email_confirmed_at) {
      setEmailStatus(true);
    }
  }, [user]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  // Step 2: Phone OTP trigger
  const handleSendPhoneOtp = async () => {
    if (!phone) {
      setErrorMessage('Please enter your phone number with country code');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const { error } = await sendPhoneOtp(phone);
      if (error) {
        setErrorMessage(error.message);
        return;
      }
      setOtpSent(true);
      toast.success('SMS OTP sent to your phone!');
    } catch (err: any) {
      setErrorMessage('Failed to send OTP code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyPhoneOtp = async () => {
    if (!phoneOtp) {
      setErrorMessage('Enter the OTP sent to your phone');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const { error } = await verifyPhoneOtp(phone, phoneOtp);
      if (error) {
        setErrorMessage(error.message);
        return;
      }
      setPhoneVerified(true);
      toast.success('Phone verified!');
      setCurrentStep(3);
    } catch (err: any) {
      setErrorMessage('Failed to verify OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Save profile
  const handleSaveProfile = async () => {
    if (!username.trim()) {
      setErrorMessage('Username is required.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Check username uniqueness if modified
      if (username !== profile?.username && isSupabaseConfigured) {
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username.trim().toLowerCase())
          .maybeSingle();

        if (existing && existing.id !== user?.id) {
          setErrorMessage('This username is already taken. Please choose another.');
          setIsLoading(false);
          return;
        }
      }

      await updateProfile({
        full_name: fullName,
        username: username.trim().toLowerCase(),
        bio: bio.trim(),
        profile_photo: avatarUrl || null,
        onboarding_step: 4,
      });

      toast.success('Profile details saved.');
      setCurrentStep(4);
    } catch (err: any) {
      setErrorMessage('Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 4: Save Skills and Interests
  const handleSaveInterests = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await updateProfile({
        skills: selectedSkills,
        interests: selectedInterests,
        onboarding_step: 5,
        onboarding_completed: true,
      });

      await refreshProfile();
      setCurrentStep(5);
    } catch (err: any) {
      setErrorMessage('Failed to save preferences.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 5: Finish
  const handleCompleteOnboarding = () => {
    toast.success('Welcome to your campus community!');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 flex flex-col justify-center items-center">
      {/* Onboarding Header */}
      <div className="w-full max-w-xl text-center mb-6">
        <div className="inline-flex items-center space-x-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
          <Sparkles className="h-4 w-4" />
          <span>Campus Member Setup</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Welcome to CampusGram
        </h1>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {[1, 2, 3, 4, 5].map((stepNum) => (
            <div
              key={stepNum}
              className={`h-2 rounded-full transition-all duration-300 ${
                stepNum === currentStep
                  ? 'w-8 bg-indigo-600'
                  : stepNum < currentStep
                  ? 'w-4 bg-emerald-500'
                  : 'w-4 bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>

      <Card className="w-full max-w-xl rounded-2xl shadow-card border-slate-200">
        {errorMessage && (
          <div className="m-6 mb-0 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: EMAIL VERIFICATION */}
        {currentStep === 1 && (
          <div>
            <CardHeader className="text-center space-y-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-8 ring-indigo-50/50">
                <Mail className="h-7 w-7" />
              </div>
              <CardTitle className="text-lg">Step 1: Verify your Campus Email</CardTitle>
              <CardDescription className="text-xs">
                To guarantee a trusted private network, all accounts must verify their institutional email.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-600">Registered Email:</span>
                  <span className="font-mono font-medium text-slate-900">
                    {user?.email || profile?.email || 'Your campus email'}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  {emailStatus ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Email Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
                      Pending Verification Link Click
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => setCurrentStep(2)}
                  className="w-full font-bold text-xs h-11"
                >
                  <span>Continue to Phone Verification</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </div>
        )}

        {/* STEP 2: PHONE OTP VERIFICATION */}
        {currentStep === 2 && (
          <div>
            <CardHeader className="text-center space-y-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-8 ring-indigo-50/50">
                <Phone className="h-7 w-7" />
              </div>
              <CardTitle className="text-lg">Step 2: Phone OTP Verification</CardTitle>
              <CardDescription className="text-xs">
                Real SMS verification secures direct messaging and campus marketplace transactions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!otpSent ? (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Phone Number with country code
                    </label>
                    <Input
                      type="tel"
                      placeholder="+14155552671"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleSendPhoneOtp}
                    isLoading={isLoading}
                    className="w-full font-bold text-xs h-10"
                  >
                    Send Verification SMS Code
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Enter 6-digit SMS OTP
                    </label>
                    <Input
                      type="text"
                      placeholder="••••••"
                      value={phoneOtp}
                      onChange={(e) => setPhoneOtp(e.target.value)}
                      className="text-center font-mono text-lg tracking-widest"
                    />
                  </div>
                  <Button
                    onClick={handleVerifyPhoneOtp}
                    isLoading={isLoading}
                    className="w-full font-bold text-xs h-11"
                  >
                    Verify OTP & Proceed
                  </Button>
                </div>
              )}

              <div className="flex justify-between items-center text-xs text-slate-500 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="hover:text-slate-800"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="text-indigo-600 hover:text-indigo-700 font-semibold"
                >
                  Skip for now
                </button>
              </div>
            </CardContent>
          </div>
        )}

        {/* STEP 3: PROFILE SETUP */}
        {currentStep === 3 && (
          <div>
            <CardHeader className="text-center space-y-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-8 ring-indigo-50/50">
                <User className="h-7 w-7" />
              </div>
              <CardTitle className="text-lg">Step 3: Setup your Profile</CardTitle>
              <CardDescription className="text-xs">
                Pick a unique username and tell your campus peers a little about yourself.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 ring-2 ring-indigo-100">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="text-lg font-bold">
                    {fullName ? fullName.substring(0, 2).toUpperCase() : 'CG'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Profile Photo URL
                  </label>
                  <Input
                    type="url"
                    placeholder="https://example.com/avatar.jpg"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Unique Username
                </label>
                <Input
                  type="text"
                  placeholder="e.g. alex_j"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  leftIcon={<span className="text-slate-400 font-mono">@</span>}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Full Name
                </label>
                <Input
                  type="text"
                  placeholder="Alex Johnson"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Bio / Status
                </label>
                <Textarea
                  placeholder="Passionate about robotics, hackathons, and campus tennis."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={160}
                />
                <span className="text-[10px] text-slate-400 text-right block mt-1">
                  {bio.length}/160 characters
                </span>
              </div>

              <Button
                onClick={handleSaveProfile}
                isLoading={isLoading}
                className="w-full font-bold text-xs h-11"
              >
                <span>Save & Continue</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </div>
        )}

        {/* STEP 4: INTERESTS & SKILLS */}
        {currentStep === 4 && (
          <div>
            <CardHeader className="text-center space-y-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-8 ring-indigo-50/50">
                <Sparkles className="h-7 w-7" />
              </div>
              <CardTitle className="text-lg">Step 4: Select Interests & Skills</CardTitle>
              <CardDescription className="text-xs">
                This personalizes your campus feed, club suggestions, and hackathon team matches.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
                  Campus Interests
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_INTERESTS.map((interest) => {
                    const isSelected = selectedInterests.includes(interest);
                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected && <Check className="inline-block h-3 w-3 mr-1" />}
                        {interest}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
                  Skills & Expertise
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_SKILLS.map((skill) => {
                    const isSelected = selectedSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected && <Check className="inline-block h-3 w-3 mr-1" />}
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button
                onClick={handleSaveInterests}
                isLoading={isLoading}
                className="w-full font-bold text-xs h-11 mt-4"
              >
                <span>Save Preferences</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </div>
        )}

        {/* STEP 5: ENTER APPLICATION */}
        {currentStep === 5 && (
          <div>
            <CardHeader className="text-center space-y-3 pb-2">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <CardTitle className="text-xl font-black tracking-tight text-slate-900">
                You're All Set!
              </CardTitle>
              <CardDescription className="text-xs leading-relaxed max-w-sm mx-auto">
                Your profile is active on your private campus network. Connect with classmates,
                join student clubs, and explore campus opportunities.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <Button
                onClick={handleCompleteOnboarding}
                className="w-full font-bold text-sm h-12 rounded-xl"
              >
                <span>Enter CampusGram</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </div>
        )}
      </Card>
    </div>
  );
};
