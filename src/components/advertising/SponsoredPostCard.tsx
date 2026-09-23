import React, { useEffect, useRef } from 'react';
import {
  ExternalLink,
  Sparkles,
  Info,
  Tag,
  CheckCircle,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AdvertisementCreative, Campaign, AdvertiserAccount } from '@/types/business.types';
import { advertisingService } from '@/services/advertisingService';

interface SponsoredPostCardProps {
  advertisement: AdvertisementCreative;
  campaign: Campaign;
  advertiser: AdvertiserAccount;
  studentCollegeId?: string | null;
}

export const SponsoredPostCard: React.FC<SponsoredPostCardProps> = ({
  advertisement,
  campaign,
  advertiser,
  studentCollegeId,
}) => {
  const hasLoggedImpression = useRef(false);

  useEffect(() => {
    if (!hasLoggedImpression.current) {
      advertisingService.recordAdImpression(campaign.id, advertisement.id, studentCollegeId);
      hasLoggedImpression.current = true;
    }
  }, [campaign.id, advertisement.id, studentCollegeId]);

  const handleCtaClick = () => {
    advertisingService.recordAdClick(campaign.id, advertisement.id, studentCollegeId);
    if (advertisement.destination_url || advertisement.target_url) {
      window.open(advertisement.destination_url || advertisement.target_url, '_blank', 'noopener,noreferrer');
    }
  };

  const getCtaLabel = (cta: string) => {
    switch (cta) {
      case 'claim_offer':
        return 'Claim Student Offer';
      case 'apply_now':
        return 'Apply Now';
      case 'register':
        return 'Register Free';
      case 'visit_website':
        return 'Visit Website';
      default:
        return 'Learn More';
    }
  };

  return (
    <Card className="rounded-2xl border-slate-200/90 bg-white hover:border-indigo-200 transition-all shadow-xs overflow-hidden">
      {/* Sponsored Transparency Top Bar */}
      <div className="bg-slate-50 border-b border-slate-100 px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-amber-700">
          <span className="font-extrabold text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-md bg-amber-100/70 border border-amber-200">
            Sponsored
          </span>
          <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
            Verified Partner for Campus
          </span>
        </div>

        <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
          <Info className="h-3 w-3" />
          <span>Campus Partner</span>
        </div>
      </div>

      <CardContent className="p-4 sm:p-5 space-y-3.5">
        {/* Advertiser Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10 rounded-xl border border-slate-200 bg-white">
              <AvatarImage src={advertiser.logo_url || undefined} />
              <AvatarFallback className="bg-indigo-600 text-white font-black text-xs rounded-xl">
                {advertiser.business_name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-slate-900 line-clamp-1">
                  {advertiser.business_name}
                </span>
                <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                  {advertiser.category}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Campus Exclusive Promotion</p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="space-y-1.5">
          <h4 className="font-black text-slate-900 text-base leading-snug">
            {advertisement.headline || advertisement.title}
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
            {advertisement.description}
          </p>
        </div>

        {/* Media Banner */}
        {advertisement.image_url && (
          <div className="rounded-xl overflow-hidden border border-slate-100 bg-slate-50 max-h-80 flex items-center justify-center">
            <img
              src={advertisement.image_url}
              alt={advertisement.headline || 'Sponsored promotion'}
              className="w-full h-auto object-cover max-h-80"
              loading="lazy"
            />
          </div>
        )}

        {/* Deal details preview if deal format */}
        {advertisement.deal_details?.discount_code && (
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-amber-600" />
              <div>
                <span className="font-bold text-slate-900">Student Promo Code:</span>
                <span className="font-mono font-extrabold text-indigo-700 ml-1.5 tracking-wider bg-white px-2 py-0.5 rounded border border-indigo-200">
                  {advertisement.deal_details.discount_code}
                </span>
              </div>
            </div>
            {advertisement.deal_details.discount_percent && (
              <span className="font-extrabold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full text-[11px]">
                {advertisement.deal_details.discount_percent}% OFF
              </span>
            )}
          </div>
        )}

        {/* Bottom CTA Bar */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Free for Campus Students
          </span>

          <Button
            onClick={handleCtaClick}
            className="text-xs font-bold rounded-xl h-9 px-4 gap-1.5 shadow-sm"
          >
            <span>{getCtaLabel(advertisement.cta_type)}</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
