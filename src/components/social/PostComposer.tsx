import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Link as LinkIcon,
  X,
  Send,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { createPost } from '@/services/postsService';
import { Post } from '@/types/social.types';
import { toast } from 'sonner';

interface PostComposerProps {
  onPostCreated?: (newPost: Post) => void;
}

export const PostComposer: React.FC<PostComposerProps> = ({ onPostCreated }) => {
  const { user, profile, college } = useAuth();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [showImageInput, setShowImageInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const handleAddImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (imageUrl.trim()) {
      setImages((prev) => [...prev, imageUrl.trim()]);
      setImageUrl('');
      setShowImageInput(false);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    const authorId = user?.id || profile?.id || 'usr-ashu-devops-01';
    const collegeId = college?.id || profile?.college_id || 'col-iitb';

    if (!content.trim() && images.length === 0) {
      toast.error('Please write some text or attach an image.');
      return;
    }

    setIsPublishing(true);
    try {
      const { post, error } = await createPost({
        authorId,
        collegeId,
        content: content.trim(),
        mediaUrls: images,
        linkUrl: linkUrl.trim() || undefined,
        linkTitle: linkTitle.trim() || undefined,
        authorProfile: profile,
      });

      if (error) {
        toast.error(error.message || 'Failed to publish post');
        return;
      }

      if (post) {
        onPostCreated?.(post);
        setContent('');
        setImages([]);
        setLinkUrl('');
        setLinkTitle('');
        setShowImageInput(false);
        setShowLinkInput(false);
        toast.success('Post published to campus feed!');
      }
    } catch {
      toast.error('Failed to create post. Please check your network.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Card className="rounded-2xl border-slate-200/80 shadow-card bg-white overflow-hidden">
      <CardContent className="p-4 sm:p-5">
        <form onSubmit={handlePublish} className="space-y-3">
          <div className="flex items-start space-x-3">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={profile?.profile_photo || ''} />
              <AvatarFallback className="text-xs font-bold">
                {profile?.full_name ? profile.full_name.substring(0, 2).toUpperCase() : 'CG'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <Textarea
                placeholder="What's happening on campus? Share a question, update, or notes..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full border-none p-0 focus-visible:ring-0 text-sm placeholder:text-slate-400 min-h-[64px] resize-none"
              />
            </div>
          </div>

          {/* Image Previews */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="relative rounded-xl overflow-hidden aspect-video bg-slate-100 group border border-slate-200"
                >
                  <img
                    src={img}
                    alt={`Attachment ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1.5 right-1.5 rounded-full bg-black/60 p-1 text-white hover:bg-black/80 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Image URL attachment input */}
          {showImageInput && (
            <div className="flex gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
              <Input
                type="url"
                placeholder="Paste image URL (e.g. https://...)..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="h-9 text-xs"
                autoFocus
              />
              <Button
                type="button"
                size="sm"
                onClick={handleAddImage}
                className="h-9 text-xs font-bold"
              >
                Attach
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowImageInput(false)}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
            </div>
          )}

          {/* Optional Link input */}
          {showLinkInput && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <Input
                type="url"
                placeholder="Link URL (e.g. https://github.com/...)"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="h-9 text-xs"
              />
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Link Title (e.g. Hackathon Repo, Project Drive)"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  className="h-9 text-xs flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLinkInput(false)}
                  className="h-9 text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          )}

          {/* Composer Footer Actions */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <div className="flex items-center space-x-1 text-slate-500">
              <button
                type="button"
                onClick={() => setShowImageInput(!showImageInput)}
                className="flex items-center space-x-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <ImageIcon className="h-4 w-4 text-indigo-600" />
                <span>Image</span>
              </button>

              <button
                type="button"
                onClick={() => setShowLinkInput(!showLinkInput)}
                className="flex items-center space-x-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <LinkIcon className="h-4 w-4 text-emerald-600" />
                <span>Link</span>
              </button>
            </div>

            <Button
              type="submit"
              size="sm"
              isLoading={isPublishing}
              disabled={!content.trim() && images.length === 0}
              className="gap-1.5 font-bold text-xs h-9 px-4 rounded-xl shadow-xs"
            >
              <span>Post</span>
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
