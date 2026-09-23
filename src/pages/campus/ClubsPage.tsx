import React, { useState, useEffect } from 'react';
import {
  Users,
  PlusCircle,
  Search,
  Check,
  Shield,
  Calendar,
  Megaphone,
  ArrowRight,
  Sparkles,
  Info,
  ChevronRight,
  ExternalLink,
  Layers,
  Heart,
  Loader2,
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
import type { Club, EventItem, Announcement } from '@/types/campus.types';
import { toast } from 'sonner';

const CLUB_CATEGORIES = [
  'All',
  'Technical',
  'Cultural',
  'Sports',
  'Academic',
  'Social & Volunteering',
  'Entrepreneurship',
  'Media & Arts',
];

export const ClubsPage: React.FC = () => {
  const { user, profile, college } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Modals state
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [activeClubTab, setActiveClubTab] = useState<'about' | 'events' | 'announcements'>('about');
  const [clubEvents, setClubEvents] = useState<EventItem[]>([]);
  const [clubAnnouncements, setClubAnnouncements] = useState<Announcement[]>([]);
  const [isLoadingClubSubData, setIsLoadingClubSubData] = useState(false);
  const [userMemberships, setUserMemberships] = useState<Record<string, { role: 'member' | 'admin' }>>({});

  // Register Club modal
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [regName, setRegName] = useState('');
  const [regCategory, setRegCategory] = useState('Technical');
  const [regDescription, setRegDescription] = useState('');
  const [regLogoUrl, setRegLogoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Action modal for Club Admin
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventVenue, setEventVenue] = useState('');

  const loadClubs = async () => {
    setIsLoading(true);
    try {
      const data = await campusService.getClubs(selectedCategory === 'All' ? undefined : selectedCategory);
      setClubs(data);

      if (user) {
        const membershipMap: Record<string, { role: 'member' | 'admin' }> = {};
        await Promise.all(
          data.map(async (c: Club) => {
            const mem = await campusService.checkUserClubMembership(c.id, user.id);
            if (mem.isMember && mem.role) {
              membershipMap[c.id] = { role: mem.role };
            }
          })
        );
        setUserMemberships(membershipMap);
      }
    } catch (err: any) {
      toast.error('Failed to load campus clubs', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClubs();
  }, [selectedCategory, user?.id]);

  const handleOpenClub = async (club: Club) => {
    setSelectedClub(club);
    setActiveClubTab('about');
    setIsLoadingClubSubData(true);
    try {
      const [events, announcements] = await Promise.all([
        campusService.getClubEvents(club.id),
        campusService.getClubAnnouncements(club.id),
      ]);
      setClubEvents(events);
      setClubAnnouncements(announcements);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingClubSubData(false);
    }
  };

  const handleToggleJoin = async (clubId: string) => {
    if (!user) {
      toast.error('Please log in to join clubs');
      return;
    }
    const isMember = !!userMemberships[clubId];

    try {
      if (isMember) {
        await campusService.leaveClub(clubId, user.id);
        setUserMemberships((prev) => {
          const next = { ...prev };
          delete next[clubId];
          return next;
        });
        setClubs((prev) =>
          prev.map((c) => (c.id === clubId ? { ...c, member_count: Math.max(0, (c.member_count || 1) - 1) } : c))
        );
        if (selectedClub?.id === clubId) {
          setSelectedClub((prev) =>
            prev ? { ...prev, member_count: Math.max(0, (prev.member_count || 1) - 1) } : null
          );
        }
        toast.success('You have left the club.');
      } else {
        await campusService.joinClub(clubId, user.id);
        setUserMemberships((prev) => ({
          ...prev,
          [clubId]: { role: 'member' },
        }));
        setClubs((prev) =>
          prev.map((c) => (c.id === clubId ? { ...c, member_count: (c.member_count || 0) + 1 } : c))
        );
        if (selectedClub?.id === clubId) {
          setSelectedClub((prev) => (prev ? { ...prev, member_count: (prev.member_count || 0) + 1 } : null));
        }
        toast.success(`Welcome to the club! You are now an active member.`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    }
  };

  const handleRegisterClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !college) {
      toast.error('Authentication or campus context required');
      return;
    }
    if (!regName.trim() || !regDescription.trim()) {
      toast.error('Please enter club name and description');
      return;
    }

    setIsSubmitting(true);
    try {
      const newClub = await campusService.createClub({
        college_id: college.id,
        name: regName.trim(),
        category: regCategory,
        description: regDescription.trim(),
        logo_url: regLogoUrl.trim() || undefined,
        created_by: user.id,
      });

      toast.success('Club registered successfully as administrator!');
      setIsRegisterOpen(false);
      setRegName('');
      setRegDescription('');
      setRegLogoUrl('');
      setUserMemberships((prev) => ({ ...prev, [newClub.id]: { role: 'admin' } }));
      loadClubs();
    } catch (err: any) {
      toast.error(err.message || 'Failed to register club');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateClubEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClub || !user || !college) return;
    if (!eventTitle.trim() || !eventDate || !eventVenue.trim()) {
      toast.error('Please fill in title, date, and venue');
      return;
    }

    setIsSubmitting(true);
    try {
      await campusService.createEvent({
        college_id: college.id,
        club_id: selectedClub.id,
        title: eventTitle.trim(),
        description: eventDesc.trim(),
        venue: eventVenue.trim(),
        start_time: new Date(eventDate).toISOString(),
        created_by: user.id,
      });
      toast.success('Event hosted for this club!');
      setIsCreateEventOpen(false);
      setEventTitle('');
      setEventDesc('');
      setEventVenue('');
      // refresh subdata
      const events = await campusService.getClubEvents(selectedClub.id);
      setClubEvents(events);
    } catch (err: any) {
      toast.error(err.message || 'Failed to host event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredClubs = clubs.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Users className="h-4 w-4" />
            <span>Campus Community</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Clubs & Societies</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Discover student-run organizations, technical teams, and creative chapters at {college?.name || 'campus'}.
          </p>
        </div>
        <Button
          onClick={() => setIsRegisterOpen(true)}
          className="gap-2 font-bold text-xs sm:text-sm h-10 shrink-0 shadow-sm rounded-xl"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Register Club</span>
        </Button>
      </div>

      {/* Category Pills & Search */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Input
            type="search"
            placeholder="Search clubs by name, category, or mission..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4 text-slate-400" />}
            className="bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {CLUB_CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  active
                    ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-200'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-56 rounded-2xl bg-white border border-slate-100 p-5 animate-pulse space-y-4">
              <div className="h-12 w-12 rounded-xl bg-slate-200" />
              <div className="h-4 w-2/3 bg-slate-200 rounded" />
              <div className="h-12 w-full bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : filteredClubs.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? 'No matching clubs found' : 'No campus clubs registered yet'}
          description={
            search
              ? 'Try adjusting your search terms or filter category.'
              : 'Be the first student leader to register an official club or chapter for your campus.'
          }
          action={
            <Button onClick={() => setIsRegisterOpen(true)} className="gap-2 font-bold text-xs rounded-xl">
              <PlusCircle className="h-4 w-4" />
              <span>Register First Club</span>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClubs.map((club) => {
            const isMember = !!userMemberships[club.id];
            const isAdmin = userMemberships[club.id]?.role === 'admin';

            return (
              <Card
                key={club.id}
                className="group relative overflow-hidden rounded-2xl border-slate-200/80 bg-white hover:border-indigo-300 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
              >
                {/* Banner Gradient */}
                <div className="h-20 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-b border-slate-100 p-4 relative">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-indigo-700 shadow-sm border border-indigo-100">
                    {club.category}
                  </span>
                </div>

                <CardContent className="p-5 pt-0 -mt-7 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-end justify-between mb-3">
                      <Avatar className="h-14 w-14 rounded-2xl border-2 border-white shadow-md bg-white">
                        <AvatarImage src={club.logo_url} alt={club.name} />
                        <AvatarFallback className="bg-indigo-600 text-white font-black text-lg rounded-2xl">
                          {club.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      {isAdmin && (
                        <span className="flex items-center space-x-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          <Shield className="h-3 w-3" />
                          <span>Admin</span>
                        </span>
                      )}
                    </div>

                    <h3
                      onClick={() => handleOpenClub(club)}
                      className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors cursor-pointer text-base line-clamp-1"
                    >
                      {club.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                      {club.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-700">{club.member_count}</span> members
                      </span>
                      <button
                        onClick={() => handleOpenClub(club)}
                        className="text-indigo-600 font-semibold text-xs hover:underline flex items-center gap-0.5"
                      >
                        <span>Details</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant={isMember ? 'outline' : 'default'}
                        onClick={() => handleToggleJoin(club.id)}
                        className={`w-full text-xs font-bold rounded-xl h-9 transition-all ${
                          isMember
                            ? 'border-emerald-200 text-emerald-700 bg-emerald-50/50 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
                            : ''
                        }`}
                      >
                        {isMember ? (
                          <span className="flex items-center gap-1.5">
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Joined</span>
                          </span>
                        ) : (
                          'Join Club'
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Club Detail Modal */}
      <Modal open={!!selectedClub} onOpenChange={(open) => !open && setSelectedClub(null)}>
        {selectedClub && (
          <ModalContent className="max-w-2xl p-0 overflow-hidden">
            {/* Modal Cover */}
            <div className="h-28 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-800 p-6 relative flex items-end">
              <span className="absolute top-4 right-12 px-2.5 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-md">
                {selectedClub.category}
              </span>
            </div>

            <div className="px-6 pb-6 pt-0 -mt-10">
              <div className="flex items-end justify-between mb-4">
                <Avatar className="h-20 w-20 rounded-2xl border-4 border-white shadow-lg bg-white">
                  <AvatarImage src={selectedClub.logo_url} />
                  <AvatarFallback className="bg-indigo-600 text-white font-extrabold text-2xl rounded-2xl">
                    {selectedClub.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex gap-2">
                  {userMemberships[selectedClub.id]?.role === 'admin' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsCreateEventOpen(true)}
                      className="text-xs font-bold gap-1 rounded-xl"
                    >
                      <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Host Event</span>
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant={userMemberships[selectedClub.id] ? 'outline' : 'default'}
                    onClick={() => handleToggleJoin(selectedClub.id)}
                    className="text-xs font-bold rounded-xl"
                  >
                    {userMemberships[selectedClub.id] ? 'Leave Club' : 'Join Club'}
                  </Button>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-black text-slate-900">{selectedClub.name}</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {selectedClub.member_count} student members • Verified Campus Chapter
                </p>
              </div>

              {/* Sub-Tabs */}
              <div className="flex border-b border-slate-200 mt-5 mb-4">
                <button
                  onClick={() => setActiveClubTab('about')}
                  className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
                    activeClubTab === 'about'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  About
                </button>
                <button
                  onClick={() => setActiveClubTab('events')}
                  className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
                    activeClubTab === 'events'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Events ({clubEvents.length})
                </button>
                <button
                  onClick={() => setActiveClubTab('announcements')}
                  className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
                    activeClubTab === 'announcements'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Announcements ({clubAnnouncements.length})
                </button>
              </div>

              {/* Tab Contents */}
              {isLoadingClubSubData ? (
                <div className="py-8 flex justify-center">
                  <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" />
                </div>
              ) : activeClubTab === 'about' ? (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-700 leading-relaxed border border-slate-100">
                    {selectedClub.description}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="border border-slate-100 rounded-xl p-3 bg-white">
                      <span className="text-slate-400 block mb-1">Affiliation</span>
                      <span className="font-semibold text-slate-800">{college?.name || 'Verified Campus'}</span>
                    </div>
                    <div className="border border-slate-100 rounded-xl p-3 bg-white">
                      <span className="text-slate-400 block mb-1">Status</span>
                      <span className="font-semibold text-emerald-600">Active & Registered</span>
                    </div>
                  </div>
                </div>
              ) : activeClubTab === 'events' ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {clubEvents.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No upcoming events scheduled for this club yet.
                    </div>
                  ) : (
                    clubEvents.map((evt) => (
                      <div key={evt.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-xs text-slate-900">{evt.title}</p>
                          <p className="text-[11px] text-slate-500">
                            {new Date(evt.start_time).toLocaleDateString()} • {evt.venue}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md">
                          {evt.attendees_count} attending
                        </span>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {clubAnnouncements.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No announcements posted by this club yet.
                    </div>
                  ) : (
                    clubAnnouncements.map((ann) => (
                      <div key={ann.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                        <p className="font-bold text-xs text-slate-900">{ann.title}</p>
                        <p className="text-[11px] text-slate-600 mt-1">{ann.content}</p>
                        <p className="text-[10px] text-slate-400 mt-2">
                          {new Date(ann.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </ModalContent>
        )}
      </Modal>

      {/* Register Club Modal */}
      <Modal open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
        <ModalContent className="max-w-md">
          <ModalHeader>
            <ModalTitle>Register Campus Club</ModalTitle>
            <ModalDescription>
              Create an official student club or chapter. You will be assigned as Club Administrator.
            </ModalDescription>
          </ModalHeader>

          <form onSubmit={handleRegisterClub} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Club Name</label>
              <Input
                placeholder="e.g. AI & Robotics Society"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
              <select
                value={regCategory}
                onChange={(e) => setRegCategory(e.target.value)}
                className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {CLUB_CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Logo URL (Optional)</label>
              <Input
                placeholder="https://..."
                value={regLogoUrl}
                onChange={(e) => setRegLogoUrl(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Mission / Description</label>
              <Textarea
                placeholder="Describe your club's goals, activities, and who should join..."
                value={regDescription}
                onChange={(e) => setRegDescription(e.target.value)}
                rows={3}
                required
              />
            </div>

            <ModalFooter>
              <Button type="button" variant="outline" onClick={() => setIsRegisterOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="font-bold">
                {isSubmitting ? 'Registering...' : 'Register Club'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Host Event for Club Modal */}
      <Modal open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
        <ModalContent className="max-w-md">
          <ModalHeader>
            <ModalTitle>Host Club Event</ModalTitle>
            <ModalDescription>
              Schedule an event on behalf of {selectedClub?.name}.
            </ModalDescription>
          </ModalHeader>

          <form onSubmit={handleCreateClubEvent} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Event Title</label>
              <Input
                placeholder="e.g. Annual Tech Symposium 2026"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Date & Time</label>
              <Input
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Campus Venue / Room</label>
              <Input
                placeholder="e.g. Main Auditorium / Lab 304"
                value={eventVenue}
                onChange={(e) => setEventVenue(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Event Description</label>
              <Textarea
                placeholder="Agenda, prerequisites, what attendees should bring..."
                value={eventDesc}
                onChange={(e) => setEventDesc(e.target.value)}
                rows={3}
              />
            </div>

            <ModalFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateEventOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="font-bold">
                {isSubmitting ? 'Publishing...' : 'Publish Event'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
};
