import React, { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { submitReport, ReportTargetType } from '@/services/safetyService';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  targetTitle?: string;
}

const REPORT_REASONS = [
  'Harassment or Bullying',
  'Spam or Commercial Solicitation',
  'Inappropriate Content',
  'Hate Speech or Discrimination',
  'Misinformation / Academic Dishonesty',
  'Impersonation of Student/Faculty',
  'Other Campus Guideline Violation',
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle,
}) => {
  const { user } = useAuth();
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be logged in to submit a report.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { success, error } = await submitReport({
        reporterId: user.id,
        targetType,
        targetId,
        reason: selectedReason,
        details,
      });

      if (error) {
        toast.error(error.message || 'Failed to submit report');
        return;
      }

      toast.success('Report submitted to campus moderation. Thank you for keeping our community safe.');
      onClose();
      setDetails('');
    } catch {
      toast.error('Failed to submit report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalContent className="sm:max-w-md">
        <ModalHeader>
          <div className="flex items-center space-x-2 text-rose-600 mb-1">
            <ShieldAlert className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Campus Safety Report</span>
          </div>
          <ModalTitle className="text-lg">Report {targetType}</ModalTitle>
          <ModalDescription className="text-xs">
            {targetTitle
              ? `Reporting: "${targetTitle}"`
              : 'Our student moderation team investigates all safety and harassment reports.'}
          </ModalDescription>
        </ModalHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Reason for reporting
            </label>
            <div className="space-y-1.5">
              {REPORT_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center space-x-2.5 rounded-xl border p-2.5 text-xs font-medium cursor-pointer transition-colors ${
                    selectedReason === reason
                      ? 'border-rose-400 bg-rose-50/50 text-rose-900'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Additional Details (Optional)
            </label>
            <Textarea
              placeholder="Provide any additional context for moderators..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="text-xs"
              maxLength={300}
            />
          </div>

          <ModalFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              isLoading={isSubmitting}
              className="font-bold text-xs"
            >
              Submit Report
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};
