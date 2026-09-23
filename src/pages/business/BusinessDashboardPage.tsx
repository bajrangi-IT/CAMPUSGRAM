import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  PlusCircle,
  TrendingUp,
  MousePointerClick,
  Eye,
  Wallet,
  CheckCircle,
  Clock,
  ArrowRight,
  Sparkles,
  BarChart3,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { advertisingService } from '@/services/advertisingService';
import { paymentService } from '@/services/paymentService';
import { AdvertiserAccount, Campaign } from '@/types/business.types';
import { toast } from 'sonner';

export const BusinessDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [account, setAccount] = useState<AdvertiserAccount | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      setIsLoading(true);
      const acc = await advertisingService.getAdvertiserAccount(user.id);
      setAccount(acc);
      if (acc) {
        const camps = await advertisingService.getCampaigns(acc.id);
        setCampaigns(camps);
      }
      setIsLoading(false);
    }
    loadData();
  }, [user]);

  const activeCount = campaigns.filter((c) => c.status === 'active').length;
  const pendingCount = campaigns.filter((c) => c.status === 'pending_review').length;
  const totalImpressions = campaigns.reduce((acc, c) => acc + (c.impressions_count || 0), 0);
  const totalClicks = campaigns.reduce((acc, c) => acc + (c.clicks_count || 0), 0);
  const totalSpend = campaigns.reduce((acc, c) => acc + (c.spent_amount || 0), 0);
  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';

  const handleDepositFunds = async () => {
    if (!account) return;
    try {
      const order = await paymentService.createDepositOrder({
        advertiserId: account.id,
        amount: 2500,
        currency: 'INR',
        description: 'Wallet top-up for campus advertising',
      });
      toast.success('Deposit order initialized', {
        description: `Order ID: ${order.orderId}. Ready for payment gateway checkout.`,
      });
    } catch {
      toast.error('Could not initiate deposit');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl pb-12">
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Advertiser Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your targeted campus campaigns, sponsored stories, and recruitment drives.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate('/business/campaigns/create')}
            className="gap-2 font-bold text-xs sm:text-sm h-10 shadow-sm rounded-xl"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create Campaign</span>
          </Button>
        </div>
      </div>

      {/* Verification Notice Banner if Pending */}
      {account && account.verification_status === 'pending' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900">
          <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-sm">Account Verification In Progress</span>
            <p className="mt-0.5 text-amber-800 leading-relaxed">
              Your business application is being reviewed by campus administration. You can create and draft campaigns right away; they will begin delivering as soon as verification completes.
            </p>
          </div>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-200/80 bg-white p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Active Campaigns</span>
            <Layers className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{activeCount}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {pendingCount} in review
          </span>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 bg-white p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Total Impressions</span>
            <Eye className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalImpressions.toLocaleString()}</div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
            Verified campus reach
          </span>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 bg-white p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Clicks & Actions</span>
            <MousePointerClick className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalClicks.toLocaleString()}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {avgCtr}% avg CTR
          </span>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 bg-white p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Wallet Balance</span>
            <Wallet className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            ₹{account ? account.balance.toLocaleString() : '0'}
          </div>
          <button
            onClick={handleDepositFunds}
            className="text-[11px] font-bold text-indigo-600 hover:underline mt-1 block"
          >
            + Add Funds
          </button>
        </Card>
      </div>

      {/* Campaigns Overview Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900">Recent Campaigns</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/business/campaigns')}
            className="text-xs font-bold rounded-xl"
          >
            View All Campaigns
          </Button>
        </div>

        {campaigns.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">No campaigns launched yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Reach student audiences by setting up your first targeted campaign today.
              </p>
            </div>
            <Button
              onClick={() => navigate('/business/campaigns/create')}
              className="font-bold text-xs rounded-xl"
            >
              Create First Campaign
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.slice(0, 5).map((camp) => (
              <Card key={camp.id} className="rounded-2xl border-slate-200/80 bg-white p-4 hover:border-indigo-200 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{camp.title}</span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        camp.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : camp.status === 'pending_review'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {camp.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Objective: <span className="font-semibold text-slate-700 capitalize">{camp.objective}</span> • Budget: ₹{camp.budget.toLocaleString()} • Pricing: {camp.pricing_model.toUpperCase()}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px]">Impressions</span>
                      <span className="font-bold text-slate-800">{camp.impressions_count || 0}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px]">Clicks</span>
                      <span className="font-bold text-slate-800">{camp.clicks_count || 0}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
