import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Building2,
  Globe,
  Phone,
  Mail,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { advertisingService } from '@/services/advertisingService';
import { toast } from 'sonner';

const BUSINESS_CATEGORIES = [
  'Local Cafe & Restaurant',
  'Tech & Software Company',
  'Education & Test Prep',
  'Retail & Apparel',
  'Student Housing & PG',
  'Books & Stationery',
  'Fitness & Gym',
  'Recruitment & Staffing',
  'Entertainment & Gaming',
  'Other',
];

export const BusinessRegisterPage: React.FC = () => {
  const { user, college } = useAuth();
  const navigate = useNavigate();

  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState(BUSINESS_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [logoUrl, setLogoUrl] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be signed in to register a business account');
      return;
    }
    if (!agreeTerms) {
      toast.error('Please agree to the Campus Advertising & Privacy terms');
      return;
    }

    setIsSubmitting(true);
    try {
      await advertisingService.registerAdvertiser({
        userId: user.id,
        businessName: businessName.trim(),
        category,
        description: description.trim(),
        website: website.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        logoUrl: logoUrl.trim() || undefined,
        collegeId: college?.id,
      });

      toast.success('Business profile registered! Your account is ready for campaign creation.');
      navigate('/business/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      {/* Intro Header */}
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
          <Briefcase className="h-6 w-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Partner with CampusGram
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Reach thousands of verified college students through native campus deals, sponsored stories, promoted events, and recruitment challenges.
        </p>
      </div>

      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-slate-900 text-white p-4 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-indigo-400" />
            <span className="font-semibold">Student Privacy Guaranteed</span>
          </div>
          <span className="text-slate-400 text-[11px]">Free for Students • Performance-Driven for Brands</span>
        </div>

        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Business / Organization Name</label>
              <Input
                placeholder="e.g. Campus Bites Cafe or DevCraft Technologies"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Industry / Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {BUSINESS_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Website or Link</label>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Official Email Contact</label>
                <Input
                  type="email"
                  placeholder="partner@yourbrand.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Phone / WhatsApp Contact</label>
                <Input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Brand Logo URL (Optional)</label>
              <Input
                type="url"
                placeholder="https://... logo image link"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Business Description</label>
              <Textarea
                placeholder="Describe your services, student offerings, or hiring programs..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3 text-[11px] text-slate-600 flex items-start gap-2.5">
              <Info className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
              <span>
                CampusGram operates a strict student privacy policy. Advertisers configure target demographic criteria (e.g. Computer Science, 3rd year), but will never receive individual student phone numbers, emails, or personal profiles.
              </span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="terms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="terms" className="text-xs text-slate-600 select-none">
                I agree to the Campus Advertising Guidelines, Community Standards, and Student Privacy Policy.
              </label>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 font-bold text-sm rounded-xl gap-2 shadow-sm"
            >
              <span>{isSubmitting ? 'Registering...' : 'Register Business Account'}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
