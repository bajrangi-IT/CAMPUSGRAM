import React, { useState, useEffect } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/Drawer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Comment, Post } from '@/types/social.types';
import { fetchComments, addComment, deleteComment } from '@/services/commentsService';
import { useAuth } from '@/contexts/AuthContext';
import { formatTimeAgo } from '@/lib/utils';
import { Send, Trash2, ShieldAlert, MessageSquare } from 'lucide-react';
import { ReportModal } from './ReportModal';
import { toast } from 'sonner';

interface CommentsDrawerProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  onCommentCountChange?: (postId: string, newCount: number) => void;
}

export const CommentsDrawer: React.FC<CommentsDrawerProps> = ({
  post,
  isOpen,
  onClose,
  onCommentCountChange,
}) => {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && post) {
      loadComments(post.id);
    } else {
      setComments([]);
    }
  }, [isOpen, post?.id]);

  const loadComments = async (postId: string) => {
    setIsLoading(true);
    const res = await fetchComments(postId);
    setComments(res.comments);
    setIsLoading(false);
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post || !newCommentText.trim()) return;
    const authorId = user?.id || profile?.id || 'usr-ashu-devops-01';

    setIsSubmitting(true);
    try {
      const { comment, error } = await addComment({
        postId: post.id,
        authorId,
        content: newCommentText.trim(),
        authorProfile: profile,
      });

      if (error) {
        toast.error(error.message || 'Failed to add comment');
        return;
      }

      if (comment) {
        setComments((prev) => [...prev, comment]);
        setNewCommentText('');
        const newCount = (post.comments_count || 0) + 1;
        onCommentCountChange?.(post.id, newCount);
        toast.success('Comment posted');
      }
    } catch {
      toast.error('Failed to post comment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!post) return;
    try {
      const { success } = await deleteComment(commentId, post.id);
      if (success) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        const newCount = Math.max(0, (post.comments_count || 0) - 1);
        onCommentCountChange?.(post.id, newCount);
        toast.success('Comment deleted');
      }
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  if (!post) return null;

  return (
    <>
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent
          side="right"
          className="flex flex-col h-full w-full sm:max-w-md p-0"
        >
          {/* Header */}
          <DrawerHeader className="px-5 py-4 border-b border-slate-100 mb-0">
            <div className="flex items-center space-x-2 text-indigo-600">
              <MessageSquare className="h-4 w-4" />
              <DrawerTitle className="text-base font-bold">Discussion & Comments</DrawerTitle>
            </div>
            <DrawerDescription className="text-xs">
              Comments on post by @{post.author?.username}
            </DrawerDescription>
          </DrawerHeader>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {isLoading ? (
              <div className="text-center py-8 text-xs text-slate-400">
                Loading discussion...
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-3">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h4 className="text-xs font-bold text-slate-800">No comments yet</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Start the discussion! Share your perspective with campus classmates.
                </p>
              </div>
            ) : (
              comments.map((comment) => {
                const isOwn = comment.author_id === user?.id;
                return (
                  <div key={comment.id} className="flex space-x-3 text-xs group">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={comment.author?.profile_photo || ''} />
                      <AvatarFallback className="text-[10px]">
                        {comment.author?.full_name
                          ? comment.author.full_name.substring(0, 2).toUpperCase()
                          : 'CG'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-900 truncate">
                            {comment.author?.full_name || 'Student'}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                            {formatTimeAgo(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-slate-700 text-xs leading-relaxed whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      </div>

                      {/* Comment actions */}
                      <div className="mt-1 flex items-center space-x-3 text-[11px] text-slate-400 pl-2">
                        {isOwn ? (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="hover:text-rose-600 flex items-center gap-1 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Delete</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setReportingCommentId(comment.id)}
                            className="hover:text-rose-600 flex items-center gap-1 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <ShieldAlert className="h-3 w-3" />
                            <span>Report</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Comment Input */}
          <form
            onSubmit={handleSendComment}
            className="border-t border-slate-100 p-4 bg-white flex items-end gap-2"
          >
            <div className="flex-1">
              <Textarea
                placeholder="Write a comment..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                className="min-h-[44px] max-h-[100px] text-xs py-2 px-3 resize-none"
                rows={1}
                required
              />
            </div>
            <Button
              type="submit"
              size="icon"
              isLoading={isSubmitting}
              disabled={!newCommentText.trim()}
              className="h-10 w-10 shrink-0 rounded-xl"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </DrawerContent>
      </Drawer>

      {/* Report Comment Modal */}
      {reportingCommentId && (
        <ReportModal
          isOpen={Boolean(reportingCommentId)}
          onClose={() => setReportingCommentId(null)}
          targetType="comment"
          targetId={reportingCommentId}
        />
      )}
    </>
  );
};
