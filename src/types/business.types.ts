import { Profile, College } from './database.types';

export type AdvertiserVerificationStatus = 'pending' | 'verified' | 'rejected' | 'suspended';

export interface AdvertiserAccount {
  id: string;
  user_id: string;
  business_name: string;
  company_name?: string;
  logo_url?: string | null;
  description?: string | null;
  category: string;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  college_id?: string | null;
  college?: College;
  balance: number;
  verification_status: AdvertiserVerificationStatus;
  created_at: string;
}

export type CampaignObjective =
  | 'reach'
  | 'clicks'
  | 'event_registrations'
  | 'offer_claims'
  | 'applications';

export type PricingModel = 'cpm' | 'cpc' | 'cpa' | 'sponsored_placement';

export type CampaignStatus =
  | 'draft'
  | 'pending_review'
  | 'active'
  | 'paused'
  | 'completed'
  | 'rejected';

export interface TargetingCriteria {
  colleges?: string[];      // College IDs
  courses?: string[];       // e.g. ["Computer Science", "Engineering"]
  branches?: string[];      // e.g. ["CSE", "ECE", "Mechanical"]
  years?: string[];         // e.g. ["1st Year", "2nd Year", "3rd Year", "4th Year"]
  interests?: string[];     // e.g. ["AI", "Robotics", "Web3", "Fitness"]
  skills?: string[];        // for recruitment targeting
}

export type AdFormat =
  | 'sponsored_post'
  | 'sponsored_story'
  | 'sponsored_event'
  | 'campus_deal'
  | 'recruitment';

export type AdCtaType =
  | 'claim_offer'
  | 'learn_more'
  | 'apply_now'
  | 'register'
  | 'visit_website';

export interface DealDetails {
  discount_code?: string;
  discount_percent?: number;
  valid_until?: string;
  terms?: string;
}

export interface AdvertisementCreative {
  id: string;
  campaign_id: string;
  title: string;
  headline?: string;
  description?: string;
  format: AdFormat;
  image_url: string;
  media_urls?: string[];
  cta_type: AdCtaType;
  target_url: string;
  destination_url?: string;
  placement: string;
  deal_details?: DealDetails;
  event_id?: string | null;
  opportunity_id?: string | null;
  status: 'active' | 'paused' | 'archived';
  created_at: string;
}

export interface Campaign {
  id: string;
  advertiser_id: string;
  advertiser?: AdvertiserAccount;
  title: string;
  objective: CampaignObjective;
  pricing_model: PricingModel;
  bid_amount: number;
  budget: number;
  total_budget: number;
  spent_amount: number;
  status: CampaignStatus;
  start_date: string;
  end_date: string;
  targeting_criteria: TargetingCriteria;
  review_notes?: string | null;
  created_at: string;
  // Creatives attached to this campaign
  creatives?: AdvertisementCreative[];
  // Aggregate Metrics computed for advertiser dashboard
  impressions_count?: number;
  clicks_count?: number;
  conversions_count?: number;
  ctr?: number;
}

export interface DealClaim {
  id: string;
  advertisement_id: string;
  user_id: string;
  claimed_at: string;
  claim_code?: string;
  is_redeemed: boolean;
  advertisement?: AdvertisementCreative & {
    campaign?: Campaign & { advertiser?: AdvertiserAccount };
  };
}

export interface CampaignAnalytics {
  campaign_id: string;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  spent: number;
  daily_stats: {
    date: string;
    impressions: number;
    clicks: number;
    spend: number;
  }[];
}
