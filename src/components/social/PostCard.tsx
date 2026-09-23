import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  MoreHorizontal,
  Trash2,
  ShieldAlert,
  ExternalLink,
  GraduationCap,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Card, CardContent } from '@/components/ui/Card';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/Dropdown';
import { Post } from '@/types/social.types';
import { toggleLikePost, toggleSavePost, deletePost } from '@/services/postsService';
import { useAuth } from '@/contexts/AuthContext';
import { formatTimeAgo } from '@/lib/utils';
import { MediaLightbox } from './MediaLightbox';
import { CommentsDrawer } from './CommentsDrawer';
import { ReportModal } from './ReportModal';
import { toast } from 'sonner';

interface PostCardProps {
  post: Post;
  onPostDeleted?: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onPostDeleted }) => {
  const { user } = useAuth();

  // Optimistic like state
  const [isLiked, setIsLiked] = useState(Boolean(post.is_liked));
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [isLiking, setIsLiking] = useState(false);

  // Save state
  const [isSaved, setIsSaved] = useState(Boolean(post.is_saved));

  // Comments drawer state
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);

  // Lightbox state
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxInitialIndex, setLightboxInitialIndex] = useState(0);

  // Report modal state
  const [isReportOpen, setIsReportOpen] = useState(false);

  const isAuthor = user?.id === post.author_id;

  const handleLike = async () => {
    if (!user) {
      toast.error('Please log in to like posts.');
      return;
    }

    const previousLiked = isLiked;
    const previousCount = likesCount;

    // Optimistic UI update
    setIsLiked(!previousLiked);
    setLikesCount(previousLiked ? Math.max(0, previousCount - 1) : previousCount + 1);

    try {
      const res = await toggleLikePost(post.id, user.id, previousLiked);
      if (!res.success) {
        // Revert on failure
        setIsLiked(previousLiked);
        setLikesCount(previousCount);
      }
    } catch {
      setIsLiked(previousLiked);
      setLikesCount(previousCount);
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast.error('Please log in to save posts.');
      return;
    }
    const previousSaved = isSaved;
    setIsSaved(!previousSaved);
    toast.success(!previousSaved ? 'Post saved to your bookmarks' : 'Post removed from saved');

    await toggleSavePost(post.id, user.id, previousSaved);
  };

  const handleShare = () => {
    const postUrl = `${window.location.origin}/#post-${post.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(postUrl);
      toast.success('Post link copied to clipboard!');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      const { success } = await deletePost(post.id);
      if (success) {
        toast.success('Post deleted successfully');
        onPostDeleted?.(post.id);
      }
    } catch {
      toast.error('Failed to delete post.');
    }
  };

  const openLightbox = (index: number) => {
    setLightboxInitialIndex(index);
    setIsLightboxOpen(true);
  };

  return (
    <Card id={`post-${post.id}`} className="rounded-2xl border-slate-200/80 shadow-card bg-white overflow-hidden transition-all">
      <CardContent className="p-4 sm:p-5">
        {/* Post Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <NavLink to={`/profile/${post.author?.username}`}>
              <Avatar className="h-10 w-10 ring-1 ring-slate-100">
                <AvatarImage src={post.author?.profile_photo || ''} />
                <AvatarFallback className="text-xs font-bold">
                  {post.author?.full_name
                    ? post.author.full_name.substring(0, 2).toUpperCase()
                    : 'CG'}
                </AvatarFallback>
              </Avatar>
            </NavLink>

            <div className="min-w-0">
              <div className="flex items-center space-x-1.5 flex-wrap">
                <NavLink
                  to={`/profile/${post.author?.username}`}
                  className="text-xs sm:text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors truncate"
                >
                  {post.author?.full_name || 'Campus Student'}
                </NavLink>
                <span className="text-xs text-slate-400">
                  @{post.author?.username}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-[11px] text-slate-400 shrink-0">
                  {formatTimeAgo(post.created_at)}
                </span>
              </div>

              {/* Department / Batch tag if available */}
              {(post.author?.course || post.author?.year) && (
                <div className="flex items-center space-x-1 text-[11px] text-slate-500 font-medium mt-0.5">
                  <GraduationCap className="h-3 w-3 text-slate-400" />
                  <span className="truncate">
                    {[post.author.course, post.author.year].filter(Boolean).join(' • ')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Post Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors focus:outline-none">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 text-xs">
              <DropdownMenuItem onClick={handleShare}>
                <Share2 className="mr-2 h-3.5 w-3.5 text-slate-500" />
                <span>Copy Link</span>
              </DropdownMenuItem>
              {isAuthor ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-rose-600 focus:text-rose-600"
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    <span>Delete Post</span>
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setIsReportOpen(true)}
                    className="text-rose-600 focus:text-rose-600"
                  >
                    <ShieldAlert className="mr-2 h-3.5 w-3.5" />
                    <span>Report Post</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content Body */}
        {post.content && (
          <p className="mt-3 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
            {post.content}
          </p>
        )}

        {/* Optional Link Preview Pill */}
        {post.link_url && (
          <a
            href={post.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-2.5 hover:bg-slate-100 transition-colors text-xs text-slate-700 font-medium group"
          >
            <span className="truncate flex-1 font-semibold group-hover:text-indigo-600">
              {post.link_title || post.link_url}
            </span>
            <ExternalLink className="h-3.5 w-3.5 text-slate-400 ml-2 shrink-0 group-hover:text-indigo-600" />
          </a>
        )}

        {/* Media Grid */}
        {post.media_urls && post.media_urls.length > 0 && (
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200/80">
            {post.media_urls.length === 1 ? (
              <div
                onClick={() => openLightbox(0)}
                className="max-h-96 w-full cursor-pointer overflow-hidden bg-slate-900"
              >
                <img
                  src={post.media_urls[0]}
                  alt="Post media"
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.01]"
                />
              </div>
            ) : post.media_urls.length === 2 ? (
              <div className="grid grid-cols-2 gap-1 bg-slate-100">
                {post.media_urls.map((url, i) => (
                  <div
                    key={i}
                    onClick={() => openLightbox(i)}
                    className="aspect-square cursor-pointer overflow-hidden"
                  >
                    <img
                      src={url}
                      alt="Post media"
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1 bg-slate-100">
                <div
                  onClick={() => openLightbox(0)}
                  className="aspect-square cursor-pointer overflow-hidden row-span-2"
                >
                  <img
                    src={post.media_urls[0]}
                    alt="Post media"
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform hover:scale-105"
                  />
                </div>
                <div
                  onClick={() => openLightbox(1)}
                  className="aspect-video cursor-pointer overflow-hidden"
                >
                  <img
                    src={post.media_urls[1]}
                    alt="Post media"
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform hover:scale-105"
                  />
                </div>
                <div
                  onClick={() => openLightbox(2)}
                  className="relative aspect-video cursor-pointer overflow-hidden"
                >
                  <img
                    src={post.media_urls[2]}
                    alt="Post media"
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform hover:scale-105"
                  />
                  {post.media_urls.length > 3 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-sm">
                      +{post.media_urls.length - 2}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Post Actions Bar */}
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-slate-500">
          <div className="flex items-center space-x-4 sm:space-x-6">
            {/* Like Button */}
            <button
              onClick={handleLike}
              className={`flex items-center space-x-1.5 text-xs font-semibold transition-colors group ${
                isLiked ? 'text-rose-600' : 'text-slate-600 hover:text-rose-600'
              }`}
            >
              <Heart
                className={`h-4 w-4 transition-transform group-active:scale-125 ${
                  isLiked ? 'fill-rose-600 text-rose-600' : 'text-slate-400 group-hover:text-rose-600'
                }`}
              />
              <span>{likesCount}</span>
            </button>

            {/* Comment Button */}
            <button
              onClick={() => setIsCommentsOpen(true)}
              className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors group"
            >
              <MessageCircle className="h-4 w-4 text-slate-400 group-hover:text-indigo-600" />
              <span>{commentsCount}</span>
            </button>

            {/* Internal Share Button */}
            <button
              onClick={handleShare}
              className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors group"
            >
              <Share2 className="h-4 w-4 text-slate-400 group-hover:text-indigo-600" />
            </button>
          </div>

          {/* Bookmark / Save */}
          <button
            onClick={handleSave}
            className={`rounded-lg p-1.5 transition-colors ${
              isSaved
                ? 'text-indigo-600 hover:text-indigo-700'
                : 'text-slate-400 hover:text-slate-700'
            }`}
            title={isSaved ? 'Remove from saved' : 'Save post'}
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-indigo-600' : ''}`} />
          </button>
        </div>
      </CardContent>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <MediaLightbox
          images={post.media_urls || []}
          initialIndex={lightboxInitialIndex}
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
        />
      )}

      {/* Comments Drawer */}
      <CommentsDrawer
        post={post}
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        onCommentCountChange={(_, newCount) => setCommentsCount(newCount)}
      />

      {/* Report Modal */}
      {isReportOpen && (
        <ReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          targetType="post"
          targetId={post.id}
          targetTitle={post.content?.substring(0, 40)}
        />
      )}
    </Card>
  );
};
