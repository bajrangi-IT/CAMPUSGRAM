import React, { useState, useEffect } from 'react';
import {
  Calendar,
  PlusCircle,
  Search,
  MapPin,
  Clock,
  Users,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Share2,
  CalendarCheck,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Loader2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { campusService } from '@/services/campusService';
import type { EventItem, EventCheckin, Club } from '@/types/campus.types';
import { toast } from 'sonner';

export const EventsPage: React.FC = () => {
  const { user, college } = useAuth();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'registered' | 'past'>('upcoming');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Host Event Modal
  const [isHostOpen, setIsHostOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [selectedClubId, setSelectedClubId] = useState('');
  const [venue, setVenue] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [capacity, setCapacity] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // QR Code & Attendance Checkin Modals
  const [selectedEventForQR, setSelectedEventForQR] = useState<EventItem | null>(null);
  const [checkinEvent, setCheckinEvent] = useState<EventItem | null>(null);
  const [checkinTokenInput, setCheckinTokenInput] = useState('');
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkinLogs, setCheckinLogs] = useState<EventCheckin[]>([]);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const data = await campusService.getEvents(activeTab, user?.id);
      setEvents(data);
    } catch (err: any) {
      toast.error('Failed to load campus events', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const loadClubs = async () => {
    try {
      const clubData = await campusService.getClubs();
      setClubs(clubData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [activeTab, user?.id]);

  useEffect(() => {
    loadClubs();
  }, []);

  const handleRegisterToggle = async (event: EventItem) => {
    if (!user) {
      toast.error('Please log in to RSVP for events');
      return;
    }

    try {
      if (event.is_registered) {
        await campusService.cancelEventRegistration(event.id, user.id);
        toast.info('RSVP cancelled');
      } else {
        await campusService.registerForEvent(event.id, user.id);
        toast.success('Successfully registered for event! See you there.');
      }
      loadEvents();
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    }
  };

  const handleHostEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !college) return;
    if (!title.trim() || !venue.trim() || !startTime) {
      toast.error('Please fill required event details');
      return;
    }

    setIsSubmitting(true);
    try {
      await campusService.createEvent({
        college_id: college.id,
        club_id: selectedClubId || undefined,
        title: title.trim(),
        description: description.trim(),
        venue: venue.trim(),
        start_time: new Date(startTime).toISOString(),
        end_time: endTime ? new Date(endTime).toISOString() : undefined,
        max_capacity: capacity ? parseInt(capacity, 10) : undefined,
        created_by: user.id,
      });

      toast.success('Campus event published with QR Check-in code!');
      setIsHostOpen(false);
      setTitle('');
      setSelectedClubId('');
      setVenue('');
      setStartTime('');
      setEndTime('');
      setCapacity('');
      setDescription('');
      loadEvents();
    } catch (err: any) {
      toast.error(err.message || 'Failed to host event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenQRModal = async (event: EventItem) => {
    setSelectedEventForQR(event);
    try {
      const logs = await campusService.getEventCheckins(event.id);
      setCheckinLogs(logs);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePerformCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkinEvent || !user) return;
    if (!checkinTokenInput.trim()) {
      toast.error('Please enter the 6-digit or QR check-in code');
      return;
    }

    setIsCheckingIn(true);
    try {
      const res = await campusService.checkinStudentToEvent(
        checkinEvent.id,
        user.id,
        checkinTokenInput.trim().toUpperCase()
      );

      if (res.success) {
        toast.success(res.message);
        setCheckinEvent(null);
        setCheckinTokenInput('');
        loadEvents();
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(err.message || 'Check-in validation error');
    } finally {
      setIsCheckingIn(false);
    }
  };

  const filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    (e.venue || e.location || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.description && e.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-amber-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Calendar className="h-4 w-4" />
            <span>Campus Schedule & Attendance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Campus Events</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse hackathons, guest lectures, club sessions, and verify attendance via QR check-in.
          </p>
        </div>
        <Button
          onClick={() => setIsHostOpen(true)}
          className="gap-2 font-bold text-xs sm:text-sm h-10 shrink-0 shadow-sm rounded-xl"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Host Event</span>
        </Button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl w-fit border border-slate-200/60">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'upcoming'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveTab('registered')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'registered'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My RSVPs
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'past'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Past Events
          </button>
        </div>

        <div className="w-full sm:w-72">
          <Input
            type="search"
            placeholder="Search events or venues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4 text-slate-400" />}
            className="bg-white"
          />
        </div>
      </div>

      {/* Events List / Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-white border border-slate-100 p-5 animate-pulse space-y-4">
              <div className="h-32 bg-slate-200 rounded-xl" />
              <div className="h-4 w-2/3 bg-slate-200 rounded" />
              <div className="h-4 w-1/3 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={
            activeTab === 'registered'
              ? 'You have not registered for any events yet'
              : 'No campus events found'
          }
          description={
            activeTab === 'registered'
              ? 'Browse the Upcoming tab to discover workshops, competitions, and seminars.'
              : 'Host a workshop, study group, or social gathering to engage students.'
          }
          action={
            <Button onClick={() => setIsHostOpen(true)} className="gap-2 font-bold text-xs rounded-xl">
              <PlusCircle className="h-4 w-4" />
              <span>Host the First Event</span>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map((evt) => {
            const eventDate = new Date(evt.start_time);
            const isOrganizer = user?.id === evt.created_by;

            return (
              <Card
                key={evt.id}
                className="group overflow-hidden rounded-2xl border-slate-200/80 bg-white hover:border-amber-300 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Event Banner */}
                  <div className="h-36 bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-800 p-4 relative flex flex-col justify-between text-white">
                    <div className="flex justify-between items-start">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md">
                        {evt.club?.name || 'Campus Wide'}
                      </span>

                      {evt.is_registered && (
                        <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/90 text-white shadow-sm">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Registered</span>
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="text-xl font-black tracking-tight line-clamp-1">{evt.title}</div>
                      <div className="flex items-center gap-2 text-xs text-slate-300 mt-1">
                        <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">{evt.venue}</span>
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          {eventDate.toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          • {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-bold text-slate-700">{evt.attendees_count}</span>
                        {evt.max_capacity ? `/${evt.max_capacity}` : ''}
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {evt.description || 'No description provided for this campus event.'}
                    </p>
                  </CardContent>
                </div>

                {/* Card Actions */}
                <div className="p-4 pt-0 border-t border-slate-100 space-y-2">
                  <div className="flex gap-2">
                    <Button
                      variant={evt.is_registered ? 'outline' : 'default'}
                      onClick={() => handleRegisterToggle(evt)}
                      className={`flex-1 text-xs font-bold rounded-xl h-9 transition-all ${
                        evt.is_registered
                          ? 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
                          : 'bg-amber-600 hover:bg-amber-700 text-white'
                      }`}
                    >
                      {evt.is_registered ? 'Cancel RSVP' : 'Register / RSVP'}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => handleOpenQRModal(evt)}
                      title="View Event Attendance QR Code"
                      className="text-xs font-bold rounded-xl h-9 px-3 gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-100"
                    >
                      <QrCode className="h-4 w-4 text-indigo-600" />
                      <span>QR</span>
                    </Button>
                  </div>

                  {evt.is_registered && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setCheckinEvent(evt);
                        setCheckinTokenInput(evt.qr_code_token || '');
                      }}
                      className="w-full text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50 h-8 rounded-lg"
                    >
                      <span>Check in with Secret Token</span>
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* QR Code Presentation Modal */}
      <Modal open={!!selectedEventForQR} onOpenChange={(open) => !open && setSelectedEventForQR(null)}>
        {selectedEventForQR && (
          <ModalContent className="max-w-sm text-center">
            <ModalHeader>
              <ModalTitle className="text-center">Event QR Check-in</ModalTitle>
              <ModalDescription className="text-center">
                Scan or enter the official token at the door to verify student attendance.
              </ModalDescription>
            </ModalHeader>

            <div className="py-4 flex flex-col items-center space-y-4">
              {/* High-Contrast Crisp QR Graphic */}
              <div className="p-4 bg-white border-2 border-indigo-200 rounded-2xl shadow-inner inline-block">
                <svg
                  className="w-48 h-48 mx-auto"
                  viewBox="0 0 100 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Standard QR Corners & Data blocks */}
                  <rect x="0" y="0" width="100" height="100" fill="white" />
                  <rect x="10" y="10" width="24" height="24" fill="#0f172a" rx="2" />
                  <rect x="14" y="14" width="16" height="16" fill="white" rx="1" />
                  <rect x="18" y="18" width="8" height="8" fill="#0f172a" />

                  <rect x="66" y="10" width="24" height="24" fill="#0f172a" rx="2" />
                  <rect x="70" y="14" width="16" height="16" fill="white" rx="1" />
                  <rect x="74" y="18" width="8" height="8" fill="#0f172a" />

                  <rect x="10" y="66" width="24" height="24" fill="#0f172a" rx="2" />
                  <rect x="14" y="70" width="16" height="16" fill="white" rx="1" />
                  <rect x="18" y="74" width="8" height="8" fill="#0f172a" />

                  {/* QR Matrix Bits */}
                  <rect x="42" y="12" width="6" height="6" fill="#4f46e5" />
                  <rect x="52" y="18" width="6" height="6" fill="#0f172a" />
                  <rect x="42" y="28" width="6" height="6" fill="#0f172a" />
                  <rect x="20" y="42" width="6" height="6" fill="#0f172a" />
                  <rect x="32" y="42" width="6" height="6" fill="#4f46e5" />
                  <rect x="48" y="42" width="6" height="6" fill="#0f172a" />
                  <rect x="62" y="42" width="6" height="6" fill="#4f46e5" />
                  <rect x="76" y="42" width="6" height="6" fill="#0f172a" />
                  <rect x="42" y="56" width="6" height="6" fill="#0f172a" />
                  <rect x="56" y="56" width="6" height="6" fill="#0f172a" />
                  <rect x="72" y="56" width="6" height="6" fill="#4f46e5" />
                  <rect x="42" y="70" width="6" height="6" fill="#4f46e5" />
                  <rect x="56" y="70" width="6" height="6" fill="#0f172a" />
                  <rect x="72" y="70" width="6" height="6" fill="#0f172a" />
                  <rect x="48" y="82" width="6" height="6" fill="#0f172a" />
                  <rect x="62" y="82" width="6" height="6" fill="#0f172a" />
                </svg>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 w-full">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Event Check-in Token
                </span>
                <span className="text-xl font-mono font-black text-indigo-700 tracking-widest select-all">
                  {selectedEventForQR.qr_code_token || 'CAMPUS2026'}
                </span>
              </div>

              <p className="text-[11px] text-slate-500 leading-normal">
                Prevents duplicate entries automatically. Once checked in, a student's attendance record is locked.
              </p>
            </div>

            <ModalFooter className="sm:justify-center">
              <Button
                variant="outline"
                onClick={() => setSelectedEventForQR(null)}
                className="w-full text-xs font-bold rounded-xl"
              >
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        )}
      </Modal>

      {/* Student Check-in Token Input Modal */}
      <Modal open={!!checkinEvent} onOpenChange={(open) => !open && setCheckinEvent(null)}>
        {checkinEvent && (
          <ModalContent className="max-w-md">
            <ModalHeader>
              <ModalTitle>Verify Attendance</ModalTitle>
              <ModalDescription>
                Enter the check-in code announced or displayed by the event organizers for {checkinEvent.title}.
              </ModalDescription>
            </ModalHeader>

            <form onSubmit={handlePerformCheckin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Check-in Code</label>
                <Input
                  placeholder="e.g. EVT-ABCD12"
                  value={checkinTokenInput}
                  onChange={(e) => setCheckinTokenInput(e.target.value)}
                  className="font-mono uppercase tracking-wider"
                  required
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  Anti-Fraud System: Attendance tokens are verified against your student ID. Duplicate check-ins will be rejected.
                </span>
              </div>

              <ModalFooter>
                <Button type="button" variant="outline" onClick={() => setCheckinEvent(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCheckingIn} className="font-bold">
                  {isCheckingIn ? 'Verifying...' : 'Confirm Check-in'}
                </Button>
              </ModalFooter>
            </form>
          </ModalContent>
        )}
      </Modal>

      {/* Host Event Modal */}
      <Modal open={isHostOpen} onOpenChange={setIsHostOpen}>
        <ModalContent className="max-w-lg">
          <ModalHeader>
            <ModalTitle>Host a Campus Event</ModalTitle>
            <ModalDescription>
              Schedule an academic talk, club meet, competition, or social gathering.
            </ModalDescription>
          </ModalHeader>

          <form onSubmit={handleHostEvent} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Event Title</label>
              <Input
                placeholder="e.g. HackSprint 2026: Campus 24h Hackathon"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Host Club (Optional)</label>
                <select
                  value={selectedClubId}
                  onChange={(e) => setSelectedClubId(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Campus Wide (General)</option>
                  {clubs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Max Capacity (Seats)</label>
                <Input
                  type="number"
                  placeholder="e.g. 150 (Leave blank for unlimited)"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  min="1"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Campus Venue / Room</label>
              <Input
                placeholder="e.g. Seminar Hall B, Tech Block or Zoom link"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Start Date & Time</label>
                <Input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">End Date & Time (Optional)</label>
                <Input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Description & Agenda</label>
              <Textarea
                placeholder="Keynote speakers, timeline, prerequisites, and swag details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <ModalFooter>
              <Button type="button" variant="outline" onClick={() => setIsHostOpen(false)}>
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
