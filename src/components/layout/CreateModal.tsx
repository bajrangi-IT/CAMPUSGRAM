import React from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
} from '@/components/ui/Modal';
import {
  FileText,
  Calendar,
  Users,
  BookOpen,
  UserPlus,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateModal: React.FC<CreateModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const options = [
    {
      title: 'Campus Post',
      description: 'Share thoughts, questions, or updates with your campus feed',
      icon: FileText,
      color: 'bg-indigo-50 text-indigo-600',
      action: () => {
        onClose();
        navigate('/');
      },
    },
    {
      title: 'Share Study Notes',
      description: 'Upload course notes, previous papers, or project resources',
      icon: BookOpen,
      color: 'bg-emerald-50 text-emerald-600',
      action: () => {
        onClose();
        navigate('/campus/notes');
      },
    },
    {
      title: 'Host a Campus Event',
      description: 'Organize a workshop, fest event, hackathon, or meetup',
      icon: Calendar,
      color: 'bg-amber-50 text-amber-600',
      action: () => {
        onClose();
        navigate('/campus/events');
      },
    },
    {
      title: 'Form a Project / Hackathon Team',
      description: 'Find teammates with matching skills and interests',
      icon: UserPlus,
      color: 'bg-purple-50 text-purple-600',
      action: () => {
        onClose();
        navigate('/campus/team-finder');
      },
    },
    {
      title: 'Register a Campus Club',
      description: 'Start or claim an official student club or chapter',
      icon: Users,
      color: 'bg-blue-50 text-blue-600',
      action: () => {
        onClose();
        navigate('/campus/clubs');
      },
    },
    {
      title: 'Campus Marketplace Listing',
      description: 'Buy or sell books, electronics, drafters, or cycles',
      icon: ShoppingBag,
      color: 'bg-rose-50 text-rose-600',
      action: () => {
        onClose();
        navigate('/campus/marketplace');
      },
    },
  ];

  return (
    <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalContent className="sm:max-w-lg">
        <ModalHeader>
          <div className="flex items-center space-x-2 text-indigo-600 mb-1">
            <Sparkles className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Campus Action Hub</span>
          </div>
          <ModalTitle className="text-xl">What would you like to create?</ModalTitle>
          <ModalDescription>
            Choose an action to share with your verified campus community.
          </ModalDescription>
        </ModalHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3">
          {options.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.title}
                onClick={opt.action}
                className="flex items-start text-left p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-indigo-50/40 hover:border-indigo-200 transition-all group"
              >
                <div className={`p-2.5 rounded-xl ${opt.color} shrink-0 mr-3 group-hover:scale-105 transition-transform`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                    {opt.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-snug line-clamp-2">
                    {opt.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </ModalContent>
    </Modal>
  );
};
