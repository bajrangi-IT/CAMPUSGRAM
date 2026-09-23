import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Profile } from '@/types/database.types';
import {
  AdvertiserAccount,
  AdvertiserVerificationStatus,
  Campaign,
  CampaignStatus,
  CampaignObjective,
  PricingModel,
  TargetingCriteria,
  AdvertisementCreative,
  AdFormat,
  AdCtaType,
  DealDetails,
  DealClaim,
  CampaignAnalytics,
} from '@/types/business.types';

// ==============================================================================
// Local store for dev mode / offline fallback with localStorage sync
// ==============================================================================
const SEED_BUSINESS_ADVERTISER: AdvertiserAccount = {
  id: 'adv-tech-partner-01',
  user_id: 'usr-business-partner-01',
  business_name: 'Campus Tech Partner',
  company_name: 'TechCampus Solutions',
  logo_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&auto=format&fit=crop&q=80',
  description: 'Premier campus technology, certification programs, and engineering student opportunities partner.',
  category: 'Tech & Gadgets',
  website: 'https://campusgram.edu/partner/tech',
  phone: '+91 98989 89898',
  email: 'business@campusgram.com',
  college_id: 'col-iitb',
  balance: 15000,
  verification_status: 'verified',
  created_at: '2024-01-01T00:00:00.000Z',
};

function getStoredAdvertisers(): AdvertiserAccount[] {
  try {
    const raw = localStorage.getItem('campusgram_advertisers');
    return raw ? JSON.parse(raw) : [SEED_BUSINESS_ADVERTISER];
  } catch {
    return [SEED_BUSINESS_ADVERTISER];
  }
}

let devAdvertisers: AdvertiserAccount[] = getStoredAdvertisers();
let devCampaigns: Campaign[] = [];
let devCreatives: AdvertisementCreative[] = [];
let devClaims: DealClaim[] = [];
let devImpressionsCount: Record<string, number> = {};
let devClicksCount: Record<string, number> = {};
let devConversionsCount: Record<string, number> = {};

// Session seen set for anti-spam duplicate suppression
const sessionSeenAdIds = new Set<string>();

// Configurable pricing rates (NOT hardcoded in components)
export interface PricingRates {
  cpmRate: number;               // Cost per 1,000 impressions in INR
  cpcRate: number;               // Cost per click in INR
  cpaRate: number;               // Cost per claim/action in INR
  sponsoredPlacementWeekly: number; // Flat fee per week
}

const DEFAULT_PRICING_RATES: PricingRates = {
  cpmRate: 250.0,
  cpcRate: 15.0,
  cpaRate: 60.0,
  sponsoredPlacementWeekly: 2500.0,
};

class AdvertisingService {
  /**
   * Configurable pricing rates engine
   */
  getPricingRates(): PricingRates {
    return DEFAULT_PRICING_RATES;
  }

  // ============================================================================
  // 1. ADVERTISER ACCOUNTS & ONBOARDING
  // ============================================================================

  async getAdvertiserAccount(userId: string): Promise<AdvertiserAccount | null> {
    if (!isSupabaseConfigured) {
      return devAdvertisers.find((a) => a.user_id === userId) || null;
    }

    try {
      const { data, error } = await supabase
        .from('advertiser_accounts')
        .select('*, college:colleges(*)')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return null;

      return {
        id: data.id,
        user_id: data.user_id,
        business_name: data.business_name || data.company_name,
        company_name: data.company_name,
        logo_url: data.logo_url,
        description: data.description,
        category: data.category || 'Local Business',
        website: data.website,
        phone: data.phone,
        email: data.email,
        college_id: data.college_id,
        college: data.college,
        balance: Number(data.balance || 0),
        verification_status: (data.verification_status || 'pending') as AdvertiserVerificationStatus,
        created_at: data.created_at,
      };
    } catch (err) {
      console.warn('Error fetching advertiser account:', err);
      return null;
    }
  }

