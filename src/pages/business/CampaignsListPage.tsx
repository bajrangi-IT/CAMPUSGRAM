import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  PlusCircle,
  Search,
  Filter,
  Play,
  Pause,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  Eye,
  MousePointerClick,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { advertisingService } from '@/services/advertisingService';
import { Campaign, CampaignStatus } from '@/types/business.types';
import { toast } from 'sonner';

const STATUS_TABS: { label: string; value: string }[] = [
  { label: 'All Campaigns', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Pending Review', value: 'pending_review' },
  { label: 'Draft', value: 'draft' },
  { label: 'Paused', value: 'paused' },
  { label: 'Completed', value: 'completed' },
  { label: 'Rejected', value: 'rejected' },
];

export const CampaignsListPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadCampaigns = async () => {
    if (!user) return;
    setIsLoading(true);
    const acc = await advertisingService.getAdvertiserAccount(user.id);
    if (acc) {
      const data = await advertisingService.getCampaigns(
        acc.id,
        activeTab === 'all' ? undefined : (activeTab as CampaignStatus)
      );
      setCampaigns(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadCampaigns();
  }, [user, activeTab]);

  const handleToggleStatus = async (camp: Campaign) => {
    const newStatus: CampaignStatus = camp.status === 'active' ? 'paused' : 'active';
    const success = await advertisingService.updateCampaignStatus(camp.id, newStatus);
    if (success) {
      toast.success(`Campaign ${newStatus === 'active' ? 'resumed' : 'paused'}`);
      loadCampaigns();
    } else {
      toast.error('Failed to update campaign status');
    }
  };

  const filtered = campaigns.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.objective.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: CampaignStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="h-3 w-3 text-emerald-600" />
            <span>Active & Delivering</span>
          </span>
        );
      case 'pending_review':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="h-3 w-3 text-amber-600" />
            <span>Pending Review</span>
          </span>
        );
      case 'paused':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            <Pause className="h-3 w-3 text-slate-500" />
            <span>Paused</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="h-3 w-3 text-rose-600" />
            <span>Rejected</span>
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 capitalize">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Campaigns</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track performance, budget pacing, and status across your campus marketing initiatives.
          </p>
        </div>

        <Button
          onClick={() => navigate('/business/campaigns/create')}
          className="gap-2 font-bold text-xs sm:text-sm h-10 shadow-sm rounded-xl"
        >
          <PlusCircle className="h-4 w-4" />
          <span>New Campaign</span>
        </Button>
      </div>

      {/* Tabs & Search */}
      <div className="space-y-3">
        <div className="w-full sm:w-80">
          <Input
            type="search"
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4 text-slate-400" />}
            className="bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {STATUS_TABS.map((tab) => {
            const active = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  active
                    ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-300'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Campaign Cards List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-white border border-slate-100 p-5 animate-pulse space-y-3">
              <div className="h-5 w-1/3 bg-slate-200 rounded" />
              <div className="h-4 w-1/2 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No campaigns found"
          description={
            search
              ? 'Try modifying your search or status filter.'
              : 'Launch a targeted campus deal or sponsored post to connect with verified students.'
          }
          action={
            <Button
              onClick={() => navigate('/business/campaigns/create')}
              className="gap-2 font-bold text-xs rounded-xl"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Create Campaign</span>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((camp) => (
            <Card
              key={camp.id}
              className="rounded-2xl border-slate-200/80 bg-white p-5 hover:border-indigo-200 transition-all shadow-xs"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-bold text-slate-900 text-base">{camp.title}</h3>
                    {getStatusBadge(camp.status)}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>
                      Objective: <span className="font-semibold text-slate-700 capitalize">{camp.objective.replace('_', ' ')}</span>
                    </span>
                    <span>•</span>
                    <span>
                      Budget: <span className="font-semibold text-slate-700">₹{camp.total_budget.toLocaleString()}</span>
                    </span>
                    <span>•</span>
                    <span>
                      Duration: {new Date(camp.start_date).toLocaleDateString()} &ndash; {new Date(camp.end_date).toLocaleDateString()}
                    </span>
                  </div>

                  {camp.review_notes && (
                    <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="font-semibold text-slate-700">Review Note:</span> {camp.review_notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between lg:justify-end gap-6 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  <div className="flex items-center gap-5 text-xs">
                    <div className="text-center sm:text-right">
                      <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                        Impressions
                      </span>
                      <span className="font-extrabold text-slate-900 text-sm">
                        {camp.impressions_count || 0}
                      </span>
                    </div>

                    <div className="text-center sm:text-right">
                      <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                        Clicks
                      </span>
                      <span className="font-extrabold text-slate-900 text-sm">
                        {camp.clicks_count || 0}
                      </span>
                    </div>

                    <div className="text-center sm:text-right">
                      <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                        CTR
                      </span>
                      <span className="font-extrabold text-emerald-600 text-sm">
                        {camp.ctr || '0.00'}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {(camp.status === 'active' || camp.status === 'paused') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleStatus(camp)}
                        className="text-xs font-bold rounded-xl h-8 gap-1.5"
                      >
                        {camp.status === 'active' ? (
                          <>
                            <Pause className="h-3.5 w-3.5" />
                            <span>Pause</span>
                          </>
                        ) : (
                          <>
                            <Play className="h-3.5 w-3.5" />
                            <span>Resume</span>
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
