import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  PlusCircle,
  Search,
  MessageSquare,
  Users,
  Code2,
  Sparkles,
  ArrowRight,
  Layers,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent } from '@/components/ui/Card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { campusService } from '@/services/campusService';
import type { TeamRequest } from '@/types/campus.types';
import { toast } from 'sonner';

export const TeamFinderPage: React.FC = () => {
  const { user, profile, college } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<TeamRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Post Request Modal
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [peopleNeeded, setPeopleNeeded] = useState('2');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Express Interest Modal
  const [interestTarget, setInterestTarget] = useState<TeamRequest | null>(null);
  const [pitchMessage, setPitchMessage] = useState('');

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const data = await campusService.getTeamRequests();
      setRequests(data);
    } catch (err: any) {
      toast.error('Failed to load team requests', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handlePostRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !college) return;
    if (!title.trim() || !description.trim()) {
      toast.error('Please enter project title and description');
      return;
    }

    const skills = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    setIsSubmitting(true);
    try {
      await campusService.createTeamRequest({
        college_id: college.id,
        creator_id: user.id,
        title: title.trim(),
        description: description.trim(),
        skills_needed: skills.length > 0 ? skills : ['General Collaborator'],
        people_needed: parseInt(peopleNeeded, 10) || 1,
      });

      toast.success('Team request broadcasted to campus network');
      setIsPostOpen(false);
      setTitle('');
      setDescription('');
      setSkillsInput('');
      setPeopleNeeded('2');
      loadRequests();
    } catch (err: any) {
      toast.error(err.message || 'Failed to post request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExpressInterest = (req: TeamRequest) => {
    if (!user) {
      toast.error('Please sign in to connect with teammates');
      return;
    }
    if (user.id === req.creator_id) {
      toast.info('You created this team request.');
      return;
    }
    setInterestTarget(req);
    setPitchMessage(`Hi ${req.creator?.full_name || 'there'}! I saw your "${req.title}" team request on CampusGram and would love to collaborate.`);
  };

  const handleConfirmInterest = () => {
    if (!interestTarget) return;
    toast.success(`Interest sent to ${interestTarget.creator?.full_name || 'team lead'}! Opening direct messages...`);
    setInterestTarget(null);
    navigate('/messages');
  };

  const filteredRequests = requests.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase()) ||
      r.skills_needed.some((s) => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-violet-600 font-bold text-xs uppercase tracking-wider mb-1">
            <UserPlus className="h-4 w-4" />
            <span>Campus Collaboration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Team Finder</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Recruit skilled co-founders, hackathon partners, and project teammates across departments.
          </p>
        </div>
        <Button
          onClick={() => setIsPostOpen(true)}
          className="gap-2 font-bold text-xs sm:text-sm h-10 shrink-0 shadow-sm rounded-xl"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Post Team Request</span>
        </Button>
      </div>

      {/* Search */}
      <div>
        <Input
          type="search"
          placeholder="Search by required skill (e.g. PyTorch, React, UI/UX, Flutter) or project topic..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="h-4 w-4 text-slate-400" />}
          className="bg-white"
        />
      </div>

      {/* Grid of Team Requests */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-52 rounded-2xl bg-white border border-slate-100 p-5 animate-pulse space-y-3">
              <div className="h-4 w-1/3 bg-slate-200 rounded" />
              <div className="h-6 w-3/4 bg-slate-200 rounded" />
              <div className="h-10 w-full bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : filteredRequests.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="No open team requests right now"
          description="Have a hackathon idea, startup concept, or capstone project? Post a request to find collaborators."
          action={
            <Button onClick={() => setIsPostOpen(true)} className="gap-2 font-bold text-xs rounded-xl">
              <PlusCircle className="h-4 w-4" />
              <span>Recruit Teammates</span>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRequests.map((req) => (
            <Card
              key={req.id}
              className="rounded-2xl border-slate-200/80 bg-white hover:border-violet-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 rounded-xl border border-slate-200">
                      <AvatarImage src={req.creator?.profile_photo || (req.creator as any)?.avatar_url} />
                      <AvatarFallback className="bg-violet-600 text-white font-bold text-xs">
                        {req.creator?.full_name?.substring(0, 2).toUpperCase() || 'TM'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-xs text-slate-900">{req.creator?.full_name || 'Student Creator'}</p>
                      <p className="text-[10px] text-slate-400">
                        @{req.creator?.username || 'campus_student'} • {req.creator?.course || 'Campus Member'}
                      </p>
                    </div>
                  </div>

                  <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                    <Users className="h-3 w-3" />
                    <span>{req.people_needed} needed</span>
                  </span>
                </div>

                <div>
                  <h3 className="font-black text-slate-900 text-base">{req.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-3">
                    {req.description}
                  </p>
                </div>

                {/* Skills Needed Chips */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Target Skills
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {req.skills_needed.map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-semibold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1"
                      >
                        <Code2 className="h-3 w-3 text-slate-400" />
                        <span>{skill}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>

              <div className="p-4 pt-0 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {new Date(req.created_at).toLocaleDateString()}
                </span>

                <Button
                  onClick={() => handleExpressInterest(req)}
                  className="gap-1.5 text-xs font-bold rounded-xl h-8 bg-violet-600 hover:bg-violet-700 text-white"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Express Interest</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Express Interest Modal */}
      <Modal open={!!interestTarget} onOpenChange={(open) => !open && setInterestTarget(null)}>
        {interestTarget && (
          <ModalContent className="max-w-md">
            <ModalHeader>
              <ModalTitle>Connect with Project Lead</ModalTitle>
              <ModalDescription>
                Send an introductory message to {interestTarget.creator?.full_name} regarding "{interestTarget.title}".
              </ModalDescription>
            </ModalHeader>

            <div className="space-y-3 py-2">
              <label className="text-xs font-bold text-slate-700 block">Your Introductory Note</label>
              <Textarea
                value={pitchMessage}
                onChange={(e) => setPitchMessage(e.target.value)}
                rows={4}
                placeholder="Mention your background, skills, and why you are excited to collaborate..."
              />
            </div>

            <ModalFooter>
              <Button variant="outline" onClick={() => setInterestTarget(null)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmInterest} className="gap-2 font-bold bg-violet-600 hover:bg-violet-700 text-white">
                <Send className="h-4 w-4" />
                <span>Send Note via DM</span>
              </Button>
            </ModalFooter>
          </ModalContent>
        )}
      </Modal>

      {/* Post Request Modal */}
      <Modal open={isPostOpen} onOpenChange={setIsPostOpen}>
        <ModalContent className="max-w-md">
          <ModalHeader>
            <ModalTitle>Post Team Request</ModalTitle>
            <ModalDescription>
              Find collaborators for your hackathon, research project, capstone, or student startup.
            </ModalDescription>
          </ModalHeader>

          <form onSubmit={handlePostRequest} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Project / Team Title</label>
              <Input
                placeholder="e.g. Autonomous Drone for Campus Navigation"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Collaborators Needed</label>
              <Input
                type="number"
                min="1"
                max="10"
                value={peopleNeeded}
                onChange={(e) => setPeopleNeeded(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Required Skills (Comma separated)</label>
              <Input
                placeholder="e.g. React, OpenCV, Python, Hardware, CAD"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Project Overview & Timeline</label>
              <Textarea
                placeholder="Describe what you are building, the scope, timeline, and what role they will play..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
              />
            </div>

            <ModalFooter>
              <Button type="button" variant="outline" onClick={() => setIsPostOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="font-bold">
                {isSubmitting ? 'Broadcasting...' : 'Publish Request'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
};
