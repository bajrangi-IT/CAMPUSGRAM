import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  PlusCircle,
  Search,
  ShieldCheck,
  AlertTriangle,
  BookOpen,
  Info,
  Calendar,
  Building2,
  CheckCircle,
  BellRing,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { campusService } from '@/services/campusService';
import type { Announcement } from '@/types/campus.types';
import { toast } from 'sonner';

const PRIORITIES = [
  { id: 'all', label: 'All Notices' },
  { id: 'urgent', label: 'Urgent & Alerts', color: 'text-rose-600 bg-rose-50' },
  { id: 'academic', label: 'Academic & Exams', color: 'text-indigo-600 bg-indigo-50' },
  { id: 'important', label: 'Important', color: 'text-amber-600 bg-amber-50' },
  { id: 'normal', label: 'General Updates', color: 'text-slate-600 bg-slate-100' },
];

export const AnnouncementsPage: React.FC = () => {
  const { user, profile, college } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Create Announcement Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'normal' | 'important' | 'urgent' | 'academic'>('normal');
  const [authorRole, setAuthorRole] = useState<'college_admin' | 'faculty' | 'department_admin' | 'club_admin'>('faculty');
  const [targetAudience, setTargetAudience] = useState('All Campus Students');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadAnnouncements = async () => {
    setIsLoading(true);
    try {
      const data = await campusService.getAnnouncements(
        selectedPriority === 'all' ? undefined : selectedPriority
      );
      setAnnouncements(data);
    } catch (err: any) {
      toast.error('Failed to load announcements', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, [selectedPriority]);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !college) return;
    if (!title.trim() || !content.trim()) {
      toast.error('Title and message content are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await campusService.createAnnouncement({
        college_id: college.id,
        author_id: user.id,
        author_role: authorRole,
        title: title.trim(),
        content: content.trim(),
        priority,
        target_audience: targetAudience.trim() || undefined,
      });

      toast.success('Official announcement broadcasted to campus network');
      setIsCreateOpen(false);
      setTitle('');
      setContent('');
      setPriority('normal');
      loadAnnouncements();
    } catch (err: any) {
      toast.error(err.message || 'Failed to post announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAnnouncements = announcements.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase()) ||
      (a.author_role || '').toLowerCase().includes(search.toLowerCase())
  );

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'urgent':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="h-3 w-3 text-rose-600" />
            <span>Urgent Alert</span>
          </span>
        );
      case 'academic':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            <BookOpen className="h-3 w-3 text-indigo-600" />
            <span>Academic Notice</span>
          </span>
        );
      case 'important':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <BellRing className="h-3 w-3 text-amber-600" />
            <span>Important</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            <Info className="h-3 w-3 text-slate-500" />
            <span>General</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-rose-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Megaphone className="h-4 w-4" />
            <span>Verified Broadcasts</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Official Announcements</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Authoritative notices, examination schedules, and institutional alerts for {college?.name || 'campus'}.
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="gap-2 font-bold text-xs sm:text-sm h-10 shrink-0 shadow-sm rounded-xl"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Post Official Notice</span>
        </Button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Input
            type="search"
            placeholder="Search verified announcements, schedules, or departments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4 text-slate-400" />}
            className="bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {PRIORITIES.map((p) => {
            const active = selectedPriority === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPriority(p.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  active
                    ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-300'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 rounded-2xl bg-white border border-slate-100 p-5 animate-pulse space-y-3">
              <div className="h-5 w-1/3 bg-slate-200 rounded" />
              <div className="h-4 w-full bg-slate-100 rounded" />
              <div className="h-4 w-2/3 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No announcements published yet"
          description="Official notices from administration, faculty, and student chapters will be displayed here."
          action={
            <Button onClick={() => setIsCreateOpen(true)} className="gap-2 font-bold text-xs rounded-xl">
              <PlusCircle className="h-4 w-4" />
              <span>Broadcast Notice</span>
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((item) => {
            const postDate = new Date(item.created_at);
            const isUrgent = item.priority === 'urgent';

            return (
              <Card
                key={item.id}
                className={`rounded-2xl border transition-all ${
                  isUrgent
                    ? 'border-rose-200 bg-rose-50/20 shadow-sm'
                    : 'border-slate-200/80 bg-white hover:border-indigo-200 hover:shadow-md'
                }`}
              >
                <CardContent className="p-5 sm:p-6 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900">
                            {item.author?.full_name || 'Campus Administration'}
                          </span>
                          <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                            {(item.author_role || 'staff').replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {college?.name || 'Verified Institution'} • {item.target_audience || 'All Students'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      {getPriorityBadge(item.priority)}
                      <span className="text-[11px] text-slate-400 font-medium">
                        {postDate.toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight mb-2">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                      {item.content}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Broadcast Notice Modal */}
      <Modal open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <ModalContent className="max-w-lg">
          <ModalHeader>
            <ModalTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-600" />
              <span>Broadcast Official Campus Notice</span>
            </ModalTitle>
            <ModalDescription>
              Broadcast official communications, academic advisories, or urgent campus updates.
            </ModalDescription>
          </ModalHeader>

          <form onSubmit={handleCreateAnnouncement} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Notice Headline</label>
              <Input
                placeholder="e.g. Mid-Semester Examination Schedule & Room Allocations"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Priority Classification</label>
                <select
                  value={priority}
                  onChange={(e: any) => setPriority(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="normal">General (Normal)</option>
                  <option value="important">Important Advisory</option>
                  <option value="academic">Academic & Examination</option>
                  <option value="urgent">Urgent / Emergency</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Broadcasting Role</label>
                <select
                  value={authorRole}
                  onChange={(e: any) => setAuthorRole(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="college_admin">College Administration</option>
                  <option value="department_admin">Department Office</option>
                  <option value="faculty">Faculty Member</option>
                  <option value="club_admin">Verified Club Representative</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Target Audience</label>
              <Input
                placeholder="e.g. All Students, 3rd Year B.Tech, or Hostellers"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Full Announcement Message</label>
              <Textarea
                placeholder="Detail the instructions, deadlines, authorized contacts, and requirements..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                required
              />
            </div>

            <ModalFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="font-bold">
                {isSubmitting ? 'Broadcasting...' : 'Broadcast Announcement'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
};
