import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Target,
  Sparkles,
  ShieldCheck,
  Calendar,
  Image as ImageIcon,
  ExternalLink,
  Tag,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Info,
  DollarSign,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { advertisingService } from '@/services/advertisingService';
import {
  CampaignObjective,
  PricingModel,
  AdFormat,
  AdCtaType,
  TargetingCriteria,
} from '@/types/business.types';
import { toast } from 'sonner';

const OBJECTIVES: { id: CampaignObjective; label: string; desc: string }[] = [
  { id: 'reach', label: 'Maximum Campus Reach', desc: 'Promote brand awareness across student feeds and stories.' },
  { id: 'clicks', label: 'Website / App Clicks', desc: 'Drive qualified traffic to your website or external portal.' },
  { id: 'offer_claims', label: 'Campus Deal & Discount Claims', desc: 'Publish student discount vouchers and coupons.' },
  { id: 'applications', label: 'Hiring & Recruitment', desc: 'Recruit interns, graduates, and hackathon competitors.' },
  { id: 'event_registrations', label: 'Sponsored Event Attendance', desc: 'Promote workshops, hackathons, and guest lectures.' },
];

const FORMATS: { id: AdFormat; label: string }[] = [
  { id: 'sponsored_post', label: 'Native Feed Post' },
  { id: 'sponsored_story', label: 'Sponsored 24h Story' },
  { id: 'campus_deal', label: 'Campus Deal / Coupon' },
  { id: 'recruitment', label: 'Job / Internship Card' },
  { id: 'sponsored_event', label: 'Promoted Event' },
];

const CTA_OPTIONS: { id: AdCtaType; label: string }[] = [
  { id: 'learn_more', label: 'Learn More' },
  { id: 'claim_offer', label: 'Claim Offer' },
  { id: 'apply_now', label: 'Apply Now' },
  { id: 'register', label: 'Register' },
  { id: 'visit_website', label: 'Visit Website' },
];

const SAMPLE_BRANCHES = ['CSE', 'AIML', 'ECE', 'Mechanical', 'Electrical', 'Civil', 'Business / MBA', 'IT'];
const SAMPLE_YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

