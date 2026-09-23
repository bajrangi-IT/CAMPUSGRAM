import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  PlusCircle,
  Search,
  Tag,
  MessageSquare,
  CheckCircle,
  IndianRupee,
  ShieldCheck,
  Package,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent } from '@/components/ui/Card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { campusService } from '@/services/campusService';
import type { MarketplaceListing } from '@/types/campus.types';
import { toast } from 'sonner';

const MARKETPLACE_CATEGORIES = [
  'All',
  'Textbooks & Notes',
  'Electronics & Calculators',
  'Hostel & Furniture',
  'Bicycles & Mobility',
  'Lab Equipment & Tools',
  'Stationery & Supplies',
];

export const MarketplacePage: React.FC = () => {
  const { user, college } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Create Listing Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Textbooks & Notes');
  const [condition, setCondition] = useState('Like New');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadListings = async () => {
    setIsLoading(true);
    try {
      const data = await campusService.getMarketplaceListings(
        selectedCategory === 'All' ? undefined : selectedCategory
      );
      setListings(data);
    } catch (err: any) {
      toast.error('Failed to load marketplace listings', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, [selectedCategory]);

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !college) return;
    if (!title.trim() || !price || !description.trim()) {
      toast.error('Please specify title, price, and description');
      return;
    }

    setIsSubmitting(true);
    try {
      await campusService.createMarketplaceListing({
        college_id: college.id,
        seller_id: user.id,
        title: title.trim(),
        price: parseFloat(price),
        category,
        condition,
        description: description.trim(),
        image_url: imageUrl.trim() || undefined,
      });

      toast.success('Item listed on campus marketplace!');
      setIsCreateOpen(false);
      setTitle('');
      setPrice('');
      setImageUrl('');
      setDescription('');
      loadListings();
    } catch (err: any) {
      toast.error(err.message || 'Failed to list item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleSold = async (listing: MarketplaceListing) => {
    const isCurrentlySold = listing.status === 'sold' || listing.is_sold;
    const newStatus: 'active' | 'sold' = isCurrentlySold ? 'active' : 'sold';
    try {
      await campusService.updateMarketplaceListingStatus(listing.id, newStatus);
      setListings((prev) =>
        prev.map((item) =>
          item.id === listing.id
            ? { ...item, status: newStatus, is_sold: newStatus === 'sold' }
            : item
        )
      );
      toast.success(newStatus === 'sold' ? 'Listing marked as sold' : 'Listing relisted as active');
    } catch (err: any) {
      toast.error(err.message || 'Update failed');
    }
  };

  const handleContactSeller = (listing: MarketplaceListing) => {
    if (!user) {
      toast.error('Please sign in to contact sellers');
      return;
    }
    toast.success(`Opening conversation with seller about "${listing.title}"...`);
    navigate('/messages');
  };

  const filteredListings = listings.filter(
    (l) =>
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.description.toLowerCase().includes(search.toLowerCase()) ||
      l.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-emerald-600 font-bold text-xs uppercase tracking-wider mb-1">
            <ShoppingBag className="h-4 w-4" />
            <span>Campus Classifieds</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Campus Marketplace</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Buy and sell course textbooks, drafters, calculators, cycles, and dorm essentials with verified students.
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="gap-2 font-bold text-xs sm:text-sm h-10 shrink-0 shadow-sm rounded-xl"
        >
          <PlusCircle className="h-4 w-4" />
          <span>List an Item</span>
        </Button>
      </div>

      {/* Category Pills & Search */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Input
            type="search"
            placeholder="Search textbooks, scientific calculators, cycles, mattress..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4 text-slate-400" />}
            className="bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {MARKETPLACE_CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  active
                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-200'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Listing Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-white border border-slate-100 p-4 animate-pulse space-y-3">
              <div className="h-32 bg-slate-200 rounded-xl" />
              <div className="h-4 w-1/2 bg-slate-200 rounded" />
              <div className="h-4 w-3/4 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : filteredListings.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No campus items currently listed"
          description="Have textbooks, drafters, or hostel gear you no longer need? List them here for junior students."
          action={
            <Button onClick={() => setIsCreateOpen(true)} className="gap-2 font-bold text-xs rounded-xl">
              <PlusCircle className="h-4 w-4" />
              <span>List First Item</span>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredListings.map((listing) => {
            const isOwner = user?.id === listing.seller_id;
            const isSold = listing.status === 'sold';

            return (
              <Card
                key={listing.id}
                className={`overflow-hidden rounded-2xl border transition-all flex flex-col justify-between ${
                  isSold
                    ? 'opacity-60 bg-slate-50 border-slate-200'
                    : 'bg-white border-slate-200/80 hover:border-emerald-300 hover:shadow-md'
                }`}
              >
                <div>
                  {/* Photo or Clean Placeholder */}
                  <div className="h-36 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                    {listing.image_url || listing.images?.[0] ? (
                      <img
                        src={listing.image_url || listing.images[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <Package className="h-10 w-10 stroke-1 mb-1" />
                        <span className="text-[11px] font-semibold">Campus Marketplace</span>
                      </div>
                    )}

                    <div className="absolute top-2 left-2 flex gap-1">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/95 text-slate-800 shadow-sm border border-slate-200">
                        {listing.condition}
                      </span>
                    </div>

                    {isSold && (
                      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="font-black text-white text-xs tracking-wider uppercase px-3 py-1 bg-rose-600 rounded-full">
                          Sold Out
                        </span>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-3.5 space-y-2">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
                        {listing.category}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm line-clamp-1 mt-0.5">{listing.title}</h3>
                    </div>

                    <div className="text-base font-extrabold text-slate-900">
                      ₹{listing.price.toLocaleString()}
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {listing.description}
                    </p>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={listing.seller?.profile_photo || (listing.seller as any)?.avatar_url} />
                          <AvatarFallback className="text-[8px] bg-slate-200">
                            {listing.seller?.full_name?.substring(0, 1) || 'S'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[11px] font-semibold text-slate-700 truncate max-w-[100px]">
                          {listing.seller?.full_name || 'Student Seller'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </div>

                <div className="p-3 pt-0 border-t border-slate-50 space-y-1.5">
                  {isOwner ? (
                    <Button
                      variant={isSold ? 'outline' : 'secondary'}
                      onClick={() => handleToggleSold(listing)}
                      className="w-full text-xs font-bold rounded-xl h-8"
                    >
                      {isSold ? 'Relist Item' : 'Mark as Sold'}
                    </Button>
                  ) : (
                    <Button
                      disabled={isSold}
                      onClick={() => handleContactSeller(listing)}
                      className="w-full text-xs font-bold rounded-xl h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Contact Seller</span>
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* List an Item Modal */}
      <Modal open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <ModalContent className="max-w-md">
          <ModalHeader>
            <ModalTitle>List an Item for Sale</ModalTitle>
            <ModalDescription>
              Sell textbooks, course material, cycles, or dorm essentials to verified peers.
            </ModalDescription>
          </ModalHeader>

          <form onSubmit={handleCreateListing} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Item Title</label>
              <Input
                placeholder="e.g. Engineering Graphics Drafter & Mini-Board"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Asking Price (₹)</label>
                <Input
                  type="number"
                  placeholder="e.g. 450"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="New">Brand New</option>
                  <option value="Like New">Like New (Mint)</option>
                  <option value="Good">Good Condition</option>
                  <option value="Fair">Fair / Usable</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {MARKETPLACE_CATEGORIES.filter((c) => c !== 'All').map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Image URL (Optional)</label>
              <Input
                placeholder="https://..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Item Description</label>
              <Textarea
                placeholder="Edition number, wear and tear details, accessories included, pickup spot..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                required
              />
            </div>

            <ModalFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="font-bold">
                {isSubmitting ? 'Listing...' : 'List Item Now'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
};