  async registerAdvertiser(params: {
    userId: string;
    businessName: string;
    category: string;
    description: string;
    logoUrl?: string;
    website?: string;
    phone?: string;
    email?: string;
    collegeId?: string;
  }): Promise<AdvertiserAccount> {
    const newAccount: AdvertiserAccount = {
      id: `adv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user_id: params.userId,
      business_name: params.businessName,
      company_name: params.businessName,
      logo_url: params.logoUrl || null,
      description: params.description,
      category: params.category,
      website: params.website || null,
      phone: params.phone || null,
      email: params.email || null,
      college_id: params.collegeId || null,
      balance: 1000.0, // Starter credit for test campaigns
      verification_status: 'pending', // Requires admin review
      created_at: new Date().toISOString(),
    };

    if (!isSupabaseConfigured) {
      devAdvertisers.push(newAccount);
      try {
        localStorage.setItem('campusgram_advertisers', JSON.stringify(devAdvertisers));
      } catch {}
      return newAccount;
    }

    try {
      const { data, error } = await supabase
        .from('advertiser_accounts')
        .insert({
          user_id: params.userId,
          company_name: params.businessName,
          business_name: params.businessName,
          logo_url: params.logoUrl || null,
          description: params.description,
          category: params.category,
          website: params.website || null,
          phone: params.phone || null,
          email: params.email || null,
          college_id: params.collegeId || null,
          balance: 1000.0,
          status: 'active',
          verification_status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return {
        ...newAccount,
        id: data.id,
      };
    } catch (err: any) {
      console.warn('DB insert failed, using fallback:', err);
      devAdvertisers.push(newAccount);
      return newAccount;
    }
  }

  async updateAdvertiserProfile(
    advertiserId: string,
    updates: Partial<AdvertiserAccount>
  ): Promise<boolean> {
    if (!isSupabaseConfigured) {
      const idx = devAdvertisers.findIndex((a) => a.id === advertiserId);
      if (idx !== -1) {
        devAdvertisers[idx] = { ...devAdvertisers[idx], ...updates };
        return true;
      }
      return false;
    }

    try {
      const { error } = await supabase
        .from('advertiser_accounts')
        .update({
          business_name: updates.business_name,
          company_name: updates.business_name,
          logo_url: updates.logo_url,
          description: updates.description,
          category: updates.category,
          website: updates.website,
          phone: updates.phone,
          email: updates.email,
        })
        .eq('id', advertiserId);

      return !error;
    } catch {
      return false;
    }
  }

  // ============================================================================
  // 2. CAMPAIGN MANAGEMENT (CRUD & STATUS)
  // ============================================================================

  async getCampaigns(advertiserId: string, statusFilter?: CampaignStatus): Promise<Campaign[]> {
    if (!isSupabaseConfigured) {
      let filtered = devCampaigns.filter((c) => c.advertiser_id === advertiserId);
      if (statusFilter) filtered = filtered.filter((c) => c.status === statusFilter);
      return filtered.map((c) => {
        const creatives = devCreatives.filter((cr) => cr.campaign_id === c.id);
        const imps = devImpressionsCount[c.id] || 0;
        const clks = devClicksCount[c.id] || 0;
        return {
          ...c,
          creatives,
          impressions_count: imps,
          clicks_count: clks,
          ctr: imps > 0 ? Number(((clks / imps) * 100).toFixed(2)) : 0,
        };
      });
    }

    try {
      let query = supabase
        .from('campaigns')
        .select(`
          *,
          advertisements(*)
        `)
        .eq('advertiser_id', advertiserId)
        .order('created_at', { ascending: false });

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((row: any) => ({
        id: row.id,
        advertiser_id: row.advertiser_id,
        title: row.title,
        objective: (row.objective || 'reach') as CampaignObjective,
        pricing_model: (row.pricing_model || 'cpm') as PricingModel,
        bid_amount: Number(row.bid_amount || 5.0),
        budget: Number(row.budget || row.total_budget || 100.0),
        total_budget: Number(row.total_budget || row.budget || 100.0),
        spent_amount: Number(row.spent_amount || 0.0),
        status: (row.status || 'draft') as CampaignStatus,
        start_date: row.start_date,
        end_date: row.end_date,
        targeting_criteria: (row.targeting_criteria || {}) as TargetingCriteria,
        review_notes: row.review_notes,
        created_at: row.created_at,
        creatives: (row.advertisements || []).map((ad: any) => ({
          id: ad.id,
          campaign_id: ad.campaign_id,
          title: ad.title,
          headline: ad.headline || ad.title,
          description: ad.description,
          format: (ad.format || 'sponsored_post') as AdFormat,
          image_url: ad.image_url,
          media_urls: ad.media_urls || [ad.image_url],
          cta_type: (ad.cta_type || 'learn_more') as AdCtaType,
          target_url: ad.target_url,
          destination_url: ad.destination_url || ad.target_url,
          placement: ad.placement || 'feed',
          deal_details: ad.deal_details,
          event_id: ad.event_id,
          opportunity_id: ad.opportunity_id,
          status: ad.status || 'active',
          created_at: ad.created_at,
        })),
        impressions_count: devImpressionsCount[row.id] || 0,
        clicks_count: devClicksCount[row.id] || 0,
        ctr: 0,
      }));
    } catch (err) {
      console.warn('Error fetching campaigns, using fallback:', err);
      return devCampaigns.filter((c) => c.advertiser_id === advertiserId);
    }
  }

  async createCampaign(params: {
    advertiserId: string;
    title: string;
    objective: CampaignObjective;
    pricingModel: PricingModel;
    bidAmount: number;
    totalBudget: number;
    startDate: string;
    endDate: string;
    targetingCriteria: TargetingCriteria;
    creative: {
      headline: string;
      description: string;
      format: AdFormat;
      imageUrl: string;
      ctaType: AdCtaType;
      destinationUrl: string;
      dealDetails?: DealDetails;
      eventId?: string;
      opportunityId?: string;
    };
  }): Promise<{ campaign: Campaign; creative: AdvertisementCreative }> {
    const campaignId = `camp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const creativeId = `ad_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newCreative: AdvertisementCreative = {
      id: creativeId,
      campaign_id: campaignId,
      title: params.creative.headline,
      headline: params.creative.headline,
      description: params.creative.description,
      format: params.creative.format,
      image_url: params.creative.imageUrl,
      media_urls: [params.creative.imageUrl],
      cta_type: params.creative.ctaType,
      target_url: params.creative.destinationUrl,
      destination_url: params.creative.destinationUrl,
      placement: params.creative.format === 'sponsored_story' ? 'stories' : 'feed',
      deal_details: params.creative.dealDetails,
      event_id: params.creative.eventId,
      opportunity_id: params.creative.opportunityId,
      status: 'active',
      created_at: new Date().toISOString(),
    };

    const newCampaign: Campaign = {
      id: campaignId,
      advertiser_id: params.advertiserId,
      title: params.title,
      objective: params.objective,
      pricing_model: params.pricingModel,
      bid_amount: params.bidAmount,
      budget: params.totalBudget,
      total_budget: params.totalBudget,
      spent_amount: 0.0,
      status: 'pending_review', // Campaigns submit for admin moderation before going live
      start_date: params.startDate,
      end_date: params.endDate,
      targeting_criteria: params.targetingCriteria,
      created_at: new Date().toISOString(),
      creatives: [newCreative],
    };

    if (!isSupabaseConfigured) {
      devCampaigns.unshift(newCampaign);
      devCreatives.unshift(newCreative);
      return { campaign: newCampaign, creative: newCreative };
    }

    try {
      // 1. Insert Campaign
      const { data: campData, error: campError } = await supabase
        .from('campaigns')
        .insert({
          advertiser_id: params.advertiserId,
          title: params.title,
          objective: params.objective,
          pricing_model: params.pricingModel,
          bid_amount: params.bidAmount,
          budget: params.totalBudget,
          total_budget: params.totalBudget,
          spent_amount: 0.0,
          status: 'pending_review',
          start_date: params.startDate,
          end_date: params.endDate,
          targeting_criteria: params.targetingCriteria,
        })
        .select()
        .single();

      if (campError) throw campError;

      // 2. Insert Creative
      const { data: creativeData, error: creativeError } = await supabase
        .from('advertisements')
        .insert({
          campaign_id: campData.id,
          title: params.creative.headline,
          headline: params.creative.headline,
          description: params.creative.description,
          format: params.creative.format,
          image_url: params.creative.imageUrl,
          media_urls: [params.creative.imageUrl],
          cta_type: params.creative.ctaType,
          target_url: params.creative.destinationUrl,
          destination_url: params.creative.destinationUrl,
          placement: params.creative.format === 'sponsored_story' ? 'stories' : 'feed',
          deal_details: params.creative.dealDetails || {},
          event_id: params.creative.eventId || null,
          opportunity_id: params.creative.opportunityId || null,
          status: 'active',
        })
        .select()
        .single();

      if (creativeError) throw creativeError;

      return {
        campaign: { ...newCampaign, id: campData.id },
        creative: { ...newCreative, id: creativeData.id, campaign_id: campData.id },
      };
    } catch (err) {
      console.warn('DB creation failed, saving to local dev memory:', err);
      devCampaigns.unshift(newCampaign);
      devCreatives.unshift(newCreative);
      return { campaign: newCampaign, creative: newCreative };
    }
  }

  async updateCampaignStatus(campaignId: string, status: CampaignStatus): Promise<boolean> {
    const idx = devCampaigns.findIndex((c) => c.id === campaignId);
    if (idx !== -1) {
      devCampaigns[idx].status = status;
    }

    if (!isSupabaseConfigured) return true;

    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ status })
        .eq('id', campaignId);
      return !error;
    } catch {
      return false;
    }
  }

  // ============================================================================
  // 3. TARGETING & FREQUENCY CONTROLLED AD DELIVERY (FOR STUDENTS)
  // ============================================================================

  /**
   * CRITICAL PRIVACY & RELEVANCE ENGINE
   * Matches candidate campaigns against student audience criteria without
   * ever exposing private student data (phone, email, DMs) to advertisers.
   * Regulates delivery with session frequency capping.
   */
  async getNativeFeedAd(studentProfile?: Profile | null, collegeId?: string | null): Promise<{
    advertisement: AdvertisementCreative;
    campaign: Campaign;
    advertiser: AdvertiserAccount;
  } | null> {
    // 1. Gather all active campaigns
    let candidateCampaigns: Campaign[] = [];

    if (!isSupabaseConfigured) {
      candidateCampaigns = devCampaigns.filter((c) => c.status === 'active');
    } else {
      try {
        const nowIso = new Date().toISOString();
        const { data } = await supabase
          .from('campaigns')
          .select(`
            *,
            advertiser:advertiser_accounts(*),
            advertisements(*)
          `)
          .eq('status', 'active')
          .lte('start_date', nowIso)
          .gte('end_date', nowIso);

        if (data) {
          candidateCampaigns = data.map((c: any) => ({
            ...c,
            creatives: c.advertisements || [],
          }));
        }
      } catch {
        candidateCampaigns = devCampaigns.filter((c) => c.status === 'active');
      }
    }

    if (candidateCampaigns.length === 0) return null;

    // 2. Perform internal targeting match (without leaking student PII)
    const matched = candidateCampaigns.filter((camp) => {
      const criteria = camp.targeting_criteria || {};

      // Match College if specified
      if (criteria.colleges && criteria.colleges.length > 0 && collegeId) {
        if (!criteria.colleges.includes(collegeId)) return false;
      }

      // Match Branch if specified
      if (criteria.branches && criteria.branches.length > 0 && studentProfile?.branch) {
        const matchesBranch = criteria.branches.some(
          (b) => b.toLowerCase() === studentProfile.branch?.toLowerCase()
        );
        if (!matchesBranch) return false;
      }

      // Match Year if specified
      if (criteria.years && criteria.years.length > 0 && studentProfile?.year) {
        if (!criteria.years.includes(studentProfile.year)) return false;
      }

      // Match Course if specified
      if (criteria.courses && criteria.courses.length > 0 && studentProfile?.course) {
        const matchesCourse = criteria.courses.some(
          (cr) => cr.toLowerCase() === studentProfile.course?.toLowerCase()
        );
        if (!matchesCourse) return false;
      }

      return true;
    });

    if (matched.length === 0) return null;

    // 3. Duplicate suppression / session frequency control
    // Pick first matched campaign whose creative hasn't been shown excessively this session
    for (const camp of matched) {
      const feedCreatives = (camp.creatives || []).filter(
        (cr) => cr.format === 'sponsored_post' || cr.format === 'campus_deal' || cr.format === 'recruitment'
      );
      if (feedCreatives.length > 0) {
        const candidateCreative = feedCreatives[0];
        if (!sessionSeenAdIds.has(candidateCreative.id)) {
          sessionSeenAdIds.add(candidateCreative.id);

          const advertiser: AdvertiserAccount = camp.advertiser || {
            id: camp.advertiser_id,
            user_id: '',
            business_name: 'Verified Campus Sponsor',
            category: 'Campus Partner',
            balance: 0,
            verification_status: 'verified',
            created_at: new Date().toISOString(),
          };

          return {
            advertisement: candidateCreative,
            campaign: camp,
            advertiser,
          };
        }
      }
    }

    return null;
  }

  /**
   * Retrieves active campus deals for the dedicated /campus/deals page
   */
  async getCampusDeals(collegeId?: string | null): Promise<{
    advertisement: AdvertisementCreative;
    campaign: Campaign;
    advertiser: AdvertiserAccount;
  }[]> {
    const deals: { advertisement: AdvertisementCreative; campaign: Campaign; advertiser: AdvertiserAccount }[] = [];

    const activeList = devCampaigns.filter((c) => c.status === 'active');
    for (const camp of activeList) {
      const dealCreatives = (camp.creatives || []).filter((cr) => cr.format === 'campus_deal');
      const adv = devAdvertisers.find((a) => a.id === camp.advertiser_id) || {
        id: camp.advertiser_id,
        user_id: '',
        business_name: 'Campus Partner',
        category: 'Student Discounts',
        balance: 0,
        verification_status: 'verified' as const,
        created_at: new Date().toISOString(),
      };
      dealCreatives.forEach((cr) => {
        deals.push({
          advertisement: cr,
          campaign: camp,
          advertiser: adv,
        });
      });
    }

    return deals;
  }

  /**
   * Claims a deal / coupon voucher (100% Free for students)
   */
  async claimCampusDeal(advertisementId: string, studentId: string): Promise<{
    claimCode: string;
    message: string;
  }> {
    const claimCode = `CAMPUS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const newClaim: DealClaim = {
      id: `claim_${Date.now()}`,
      advertisement_id: advertisementId,
      user_id: studentId,
      claimed_at: new Date().toISOString(),
      claim_code: claimCode,
      is_redeemed: false,
    };

    devClaims.push(newClaim);

    // Record anonymous conversion for campaign analytics
    devConversionsCount[advertisementId] = (devConversionsCount[advertisementId] || 0) + 1;

    if (isSupabaseConfigured) {
      try {
        await supabase.from('deal_claims').insert({
          advertisement_id: advertisementId,
          user_id: studentId,
          claim_code: claimCode,
        });

        await supabase.from('ad_conversions').insert({
          ad_id: advertisementId,
          conversion_type: 'claim',
        });
      } catch (err) {
        console.warn('DB claim insert error:', err);
      }
    }

    return {
      claimCode,
      message: 'Offer claimed successfully! Present this code at the store or enter during checkout.',
    };
  }

  // ============================================================================
  // 4. ANONYMOUS TRACKING & CAMPAIGN ANALYTICS
  // ============================================================================

  recordAdImpression(campaignId: string, adId: string, collegeId?: string | null): void {
    devImpressionsCount[campaignId] = (devImpressionsCount[campaignId] || 0) + 1;
    if (isSupabaseConfigured) {
      supabase.from('ad_impressions').insert({
        ad_id: adId,
        college_id: collegeId || null,
      }).then(() => {});
    }
  }

  recordAdClick(campaignId: string, adId: string, collegeId?: string | null): void {
    devClicksCount[campaignId] = (devClicksCount[campaignId] || 0) + 1;
    if (isSupabaseConfigured) {
      supabase.from('ad_clicks').insert({
        ad_id: adId,
      }).then(() => {});
    }
  }

  async getCampaignAnalytics(campaignId: string): Promise<CampaignAnalytics> {
    const impressions = devImpressionsCount[campaignId] || 0;
    const clicks = devClicksCount[campaignId] || 0;
    const conversions = devConversionsCount[campaignId] || 0;
    const ctr = impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0;
    const spent = Number((clicks * 15.0 + (impressions / 1000) * 250.0).toFixed(2));

    return {
      campaign_id: campaignId,
      impressions,
      clicks,
      ctr,
      conversions,
      spent,
      daily_stats: [
        {
          date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          impressions,
          clicks,
          spend: spent,
        },
      ],
    };
  }

  // ============================================================================
  // 5. ADMIN MODERATION INTERFACE
  // ============================================================================

  async getAllAdvertisers(): Promise<AdvertiserAccount[]> {
    if (!isSupabaseConfigured) return devAdvertisers;

    try {
      const { data, error } = await supabase
        .from('advertiser_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        business_name: row.business_name || row.company_name,
        company_name: row.company_name,
        logo_url: row.logo_url,
        description: row.description,
        category: row.category || 'Local Business',
        website: row.website,
        phone: row.phone,
        email: row.email,
        college_id: row.college_id,
        balance: Number(row.balance || 0),
        verification_status: (row.verification_status || 'pending') as AdvertiserVerificationStatus,
        created_at: row.created_at,
      }));
    } catch {
      return devAdvertisers;
    }
  }

  async verifyAdvertiser(advertiserId: string, status: AdvertiserVerificationStatus): Promise<boolean> {
    const idx = devAdvertisers.findIndex((a) => a.id === advertiserId);
    if (idx !== -1) {
      devAdvertisers[idx].verification_status = status;
    }

    if (!isSupabaseConfigured) return true;

    try {
      const { error } = await supabase
        .from('advertiser_accounts')
        .update({ verification_status: status })
        .eq('id', advertiserId);
      return !error;
    } catch {
      return false;
    }
  }

  async getAllCampaignsForModeration(): Promise<Campaign[]> {
    if (!isSupabaseConfigured) return devCampaigns;

    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          advertiser:advertiser_accounts(*),
          advertisements(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((row: any) => ({
        id: row.id,
        advertiser_id: row.advertiser_id,
        advertiser: row.advertiser
          ? {
              id: row.advertiser.id,
              user_id: row.advertiser.user_id,
              business_name: row.advertiser.business_name || row.advertiser.company_name,
              category: row.advertiser.category,
              balance: Number(row.advertiser.balance || 0),
              verification_status: row.advertiser.verification_status,
              created_at: row.advertiser.created_at,
            }
          : undefined,
        title: row.title,
        objective: (row.objective || 'reach') as CampaignObjective,
        pricing_model: (row.pricing_model || 'cpm') as PricingModel,
        bid_amount: Number(row.bid_amount || 5.0),
        budget: Number(row.budget || 100.0),
        total_budget: Number(row.total_budget || 100.0),
        spent_amount: Number(row.spent_amount || 0.0),
        status: (row.status || 'draft') as CampaignStatus,
        start_date: row.start_date,
        end_date: row.end_date,
        targeting_criteria: (row.targeting_criteria || {}) as TargetingCriteria,
        review_notes: row.review_notes,
        created_at: row.created_at,
        creatives: (row.advertisements || []).map((ad: any) => ({
          id: ad.id,
          campaign_id: ad.campaign_id,
          title: ad.title,
          headline: ad.headline || ad.title,
          description: ad.description,
          format: (ad.format || 'sponsored_post') as AdFormat,
          image_url: ad.image_url,
          media_urls: ad.media_urls || [ad.image_url],
          cta_type: (ad.cta_type || 'learn_more') as AdCtaType,
          target_url: ad.target_url,
          destination_url: ad.destination_url || ad.target_url,
          placement: ad.placement || 'feed',
          deal_details: ad.deal_details,
          event_id: ad.event_id,
          opportunity_id: ad.opportunity_id,
          status: ad.status || 'active',
          created_at: ad.created_at,
        })),
      }));
    } catch {
      return devCampaigns;
    }
  }

  async reviewCampaign(
    campaignId: string,
    approved: boolean,
    reviewNotes?: string
  ): Promise<boolean> {
    const newStatus: CampaignStatus = approved ? 'active' : 'rejected';
    const idx = devCampaigns.findIndex((c) => c.id === campaignId);
    if (idx !== -1) {
      devCampaigns[idx].status = newStatus;
      devCampaigns[idx].review_notes = reviewNotes || null;
    }

    if (!isSupabaseConfigured) return true;

    try {
      const { error } = await supabase
        .from('campaigns')
        .update({
          status: newStatus,
          review_notes: reviewNotes || null,
        })
        .eq('id', campaignId);
      return !error;
    } catch {
      return false;
    }
  }
}

export const advertisingService = new AdvertisingService();
