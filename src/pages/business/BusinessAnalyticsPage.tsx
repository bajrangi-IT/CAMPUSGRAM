import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Eye,
  MousePointerClick,
  Tag,
  DollarSign,
  ShieldCheck,
  Calendar,
  Layers,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { advertisingService } from '@/services/advertisingService';
import { Campaign, CampaignAnalytics } from '@/types/business.types';

export const BusinessAnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('all');
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      setIsLoading(true);
      const acc = await advertisingService.getAdvertiserAccount(user.id);
      if (acc) {
        const camps = await advertisingService.getCampaigns(acc.id);
        setCampaigns(camps);
        if (camps.length > 0) {
          const stats = await advertisingService.getCampaignAnalytics(
            selectedCampaignId === 'all' ? camps[0].id : selectedCampaignId
          );
          setAnalytics(stats);
        }
      }
      setIsLoading(false);
    }
    loadData();
  }, [user, selectedCampaignId]);

  const totalImpressions = campaigns.reduce((acc, c) => acc + (c.impressions_count || 0), 0);
  const totalClicks = campaigns.reduce((acc, c) => acc + (c.clicks_count || 0), 0);
  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';
  const totalSpend = campaigns.reduce((acc, c) => acc + (c.spent_amount || 0), 0);

  return (
    <div className="space-y-6 max-w-6xl pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Campaign Analytics</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time aggregate performance indicators and conversion metrics across student cohorts.
          </p>
        </div>

        {campaigns.length > 0 && (
          <select
            value={selectedCampaignId}
            onChange={(e) => setSelectedCampaignId(e.target.value)}
            className="h-10 px-3 text-xs rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Campaigns Combined</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Strict Privacy Notice */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="h-5 w-5 text-indigo-400 shrink-0" />
          <span>
            <strong className="font-bold">Aggregated Anonymous Reporting:</strong> Analytics represent cohort-level impressions, clicks, and offer redemptions. Individual student IDs and personal data are strictly isolated.
          </span>
        </div>
      </div>

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-200/80 bg-white p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Total Impressions</span>
            <Eye className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {totalImpressions.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Campus wide reach</span>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 bg-white p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Verified Clicks</span>
            <MousePointerClick className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalClicks.toLocaleString()}</div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
            {avgCtr}% Click-Through Rate
          </span>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 bg-white p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Total Spend</span>
            <DollarSign className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">₹{totalSpend.toLocaleString()}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Transparent pacing</span>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 bg-white p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Conversions / Claims</span>
            <Tag className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {analytics?.conversions || 0}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Measurable student actions</span>
        </Card>
      </div>

      {/* Campaigns Pacing Breakdown Table */}
      <Card className="rounded-2xl border-slate-200/80 bg-white p-6 space-y-4">
        <h2 className="text-base font-black text-slate-900">Campaign Pacing & Delivery Performance</h2>

        {campaigns.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No campaign data to display yet. Launch a campaign to start tracking live analytics.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <th className="pb-3">Campaign</th>
                  <th className="pb-3">Objective</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Impressions</th>
                  <th className="pb-3 text-right">Clicks</th>
                  <th className="pb-3 text-right">CTR</th>
                  <th className="pb-3 text-right">Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaigns.map((c) => {
                  const ctr = c.impressions_count && c.impressions_count > 0
                    ? ((c.clicks_count || 0) / c.impressions_count * 100).toFixed(2)
                    : '0.00';
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50">
                      <td className="py-3 font-bold text-slate-900">{c.title}</td>
                      <td className="py-3 capitalize text-slate-600">{c.objective.replace('_', ' ')}</td>
                      <td className="py-3">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          c.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {c.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 text-right font-semibold text-slate-800">{c.impressions_count || 0}</td>
                      <td className="py-3 text-right font-semibold text-slate-800">{c.clicks_count || 0}</td>
                      <td className="py-3 text-right font-bold text-emerald-600">{ctr}%</td>
                      <td className="py-3 text-right font-bold text-slate-900">₹{c.spent_amount.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
