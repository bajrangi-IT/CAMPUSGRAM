import React, { useState, useEffect } from 'react';
import {
  Tag,
  Search,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Copy,
  Percent,
  Clock,
  ShieldCheck,
  ShoppingBag,
  Gift,
  Building,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { advertisingService } from '@/services/advertisingService';
import { AdvertisementCreative, Campaign, AdvertiserAccount } from '@/types/business.types';
import { toast } from 'sonner';

interface DealItemWithMeta {
  advertisement: AdvertisementCreative;
  campaign: Campaign;
  advertiser: AdvertiserAccount;
}

export const CampusDealsPage: React.FC = () => {
  const { user, college } = useAuth();
  const [deals, setDeals] = useState<DealItemWithMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Claim voucher modal
  const [claimedDeal, setClaimedDeal] = useState<{
    deal: DealItemWithMeta;
    claimCode: string;
  } | null>(null);

  const loadDeals = async () => {
    setIsLoading(true);
    try {
      const data = await advertisingService.getCampusDeals(college?.id);
      setDeals(data);
    } catch {
      toast.error('Failed to load campus deals');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDeals();
  }, [college?.id]);

  const handleClaim = async (deal: DealItemWithMeta) => {
    if (!user) {
      toast.error('Please sign in to claim student deals');
      return;
    }

    try {
      const res = await advertisingService.claimCampusDeal(deal.advertisement.id, user.id);
      setClaimedDeal({ deal, claimCode: res.claimCode });
      toast.success(res.message);
    } catch {
      toast.error('Could not claim offer');
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Promo code copied to clipboard!');
  };

  const filteredDeals = deals.filter(
    (d) =>
      d.advertisement.headline?.toLowerCase().includes(search.toLowerCase()) ||
      d.advertisement.description?.toLowerCase().includes(search.toLowerCase()) ||
      d.advertiser.business_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-rose-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Gift className="h-4 w-4" />
            <span>Student Benefits & Savings</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Campus Deals</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Verified student discounts, food coupons, and exclusive brand perks at {college?.name || 'campus'}. Always 100% free for students.
          </p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-1.5 shrink-0">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Free Student Access</span>
        </div>
      </div>

      {/* Search */}
      <div className="w-full sm:w-80">
        <Input
          type="search"
          placeholder="Search discounts, cafes, apparel..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="h-4 w-4 text-slate-400" />}
          className="bg-white"
        />
      </div>

      {/* Deals Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 rounded-2xl bg-white border border-slate-100 p-5 animate-pulse space-y-4">
              <div className="h-28 bg-slate-200 rounded-xl" />
              <div className="h-4 w-2/3 bg-slate-200 rounded" />
              <div className="h-4 w-1/3 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : filteredDeals.length === 0 ? (
        <EmptyState
          icon={Gift}
          title="No campus deals active right now"
          description="Local cafes, tech brands, and bookstores publish new student discounts regularly. Check back soon!"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDeals.map((item) => {
            const { advertisement, advertiser } = item;
            const discountPercent = advertisement.deal_details?.discount_percent || 20;

            return (
              <Card
                key={advertisement.id}
                className="rounded-2xl border-slate-200/80 bg-white hover:border-rose-300 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                <div>
                  <div className="h-36 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                    {advertisement.image_url ? (
                      <img
                        src={advertisement.image_url}
                        alt={advertisement.headline || 'Deal'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ShoppingBag className="h-10 w-10 text-slate-300" />
                    )}

                    <div className="absolute top-2 right-2">
                      <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-600 text-white shadow-md">
                        {discountPercent}% OFF
                      </span>
                    </div>

                    <div className="absolute bottom-2 left-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/95 text-slate-800 shadow-sm border border-slate-200">
                        {advertiser.business_name}
                      </span>
                    </div>
                  </div>

                  <CardContent className="p-4 space-y-2">
                    <h3 className="font-bold text-slate-900 text-sm line-clamp-1">
                      {advertisement.headline || advertisement.title}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {advertisement.description}
                    </p>

                    {advertisement.deal_details?.discount_code && (
                      <div className="pt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          Promo Code
                        </span>
                        <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 inline-block">
                          {advertisement.deal_details.discount_code}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </div>

                <div className="p-4 pt-0 border-t border-slate-100 flex items-center gap-2">
                  <Button
                    onClick={() => handleClaim(item)}
                    className="flex-1 text-xs font-bold rounded-xl h-9 bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    <span>Claim Discount</span>
                  </Button>

                  {advertisement.destination_url && (
                    <Button
                      variant="outline"
                      onClick={() => window.open(advertisement.destination_url, '_blank')}
                      className="text-xs font-bold rounded-xl h-9 px-3 border-slate-200"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-slate-600" />
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Claim Voucher Modal */}
      <Modal open={!!claimedDeal} onOpenChange={(open) => !open && setClaimedDeal(null)}>
        {claimedDeal && (
          <ModalContent className="max-w-sm text-center">
            <ModalHeader>
              <ModalTitle className="text-center">Offer Claimed Successfully!</ModalTitle>
              <ModalDescription className="text-center">
                Present this student voucher code at {claimedDeal.deal.advertiser.business_name} to redeem your savings.
              </ModalDescription>
            </ModalHeader>

            <div className="py-4 space-y-4">
              <div className="p-4 bg-rose-50 border-2 border-dashed border-rose-200 rounded-2xl">
                <span className="text-[11px] font-bold text-rose-700 uppercase tracking-widest block mb-1">
                  Your Student Voucher Code
                </span>
                <span className="font-mono font-black text-2xl text-slate-900 tracking-widest block select-all">
                  {claimedDeal.claimCode}
                </span>
              </div>

              <Button
                variant="outline"
                onClick={() => handleCopyCode(claimedDeal.claimCode)}
                className="w-full gap-2 text-xs font-bold rounded-xl"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Voucher Code</span>
              </Button>

              <p className="text-[11px] text-slate-500">
                100% Free for verified campus students. Valid through campaign expiration date.
              </p>
            </div>

            <ModalFooter className="sm:justify-center">
              <Button
                onClick={() => setClaimedDeal(null)}
                className="w-full text-xs font-bold rounded-xl"
              >
                Done
              </Button>
            </ModalFooter>
          </ModalContent>
        )}
      </Modal>
    </div>
  );
};
