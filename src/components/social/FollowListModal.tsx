import React from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
} from '@/components/ui/Modal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Profile } from '@/types/database.types';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';

interface FollowListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  users: Profile[];
  currentUserId?: string;
}

export const FollowListModal: React.FC<FollowListModalProps> = ({
  isOpen,
  onClose,
  title,
  users,
  currentUserId,
}) => {
  const navigate = useNavigate();

  return (
    <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalContent className="sm:max-w-md max-h-[80vh] flex flex-col p-0">
        <ModalHeader className="p-4 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-indigo-600" />
            <ModalTitle className="text-base font-bold">{title}</ModalTitle>
          </div>
        </ModalHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {users.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No students found in this list.
            </div>
          ) : (
            users.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <div
                  onClick={() => {
                    onClose();
                    navigate(`/profile/${u.username}`);
                  }}
                  className="flex items-center space-x-3 cursor-pointer min-w-0"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={u.profile_photo || ''} />
                    <AvatarFallback className="text-xs">
                      {u.full_name ? u.full_name.substring(0, 2).toUpperCase() : 'CG'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {u.full_name}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">
                      @{u.username}
                      {u.branch && ` • ${u.branch}`}
                    </p>
                  </div>
                </div>

                {u.id !== currentUserId && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onClose();
                      navigate(`/profile/${u.username}`);
                    }}
                    className="text-xs h-8 px-3 font-semibold"
                  >
                    View
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </ModalContent>
    </Modal>
  );
};
