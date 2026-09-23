import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Briefcase,
  Layers,
  Eye,
  ExternalLink,
  Building,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { advertisingService } from '@/services/advertisingService';
import { AdvertiserAccount, Campaign } from '@/types/business.types';
import { toast } from 'sonner';

export const AdminModerationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'advertisers'>('campaigns');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [advertisers, setAdvertisers] = useState<AdvertiserAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [camps, advs] = await Promise.all([
        advertisingService.getAllCampaignsForModeration(),
        advertisingService.getAllAdvertisers(),
      ]);
      setCampaigns(camps);
      setAdvertisers(advs);
    } catch {
      toast.error('Failed to load moderation data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReviewCampaign = async (campaignId: string, approved: boolean) => {
    const success = await advertisingService.reviewCampaign(
      campaignId,
      approved,
      approved ? 'Approved by campus compliance administrator' : 'Content does not meet student guidelines'
    );
    if (success) {
      toast.success(approved ? 'Campaign approved for delivery!' : 'Campaign rejected');
      loadData();
    } else {
      toast.error('Moderation action failed');
    }
  };

  const handleVerifyAdvertiser = async (advertiserId: string, status: 'verified' | 'rejected' | 'suspended') => {
    const success = await advertisingService.verifyAdvertiser(advertiserId, status);
    if (success) {
      toast.success(`Advertiser status updated to ${status}`);
      loadData();
    } else {
      toast.error('Action failed');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <ShieldAlert className="h-4 w-4" />
            <span>Campus Administration</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Ad Review & Moderation</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review and moderate commercial advertiser registrations and promotional campaigns before public delivery.
          </p>
        </div>

        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'campaigns' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            Campaigns ({campaigns.length})
          </button>
          <button
            onClick={() => setActiveTab('advertisers')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'advertisers' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            Advertisers ({advertisers.length})
          </button>
        </div>
      </div>

      {/* Campaigns Moderation Tab */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          {campaigns.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No campaigns in moderation queue"
              description="When advertisers submit campaigns for review, they will appear here for compliance sign-off."
            />
          ) : (
            campaigns.map((camp) => {
              const creative = camp.creatives?.[0];
              const isPending = camp.status === 'pending_review';

              return (
                <Card key={camp.id} className="rounded-2xl border-slate-200 bg-white p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-base text-slate-900">{camp.title}</span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          camp.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : camp.status === 'pending_review'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {camp.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Objective: <strong className="text-slate-700 capitalize">{camp.objective}</strong> • Format: {creative?.format} • Budget: ₹{camp.budget.toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {isPending ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleReviewCampaign(camp.id, true)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl h-8 gap-1.5"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Approve</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReviewCampaign(camp.id, false)}
                            className="text-rose-600 border-rose-200 hover:bg-rose-50 font-bold text-xs rounded-xl h-8 gap-1.5"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Reject</span>
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReviewCampaign(camp.id, camp.status !== 'active')}
                          className="text-xs font-bold rounded-xl h-8"
                        >
                          {camp.status === 'active' ? 'Pause Campaign' : 'Re-Approve'}
                        </Button>
                      )}
                    </div>
                  </div>

                  {creative && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs">
                      <span className="font-bold text-slate-800 block text-sm">{creative.headline}</span>
                      <p className="text-slate-600">{creative.description}</p>
                      {creative.destination_url && (
                        <a
                          href={creative.destination_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:underline flex items-center gap-1 font-semibold pt-1"
                        >
                          <span>Destination: {creative.destination_url}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Advertisers Moderation Tab */}
      {activeTab === 'advertisers' && (
        <div className="space-y-4">
          {advertisers.length === 0 ? (
            <EmptyState
              icon={Building}
              title="No registered advertisers"
              description="When business partners submit their registration, they will appear here for verification."
            />
          ) : (
            advertisers.map((adv) => (
              <Card key={adv.id} className="rounded-2xl border-slate-200 bg-white p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-slate-900">{adv.business_name}</span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        adv.verification_status === 'verified'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {adv.verification_status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Category: <strong className="text-slate-700">{adv.category}</strong> • Contact: {adv.email || adv.phone || 'N/A'}
                    </p>
                    {adv.description && (
                      <p className="text-xs text-slate-600 mt-1.5 line-clamp-2">{adv.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleVerifyAdvertiser(adv.id, 'verified')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl h-8 gap-1"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Verify</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVerifyAdvertiser(adv.id, 'suspended')}
                      className="text-amber-700 border-amber-200 hover:bg-amber-50 font-bold text-xs rounded-xl h-8 gap-1"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>Suspend</span>
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};
