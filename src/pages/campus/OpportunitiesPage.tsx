import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  PlusCircle,
  Search,
  ExternalLink,
  Calendar,
  Building,
  MapPin,
  Clock,
  Sparkles,
  Tag,
  GraduationCap,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { campusService } from '@/services/campusService';
import type { Opportunity } from '@/types/campus.types';
import { toast } from 'sonner';

const OPPORTUNITY_CATEGORIES = [
  'All',
  'Internship',
  'Research Lab',
  'Campus Job',
  'Hackathon',
  'Scholarship',
  'Fellowship',
];

export const OpportunitiesPage: React.FC = () => {
  const { user, college } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Post Opportunity Modal
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [category, setCategory] = useState('Internship');
  const [location, setLocation] = useState('On-Campus');
  const [deadline, setDeadline] = useState('');
  const [description, setDescription] = useState('');
  const [applyUrl, setApplyUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadOpportunities = async () => {
    setIsLoading(true);
    try {
      const data = await campusService.getOpportunities(
        selectedCategory === 'All' ? undefined : selectedCategory
      );
      setOpportunities(data);
    } catch (err: any) {
      toast.error('Failed to load opportunities', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOpportunities();
  }, [selectedCategory]);

  const handlePostOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !college) return;
    if (!title.trim() || !company.trim() || !description.trim()) {
      toast.error('Please complete title, organization, and description');
      return;
    }

    setIsSubmitting(true);
    try {
      await campusService.createOpportunity({
        college_id: college.id,
        posted_by: user.id,
        title: title.trim(),
        company: company.trim(),
        category,
        location: location.trim(),
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        description: description.trim(),
        apply_url: applyUrl.trim() || undefined,
      });

      toast.success('Opportunity posted to campus portal');
      setIsPostOpen(false);
      setTitle('');
      setCompany('');
      setLocation('On-Campus');
      setDeadline('');
      setDescription('');
      setApplyUrl('');
      loadOpportunities();
    } catch (err: any) {
      toast.error(err.message || 'Failed to post opportunity');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredOpportunities = opportunities.filter(
    (op) =>
      op.title.toLowerCase().includes(search.toLowerCase()) ||
      (op.company || op.organization || '').toLowerCase().includes(search.toLowerCase()) ||
      (op.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Briefcase className="h-4 w-4" />
            <span>Careers & Research</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Opportunities</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Verified internships, research assistantships, campus jobs, and external hackathons.
          </p>
        </div>
        <Button
          onClick={() => setIsPostOpen(true)}
          className="gap-2 font-bold text-xs sm:text-sm h-10 shrink-0 shadow-sm rounded-xl"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Post Opportunity</span>
        </Button>
      </div>

      {/* Category Pills & Search */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Input
            type="search"
            placeholder="Search roles, companies, or research areas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4 text-slate-400" />}
            className="bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {OPPORTUNITY_CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  active
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-200'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-white border border-slate-100 p-5 animate-pulse space-y-3">
              <div className="h-4 w-1/4 bg-slate-200 rounded" />
              <div className="h-5 w-3/4 bg-slate-200 rounded" />
              <div className="h-12 w-full bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : filteredOpportunities.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No open opportunities listed"
          description="Be the first professor, alumni, or student founder to list internships or research openings."
          action={
            <Button onClick={() => setIsPostOpen(true)} className="gap-2 font-bold text-xs rounded-xl">
              <PlusCircle className="h-4 w-4" />
              <span>List First Opportunity</span>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOpportunities.map((op) => {
            const hasDeadline = !!op.deadline;
            const deadlineDate = hasDeadline ? new Date(op.deadline!) : null;

            return (
              <Card
                key={op.id}
                className="rounded-2xl border-slate-200/80 bg-white hover:border-blue-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                      {op.category}
                    </span>

                    {hasDeadline && deadlineDate && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                        <Clock className="h-3 w-3" />
                        <span>Apply by {deadlineDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-slate-900 line-clamp-1">{op.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Building className="h-3.5 w-3.5 text-slate-400" />
                        <span>{op.company}</span>
                      </span>
                      {op.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          <span>{op.location}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {op.description}
                  </p>
                </CardContent>

                <div className="p-4 pt-0 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Posted {new Date(op.created_at).toLocaleDateString()}
                  </span>

                  {op.apply_url ? (
                    <a
                      href={op.apply_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 px-3.5 py-1.5 rounded-xl transition-colors shadow-sm"
                    >
                      <span>Apply Now</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <Button size="sm" variant="outline" className="text-xs font-bold rounded-xl h-8">
                      Contact Poster
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Post Opportunity Modal */}
      <Modal open={isPostOpen} onOpenChange={setIsPostOpen}>
        <ModalContent className="max-w-md">
          <ModalHeader>
            <ModalTitle>Post Campus Opportunity</ModalTitle>
            <ModalDescription>
              Share an internship, hackathon, lab vacancy, or campus role with talented students.
            </ModalDescription>
          </ModalHeader>

          <form onSubmit={handlePostOpportunity} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Opportunity Title</label>
              <Input
                placeholder="e.g. AI Research Intern or Lead Frontend Developer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Organization / Lab</label>
                <Input
                  placeholder="e.g. Robotics Center / Tech Startup"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {OPPORTUNITY_CATEGORIES.filter((c) => c !== 'All').map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Location / Format</label>
                <Input
                  placeholder="e.g. On-Campus, Remote, Hybrid"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Application Deadline</label>
                <Input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Application URL or Form Link</label>
              <Input
                placeholder="https://... or google form link"
                value={applyUrl}
                onChange={(e) => setApplyUrl(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Role Description & Requirements</label>
              <Textarea
                placeholder="Responsibilities, required skills, duration, stipend/compensation details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                required
              />
            </div>

            <ModalFooter>
              <Button type="button" variant="outline" onClick={() => setIsPostOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="font-bold">
                {isSubmitting ? 'Posting...' : 'Publish Opportunity'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
};
