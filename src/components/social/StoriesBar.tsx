import React, { useState, useEffect } from 'react';
import { Plus, Sparkles, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Story } from '@/types/social.types';
import { fetchActiveStories, createStory } from '@/services/storiesService';
import { StoryViewerModal } from './StoryViewerModal';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

export const StoriesBar: React.FC = () => {
  const { user, profile, college } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedAuthorStories, setSelectedAuthorStories] = useState<Story[] | null>(null);

  // Add Story modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadStories();
  }, [college?.id]);

  const loadStories = async () => {
    const list = await fetchActiveStories(college?.id);
    setStories(list);
  };

  const handleCreateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    const authorId = user?.id || profile?.id || 'campus-user';
    const collegeId = college?.id || profile?.college_id || 'campus-node';

    if (!mediaUrl.trim()) {
      toast.error('Please provide an image URL for your story.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { story, error } = await createStory({
        authorId,
        collegeId,
        mediaUrl: mediaUrl.trim(),
        caption: caption.trim() || null,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Story published! Visible to campus for 24 hours.');
      setIsAddOpen(false);
      setMediaUrl('');
      setCaption('');
      await loadStories();
    } catch {
      toast.error('Failed to post story.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group stories by author
  const storiesByAuthor = stories.reduce<Record<string, Story[]>>((acc, story) => {
    if (!acc[story.author_id]) acc[story.author_id] = [];
    acc[story.author_id].push(story);
    return acc;
  }, {});

  const authorsWithStories = Object.values(storiesByAuthor);

  return (
    <div className="flex items-center space-x-3 overflow-x-auto py-2 px-1 scrollbar-none select-none">
      {/* Add My Story Button */}
      <div className="flex flex-col items-center space-y-1.5 shrink-0 cursor-pointer group" onClick={() => setIsAddOpen(true)}>
        <div className="relative">
          <Avatar className="h-14 w-14 ring-2 ring-slate-200 group-hover:ring-indigo-400 transition-all">
            <AvatarImage src={profile?.profile_photo || ''} />
            <AvatarFallback className="text-xs font-bold">
              {profile?.full_name ? profile.full_name.substring(0, 2).toUpperCase() : 'CG'}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white ring-2 ring-white">
            <Plus className="h-3.5 w-3.5" />
          </div>
        </div>
        <span className="text-[11px] font-semibold text-slate-700 max-w-[64px] truncate">
          Your Story
        </span>
      </div>

      {/* Active Campus Stories */}
      {authorsWithStories.map((authorGroup) => {
        const firstStory = authorGroup[0];
        const isSelf = firstStory.author_id === user?.id;

        return (
          <div
            key={firstStory.author_id}
            onClick={() => setSelectedAuthorStories(authorGroup)}
            className="flex flex-col items-center space-y-1.5 shrink-0 cursor-pointer group"
          >
            <div className="p-0.5 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 group-hover:scale-105 transition-transform">
              <Avatar className="h-14 w-14 ring-2 ring-white">
                <AvatarImage src={firstStory.author?.profile_photo || ''} />
                <AvatarFallback className="text-xs font-bold">
                  {firstStory.author?.full_name
                    ? firstStory.author.full_name.substring(0, 2).toUpperCase()
                    : 'CG'}
                </AvatarFallback>
              </Avatar>
            </div>
            <span className="text-[11px] font-semibold text-slate-700 max-w-[64px] truncate">
              {isSelf ? 'You' : firstStory.author?.full_name?.split(' ')[0] || 'Peer'}
            </span>
          </div>
        );
      })}

      {/* Viewer Modal */}
      {selectedAuthorStories && (
        <StoryViewerModal
          stories={selectedAuthorStories}
          isOpen={Boolean(selectedAuthorStories)}
          onClose={() => setSelectedAuthorStories(null)}
        />
      )}

      {/* Add Story Modal */}
      <Modal open={isAddOpen} onOpenChange={setIsAddOpen}>
        <ModalContent className="sm:max-w-md">
          <ModalHeader>
            <div className="flex items-center space-x-2 text-indigo-600 mb-1">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Campus 24h Story</span>
            </div>
            <ModalTitle className="text-lg">Share a 24-Hour Story</ModalTitle>
            <ModalDescription className="text-xs">
              Photo updates visible exclusively to students from your verified campus.
            </ModalDescription>
          </ModalHeader>

          <form onSubmit={handleCreateStory} className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Image URL
              </label>
              <Input
                type="url"
                placeholder="https://example.com/photo.jpg"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                leftIcon={<ImageIcon className="h-4 w-4" />}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Short Caption (Optional)
              </label>
              <Input
                type="text"
                placeholder="e.g. Studying at the library 📚"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={80}
              />
            </div>

            {mediaUrl && (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 max-h-48 flex items-center justify-center">
                <img
                  src={mediaUrl}
                  alt="Story preview"
                  className="max-h-48 object-contain"
                  onError={() => toast.error('Invalid image URL')}
                />
              </div>
            )}

            <ModalFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting} className="font-bold text-xs">
                Post Story
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
};
