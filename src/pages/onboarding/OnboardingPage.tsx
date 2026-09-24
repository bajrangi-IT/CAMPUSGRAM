import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Building2,
  Mail,
  User,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Check,
  Search,
  Plus,
  GraduationCap,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { getAllColleges, registerNewCollege, getCollegeById } from '@/services/collegesService';
import { College } from '@/types/database.types';
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
  const { user, profile, college, refreshProfile, updateProfile, switchCampus } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const initialStep = (location.state as any)?.step || profile?.onboarding_step || 1;
  const [currentStep, setCurrentStep] = useState<number>(initialStep);

  // Step 1: Campus Selection States
  const [collegesList, setCollegesList] = useState<College[]>(getAllColleges());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollege, setSelectedCollege] = useState<College>(
    college || getCollegeById(profile?.college_id) || collegesList[0]
  );
  const [showCustomCampusInput, setShowCustomCampusInput] = useState(false);
  const [customCampusName, setCustomCampusName] = useState('');

  // Step 2: Email & Verification States
  const [emailStatus, setEmailStatus] = useState<boolean>(true);

  // Step 3: Academic & Profile States
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [course, setCourse] = useState(profile?.course || 'B.Tech Computer Science');
  const [branch, setBranch] = useState(profile?.branch || 'Engineering');
  const [year, setYear] = useState(profile?.year || '1st Year');
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState<string>(profile?.profile_photo || '');

  // Step 4: Skills & Interests
  const [selectedSkills, setSelectedSkills] = useState<string[]>(profile?.skills || ['React', 'Python']);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(profile?.interests || ['Tech & Hackathons', 'Cultural Festivals']);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setCollegesList(getAllColleges());
  }, []);

  const filteredColleges = collegesList.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.domain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectCollege = (col: College) => {
    setSelectedCollege(col);
    setErrorMessage(null);
  };

  const handleAddNewCampus = () => {
    if (!customCampusName.trim()) {
      setErrorMessage('Please enter your college name');
      return;
    }
    const newCol = registerNewCollege(customCampusName.trim());
    setCollegesList(getAllColleges());
    setSelectedCollege(newCol);
    setShowCustomCampusInput(false);
    setCustomCampusName('');
    toast.success(`Registered new campus node: ${newCol.name}`);
  };

  // Step 1: Save Campus
  const handleSaveCampus = async () => {
    if (!selectedCollege) {
      setErrorMessage('Please select your campus to proceed.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      switchCampus(selectedCollege);
      await updateProfile({
        college_id: selectedCollege.id,
        onboarding_step: 2,
      });
      toast.success(`Campus environment set: ${selectedCollege.name}`);
      setCurrentStep(2);
    } catch {
      setErrorMessage('Failed to save campus selection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Save Academic Profile
  const handleSaveProfile = async () => {
    if (!fullName.trim() || !username.trim()) {
      setErrorMessage('Full name and username are required.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await updateProfile({
        full_name: fullName.trim(),
        username: username.trim().toLowerCase(),
        course: course.trim(),
        branch: branch.trim(),
        year: year.trim(),
        bio: bio.trim(),
        profile_photo: avatarUrl || null,
        onboarding_step: 4,
      });
      toast.success('Academic profile details saved.');
      setCurrentStep(4);
    } catch {
      setErrorMessage('Failed to save profile.');
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
    } catch {
      setErrorMessage('Failed to save preferences.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteOnboarding = () => {
    toast.success(`Welcome to ${selectedCollege.name} on CampusGram!`);
    navigate('/');
  };

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

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 flex flex-col justify-center items-center">
      {/* Header */}
      <div className="w-full max-w-xl text-center mb-6">
        <div className="inline-flex items-center space-x-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
          <Sparkles className="h-4 w-4" />
          <span>Campus Member Setup</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Welcome to CampusGram
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Each campus has its own isolated, private community environment.
        </p>

        {/* Step Indicator */}
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

      <Card className="w-full max-w-xl rounded-2xl shadow-card border-slate-200 bg-white overflow-hidden">
        {errorMessage && (
          <div className="m-5 mb-0 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: SELECT CAMPUS (SBSE PHLE CAMPUS POOCHE) */}
        {currentStep === 1 && (
          <div>
            <CardHeader className="text-center space-y-2 pb-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-8 ring-indigo-50/50">
                <Building2 className="h-7 w-7" />
              </div>
              <CardTitle className="text-lg font-bold">Step 1: Select Your Campus Node</CardTitle>
              <CardDescription className="text-xs">
                CampusGram isolates each college community. Choose your campus to connect exclusively with your classmates, clubs, and professors.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Search bar */}
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search college name or domain (e.g. IIT Bombay, DU)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="h-4 w-4 text-slate-400" />}
                  className="h-10 text-xs"
                />
              </div>

              {/* College selection list */}
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                {filteredColleges.map((col) => {
                  const isSelected = selectedCollege?.id === col.id;
                  return (
                    <div
                      key={col.id}
                      onClick={() => handleSelectCollege(col)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <Avatar className="h-9 w-9 shrink-0 ring-1 ring-slate-200">
                          <AvatarImage src={col.logo || ''} />
                          <AvatarFallback className="text-[10px] font-bold">
                            {col.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {col.name}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            @{col.domain}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 ml-2">
                        {isSelected ? (
                          <div className="h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                            <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                          </div>
                        ) : (
                          <div className="h-6 w-6 rounded-full border border-slate-300" />
                        )}
                      </div>
                    </div>
                  );
                })}

                {filteredColleges.length === 0 && (
                  <p className="text-center py-4 text-xs text-slate-500">
                    No matching colleges found. Register your college below!
                  </p>
                )}
              </div>

              {/* Custom campus registration toggle */}
              {!showCustomCampusInput ? (
                <button
                  type="button"
                  onClick={() => setShowCustomCampusInput(true)}
                  className="w-full text-left text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1.5 py-1"
                >
                  <Plus className="h-4 w-4" />
                  <span>College not listed? Add your campus</span>
                </button>
              ) : (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Register New Campus Environment
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="e.g. St. Xavier's College, Mumbai"
                      value={customCampusName}
                      onChange={(e) => setCustomCampusName(e.target.value)}
                      className="h-9 text-xs flex-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddNewCampus}
                      className="h-9 text-xs font-bold"
                    >
                      Add Campus
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCustomCampusInput(false)}
                      className="h-9 text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Selected confirmation */}
              {selectedCollege && (
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>
                      Selected Campus: <strong className="font-bold">{selectedCollege.name}</strong>
                    </span>
                  </div>
                </div>
              )}

              <Button
                onClick={handleSaveCampus}
                isLoading={isLoading}
                className="w-full font-bold text-xs h-11"
              >
                <span>Confirm Campus & Continue</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </div>
        )}

        {/* STEP 2: EMAIL VERIFICATION */}
        {currentStep === 2 && (
          <div>
            <CardHeader className="text-center space-y-2 pb-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-8 ring-indigo-50/50">
                <Mail className="h-7 w-7" />
              </div>
              <CardTitle className="text-lg font-bold">Step 2: Campus Email & Student Status</CardTitle>
              <CardDescription className="text-xs">
                To guarantee safety and privacy, accounts on CampusGram belong strictly to verified students and faculty.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-600">Active Campus:</span>
                  <span className="font-bold text-slate-900">{selectedCollege.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-600">Registered Email:</span>
                  <span className="font-mono font-medium text-slate-900">
                    {user?.email || profile?.email || 'student@campus.edu'}
                  </span>
                </div>
                <div className="pt-2 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Institutional Access Granted
                  </span>
                </div>
              </div>

              <div className="flex justify-between gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  className="font-bold text-xs h-11 px-5"
                >
                  Change Campus
                </Button>
                <Button
                  onClick={() => setCurrentStep(3)}
                  className="flex-1 font-bold text-xs h-11"
                >
                  <span>Continue to Profile Setup</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </div>
        )}

        {/* STEP 3: SETUP PROFILE */}
        {currentStep === 3 && (
          <div>
            <CardHeader className="text-center space-y-2 pb-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-8 ring-indigo-50/50">
                <GraduationCap className="h-7 w-7" />
              </div>
              <CardTitle className="text-lg font-bold">Step 3: Setup Academic Profile</CardTitle>
              <CardDescription className="text-xs">
                Introduce yourself to classmates and peers at {selectedCollege.name}.
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
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Full Name
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Ashu Verma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Username
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. ashu.dev"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                    leftIcon={<span className="text-slate-400 font-mono">@</span>}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Degree / Course
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. B.Tech"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="col-span-1">
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Branch / Dept
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. CSE"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="col-span-1">
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Year
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full h-9 rounded-xl border border-slate-200 bg-white px-2 text-xs font-medium text-slate-800"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="Final Year">Final Year</option>
                    <option value="Postgraduate">Postgraduate</option>
                    <option value="Faculty">Faculty</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Bio / Campus Status
                </label>
                <Textarea
                  placeholder="Passionate about robotics, open source, and campus football."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={160}
                  className="min-h-[64px] text-xs"
                />
              </div>

              <div className="flex justify-between gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  className="font-bold text-xs h-11 px-5"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSaveProfile}
                  isLoading={isLoading}
                  className="flex-1 font-bold text-xs h-11"
                >
                  <span>Save Academic Details</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </div>
        )}

        {/* STEP 4: INTERESTS & SKILLS */}
        {currentStep === 4 && (
          <div>
            <CardHeader className="text-center space-y-2 pb-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-8 ring-indigo-50/50">
                <Sparkles className="h-7 w-7" />
              </div>
              <CardTitle className="text-lg font-bold">Step 4: Select Interests & Skills</CardTitle>
              <CardDescription className="text-xs">
                This customizes your campus feed, club suggestions, and hackathon team matches at {selectedCollege.name}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
                  Campus Interests & Clubs
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
                  Skills & Technical Domains
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

              <div className="flex justify-between gap-3 pt-3">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(3)}
                  className="font-bold text-xs h-11 px-5"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSaveInterests}
                  isLoading={isLoading}
                  className="flex-1 font-bold text-xs h-11"
                >
                  <span>Save Preferences</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </div>
        )}

        {/* STEP 5: READY & ISOLATED ENVIRONMENT CONFIRMATION */}
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
                Welcome to your private campus network for{' '}
                <strong className="text-slate-800 font-bold">{selectedCollege.name}</strong>.
                You will only interact with students, clubs, and events belonging to your college.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Active Campus Node:</span>
                  <span className="font-bold text-slate-800">{selectedCollege.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Domain Scoped:</span>
                  <span className="font-mono text-slate-700">@{selectedCollege.domain}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Privacy Status:</span>
                  <span className="font-semibold text-emerald-700">Campus Isolated & Secured</span>
                </div>
              </div>

              <Button
                onClick={handleCompleteOnboarding}
                className="w-full font-bold text-sm h-12 rounded-xl"
              >
                <span>Enter {selectedCollege.name.split(' ')[0]} CampusGram</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </div>
        )}
      </Card>
    </div>
  );
};
