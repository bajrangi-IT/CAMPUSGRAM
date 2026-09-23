import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Sparkles,
  RefreshCw,
  PlusCircle,
  TrendingUp,
  Filter,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Post, FeedCategory } from '@/types/social.types';
import { fetchFeedPosts } from '@/services/postsService';
import { getFollowing } from '@/services/followService';
import { StoriesBar } from '@/components/social/StoriesBar';
import { PostComposer } from '@/components/social/PostComposer';
import { PostCard } from '@/components/social/PostCard';
import { SponsoredPostCard } from '@/components/advertising/SponsoredPostCard';
import { advertisingService } from '@/services/advertisingService';
import { AdvertisementCreative, Campaign, AdvertiserAccount } from '@/types/business.types';
import { toast } from 'sonner';

export const HomePage: React.FC = () => {
  const { user, profile, college } = useAuth();
  const [activeCategory, setActiveCategory] = useState<FeedCategory>('for-you');
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [sponsoredAd, setSponsoredAd] = useState<{
    advertisement: AdvertisementCreative;
    campaign: Campaign;
    advertiser: AdvertiserAccount;
  } | null>(null);

  // Load following list once to inform feed ranking and "Following" tab
  useEffect(() => {
    async function loadFollowing() {
      if (!user) return;
      const followingUsers = await getFollowing(user.id);
      setFollowingIds(new Set(followingUsers.map((u) => u.id)));
    }
    loadFollowing();
  }, [user]);

  const loadFeed = useCallback(
    async (resetPage = false) => {
      const targetPage = resetPage ? 0 : page;
      if (resetPage) setIsLoading(true);
      else setIsLoadingMore(true);

      const currentUserId = user?.id || profile?.id || 'usr-ashu-devops-01';
      const currentCollegeId = college?.id || profile?.college_id || 'col-iitb';

      const context = {
        currentUserId,
        collegeId: currentCollegeId,
        followingUserIds: followingIds,
        userInterests: new Set(profile?.interests || []),
        userBranch: profile?.branch || null,
      };

      const res = await fetchFeedPosts(activeCategory, targetPage, context);

      if (resetPage) {
        setPosts(res.posts);
        setPage(1);
        // Load native sponsored ad with frequency capping and privacy protection
        const ad = await advertisingService.getNativeFeedAd(profile, college?.id);
        setSponsoredAd(ad);
      } else {
        setPosts((prev) => [...prev, ...res.posts]);
        setPage((prev) => prev + 1);
      }

      setHasMore(res.hasMore);
      setIsLoading(false);
      setIsLoadingMore(false);
    },
    [user, college?.id, followingIds, profile, activeCategory, page]
  );

  useEffect(() => {
    loadFeed(true);
  }, [activeCategory, college?.id]);

  const handleRefresh = async () => {
    await loadFeed(true);
    toast.success('Feed refreshed');
  };

  const handlePostCreated = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const categories: { id: FeedCategory; label: string }[] = [
    { id: 'for-you', label: 'For You' },
    { id: 'following', label: 'Following' },
    { id: 'campus', label: 'Campus' },
    { id: 'clubs', label: 'Clubs' },
    { id: 'trending', label: 'Trending' },
  ];

  return (
    <div className="space-y-5">
      {/* 24-Hour Stories Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-card">
        <StoriesBar />
      </div>

      {/* Post Composer */}
      <PostComposer onPostCreated={handlePostCreated} />

      {/* Category Tabs & Refresh */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
        <div className="flex space-x-1.5 overflow-x-auto py-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                activeCategory === cat.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/70'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleRefresh}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          title="Refresh feed"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Posts Stream */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-3"
            >
              <div className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-2.5 w-20" />
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title={
            activeCategory === 'following'
              ? 'No posts from students you follow'
              : 'No posts in this feed yet'
          }
          description={
            activeCategory === 'following'
              ? 'Follow more classmates, club leaders, and peers to see their updates here.'
              : 'Your campus community is ready for its next discussion. Be the first to share an update, notes, or campus query.'
          }
          action={
            <Button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="gap-2 font-bold text-xs shadow-sm"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Share First Post</span>
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {posts.map((post, idx) => (
            <React.Fragment key={post.id}>
              <PostCard
                post={post}
                onPostDeleted={handlePostDeleted}
              />
              {/* Regulated frequency cap: inject at most 1 sponsored post in feed */}
              {idx === 2 && sponsoredAd && (
                <SponsoredPostCard
                  advertisement={sponsoredAd.advertisement}
                  campaign={sponsoredAd.campaign}
                  advertiser={sponsoredAd.advertiser}
                  studentCollegeId={college?.id}
                />
              )}
            </React.Fragment>
          ))}

          {/* Infinite Scroll / Load More */}
          {hasMore && (
            <div className="pt-2 text-center">
              <Button
                variant="outline"
                onClick={() => loadFeed(false)}
                isLoading={isLoadingMore}
                className="font-bold text-xs h-10 px-6 rounded-xl"
              >
                Load More Posts
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