export const CreateCampaignPage: React.FC = () => {
  const { user, college } = useAuth();
  const navigate = useNavigate();

  // Wizard Step (1: Objective & Format, 2: Creative, 3: Targeting, 4: Budget & Schedule)
  const [step, setStep] = useState<number>(1);

  // Form State
  const [title, setTitle] = useState('');
  const [objective, setObjective] = useState<CampaignObjective>('reach');
  const [format, setFormat] = useState<AdFormat>('sponsored_post');

  // Creative
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [ctaType, setCtaType] = useState<AdCtaType>('learn_more');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState('20');

  // Targeting
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [interestsInput, setInterestsInput] = useState('');

  // Budget & Schedule
  const [pricingModel, setPricingModel] = useState<PricingModel>('cpm');
  const [bidAmount, setBidAmount] = useState('5.00');
  const [totalBudget, setTotalBudget] = useState('1500');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleBranch = (branch: string) => {
    setSelectedBranches((prev) =>
      prev.includes(branch) ? prev.filter((b) => b !== branch) : [...prev, branch]
    );
  };

  const toggleYear = (yr: string) => {
    setSelectedYears((prev) =>
      prev.includes(yr) ? prev.filter((y) => y !== yr) : [...prev, yr]
    );
  };

  const handleSubmitCampaign = async () => {
    if (!user) return;
    if (!title.trim() || !headline.trim() || !description.trim()) {
      toast.error('Please complete all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const acc = await advertisingService.getAdvertiserAccount(user.id);
      if (!acc) {
        toast.error('Please register your business account first');
        navigate('/business/register');
        return;
      }

      const targetingCriteria: TargetingCriteria = {
        colleges: college?.id ? [college.id] : undefined,
        branches: selectedBranches.length > 0 ? selectedBranches : undefined,
        years: selectedYears.length > 0 ? selectedYears : undefined,
        interests: interestsInput
          ? interestsInput.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined,
      };

      await advertisingService.createCampaign({
        advertiserId: acc.id,
        title: title.trim(),
        objective,
        pricingModel,
        bidAmount: parseFloat(bidAmount) || 5.0,
        totalBudget: parseFloat(totalBudget) || 1000.0,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        targetingCriteria,
        creative: {
          headline: headline.trim(),
          description: description.trim(),
          format,
          imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
          ctaType,
          destinationUrl: destinationUrl.trim() || 'https://campusgram.edu',
          dealDetails:
            format === 'campus_deal'
              ? {
                  discount_code: discountCode.trim() || 'CAMPUS20',
                  discount_percent: parseInt(discountPercent, 10) || 20,
                  valid_until: new Date(endDate).toISOString(),
                }
              : undefined,
        },
      });

      toast.success('Campaign submitted for review! It will deliver automatically once approved.');
      navigate('/business/campaigns');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl pb-16 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-5">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Create Campaign</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Set up precision campus advertising with native sponsored posts, stories, deals, or hiring drives.
        </p>
      </div>

      {/* Stepper Tabs */}
      <div className="grid grid-cols-4 gap-2 text-xs font-bold text-center">
        {[
          { num: 1, label: '1. Objective' },
          { num: 2, label: '2. Creative' },
          { num: 3, label: '3. Targeting' },
          { num: 4, label: '4. Budget' },
        ].map((s) => (
          <div
            key={s.num}
            onClick={() => s.num < step && setStep(s.num)}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              step === s.num
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : step > s.num
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-white text-slate-400 border-slate-200'
            }`}
          >
            {s.label}
          </div>
        ))}
      </div>

      {/* Step 1: Objective & Format */}
      {step === 1 && (
        <Card className="rounded-2xl border-slate-200/80 bg-white p-6 space-y-6">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Campaign Reference Name</label>
            <Input
              placeholder="e.g. Monsoon Student Meal Deal 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">Campaign Objective</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {OBJECTIVES.map((obj) => (
                <div
                  key={obj.id}
                  onClick={() => setObjective(obj.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    objective === obj.id
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span className="font-bold text-slate-900 text-sm block">{obj.label}</span>
                  <span className="text-xs text-slate-500 mt-1 block">{obj.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">Ad Creative Format</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {FORMATS.map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => setFormat(fmt.id)}
                  className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                    format === fmt.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button
              onClick={() => {
                if (!title.trim()) {
                  toast.error('Please enter a campaign name');
                  return;
                }
                setStep(2);
              }}
              className="gap-2 font-bold"
            >
              <span>Continue to Creative</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Creative & Messaging */}
      {step === 2 && (
        <Card className="rounded-2xl border-slate-200/80 bg-white p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Inputs */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Headline</label>
                <Input
                  placeholder="e.g. Flat 20% Off All Burgers for Students"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Creative Description</label>
                <Textarea
                  placeholder="Flash your CampusGram student profile or use code at billing counter..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Banner / Image URL</label>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Call to Action (CTA)</label>
                  <select
                    value={ctaType}
                    onChange={(e: any) => setCtaType(e.target.value)}
                    className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {CTA_OPTIONS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Destination Web Link</label>
                  <Input
                    type="url"
                    placeholder="https://yourbrand.com/offer"
                    value={destinationUrl}
                    onChange={(e) => setDestinationUrl(e.target.value)}
                  />
                </div>
              </div>

              {format === 'campus_deal' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-3">
                  <span className="text-xs font-bold text-amber-900 block">Deal Voucher Details</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-amber-800 block mb-1">Promo Code</label>
                      <Input
                        placeholder="CAMPUS20"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value)}
                        className="bg-white font-mono uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-amber-800 block mb-1">Discount %</label>
                      <Input
                        type="number"
                        placeholder="20"
                        value={discountPercent}
                        onChange={(e) => setDiscountPercent(e.target.value)}
                        className="bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Live Student Feed Preview */}
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-2">Student Feed Preview</label>
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3 shadow-inner">
                <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                        B
                      </div>
                      <div>
                        <span className="font-bold text-xs text-slate-900 block">Your Brand Name</span>
                        <span className="text-[10px] text-slate-400">Campus Partner</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
                      Sponsored
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-900">
                    {headline || 'Your Headline Appears Here'}
                  </p>
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {description || 'Your promotional description will be clearly rendered to student feeds.'}
                  </p>

                  <div className="h-40 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                    {imageUrl ? (
                      <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-slate-300" />
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Free Student Offer</span>
                    <Button size="sm" className="text-xs font-bold rounded-xl h-8">
                      {CTA_OPTIONS.find((c) => c.id === ctaType)?.label || 'Learn More'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            <Button
              onClick={() => {
                if (!headline.trim() || !description.trim()) {
                  toast.error('Please enter headline and description');
                  return;
                }
                setStep(3);
              }}
              className="gap-2 font-bold"
            >
              <span>Continue to Targeting</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Audience Targeting & Privacy */}
      {step === 3 && (
        <Card className="rounded-2xl border-slate-200/80 bg-white p-6 space-y-6">
          {/* Privacy Guarantee Ribbon */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs text-indigo-950">
              <span className="font-bold block text-sm">Protected Campus Audience Targeting</span>
              <p className="mt-0.5 text-indigo-800 leading-relaxed">
                CampusGram executes all demographic matching internally on verified student nodes. Advertisers never receive individual student phone numbers, email addresses, private files, or personal profile data.
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">Target Academic Branches (Optional)</label>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_BRANCHES.map((branch) => {
                const isSelected = selectedBranches.includes(branch);
                return (
                  <button
                    key={branch}
                    type="button"
                    onClick={() => toggleBranch(branch)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {branch}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">Leave unselected to target all branches campus-wide.</p>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">Target Student Year (Optional)</label>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_YEARS.map((yr) => {
                const isSelected = selectedYears.includes(yr);
                return (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => toggleYear(yr)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {yr}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Keywords / Interests (Optional)</label>
            <Input
              placeholder="e.g. AI, Machine Learning, Robotics, Gaming, Coding (comma separated)"
              value={interestsInput}
              onChange={(e) => setInterestsInput(e.target.value)}
            />
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            <Button onClick={() => setStep(4)} className="gap-2 font-bold">
              <span>Continue to Budget & Schedule</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 4: Budget, Pricing Model & Schedule */}
      {step === 4 && (
        <Card className="rounded-2xl border-slate-200/80 bg-white p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Pricing Model</label>
              <select
                value={pricingModel}
                onChange={(e: any) => setPricingModel(e.target.value)}
                className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="cpm">CPM (Cost per 1,000 Impressions)</option>
                <option value="cpc">CPC (Cost per Verified Click)</option>
                <option value="cpa">CPA (Cost per Offer Claim / Action)</option>
                <option value="sponsored_placement">Flat Rate Sponsored Placement</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Total Campaign Budget (₹)</label>
              <Input
                type="number"
                min="500"
                value={totalBudget}
                onChange={(e) => setTotalBudget(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
            <span className="font-bold text-slate-900 block">Campaign Summary</span>
            <div className="flex justify-between text-slate-600">
              <span>Campaign Title:</span>
              <span className="font-semibold text-slate-900">{title}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Objective:</span>
              <span className="font-semibold text-slate-900 capitalize">{objective.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Creative Format:</span>
              <span className="font-semibold text-slate-900">{FORMATS.find((f) => f.id === format)?.label}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Budget:</span>
              <span className="font-extrabold text-indigo-600">₹{parseInt(totalBudget, 10).toLocaleString()}</span>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setStep(3)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            <Button
              onClick={handleSubmitCampaign}
              disabled={isSubmitting}
              className="gap-2 font-bold shadow-sm"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit for Review'}</span>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
