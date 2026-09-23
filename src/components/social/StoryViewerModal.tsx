import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Story } from '@/types/social.types';
import { formatTimeAgo } from '@/lib/utils';

interface StoryViewerModalProps {
  stories: Story[];
  isOpen: boolean;
  onClose: () => void;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  stories,
  isOpen,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentIndex(0);
      return;
    }

    // Auto-advance story every 6 seconds
    const timer = setTimeout(() => {
      if (currentIndex < stories.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        onClose();
      }
    }, 6000);

    return () => clearTimeout(timer);
  }, [isOpen, currentIndex, stories.length, onClose]);

  if (!isOpen || stories.length === 0) return null;

  const currentStory = stories[currentIndex];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-md animate-in fade-in-0 duration-200"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20 transition-colors"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Story container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col h-[85vh] w-full max-w-sm rounded-2xl bg-slate-900 overflow-hidden shadow-2xl"
      >
        {/* Progress bars */}
        <div className="absolute top-3 left-3 right-3 z-30 flex gap-1.5">
          {stories.map((s, idx) => (
            <div
              key={s.id}
              className="h-1 flex-1 rounded-full bg-white/30 overflow-hidden"
            >
              <div
                className={`h-full bg-white transition-all duration-300 ${
                  idx < currentIndex
                    ? 'w-full'
                    : idx === currentIndex
                    ? 'w-full animate-[progress_6s_linear]'
                    : 'w-0'
                }`}
              />
            </div>
          ))}
        </div>

        {/* Story Author Header */}
        <div className="absolute top-6 left-3 right-3 z-30 flex items-center space-x-2.5">
          <Avatar className="h-9 w-9 ring-2 ring-white">
            <AvatarImage src={currentStory.author?.profile_photo || ''} />
            <AvatarFallback className="text-xs">
              {currentStory.author?.full_name ? currentStory.author.full_name.substring(0, 2).toUpperCase() : 'CG'}
            </AvatarFallback>
          </Avatar>
          <div className="text-white drop-shadow-md">
            <h4 className="text-xs font-bold leading-tight">
              {currentStory.author?.full_name || 'Campus Student'}
            </h4>
            <p className="text-[10px] text-white/80">
              @{currentStory.author?.username} • {formatTimeAgo(currentStory.created_at)}
            </p>
          </div>
        </div>

        {/* Media */}
        <div className="relative flex-1 flex items-center justify-center bg-black">
          <img
            src={currentStory.media_url}
            alt="Campus story"
            className="h-full w-full object-contain"
          />

          {/* Touch zones for next/prev */}
          <div
            onClick={handlePrev}
            className="absolute top-0 bottom-0 left-0 w-1/3 cursor-pointer"
          />
          <div
            onClick={handleNext}
            className="absolute top-0 bottom-0 right-0 w-2/3 cursor-pointer"
          />
        </div>

        {/* Caption */}
        {currentStory.caption && (
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 pt-10 text-white z-30">
            <p className="text-xs leading-relaxed font-medium">
              {currentStory.caption}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
