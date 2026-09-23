import React, { useState, useEffect } from 'react';
import {
  Building2,
  Globe,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Save,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { advertisingService } from '@/services/advertisingService';
import { AdvertiserAccount } from '@/types/business.types';
import { toast } from 'sonner';

export const BusinessProfilePage: React.FC = () => {
  const { user, college } = useAuth();
  const [account, setAccount] = useState<AdvertiserAccount | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      setIsLoading(true);
      const acc = await advertisingService.getAdvertiserAccount(user.id);
      if (acc) {
        setAccount(acc);
        setBusinessName(acc.business_name || '');
        setCategory(acc.category || '');
        setDescription(acc.description || '');
        setWebsite(acc.website || '');
        setPhone(acc.phone || '');
        setEmail(acc.email || '');
        setLogoUrl(acc.logo_url || '');
      }
      setIsLoading(false);
    }
    loadData();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;

    setIsSaving(true);
    try {
      const success = await advertisingService.updateAdvertiserProfile(account.id, {
        business_name: businessName.trim(),
        category,
        description: description.trim(),
        website: website.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        logo_url: logoUrl.trim() || undefined,
      });

      if (success) {
        toast.success('Business profile updated successfully');
      } else {
        toast.error('Update failed');
      }
    } catch {
      toast.error('Error saving profile');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusDisplay = (status?: string) => {
    switch (status) {
      case 'verified':
        return {
          icon: CheckCircle,
          color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
          title: 'Verified Campus Partner',
          desc: 'Your business credentials have been officially verified by campus administration. All active campaigns deliver across student feeds without delay.',
        };
      case 'rejected':
        return {
          icon: XCircle,
          color: 'text-rose-700 bg-rose-50 border-rose-200',
          title: 'Verification Not Approved',
          desc: 'Your application did not satisfy campus advertising policies. Contact campus administration for guidance.',
        };
      case 'suspended':
        return {
          icon: AlertTriangle,
          color: 'text-amber-700 bg-amber-50 border-amber-200',
          title: 'Account Temporarily Suspended',
          desc: 'Your advertising account is under administrative hold. Active campaigns are currently paused.',
        };
      default:
        return {
          icon: Clock,
          color: 'text-amber-700 bg-amber-50 border-amber-200',
          title: 'Application Under Review',
          desc: 'Campus administration is reviewing your commercial partnership profile. You can prepare campaigns right now.',
        };
    }
  };

  const statusInfo = getStatusDisplay(account?.verification_status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="max-w-3xl pb-16 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-5">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Business Profile</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Maintain your institutional contact information, company description, and verification status.
        </p>
      </div>

      {/* Verification Status Card */}
      <Card className={`rounded-2xl border p-5 ${statusInfo.color}`}>
        <div className="flex items-start gap-3">
          <StatusIcon className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-extrabold text-sm block">{statusInfo.title}</span>
            <p className="mt-1 leading-relaxed">{statusInfo.desc}</p>
          </div>
        </div>
      </Card>

      {/* Profile Edit Card */}
      <Card className="rounded-2xl border-slate-200/80 bg-white shadow-xs p-6 sm:p-8">
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Company / Brand Name</label>
            <Input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Business Category</label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Website URL</label>
              <Input
                type="url"
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Contact Phone</label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Logo URL</label>
            <Input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Business Bio / Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Button type="submit" disabled={isSaving} className="gap-2 font-bold shadow-sm">
              <Save className="h-4 w-4" />
              <span>{isSaving ? 'Saving Changes...' : 'Save Profile'}</span>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
