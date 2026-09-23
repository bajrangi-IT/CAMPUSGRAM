import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Calendar,
  Megaphone,
  Users,
  Compass,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export const SidebarRight: React.FC = () => {
  const { college } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSidebarContext() {
      if (!isSupabaseConfigured) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch up to 3 upcoming events
        const { data: eventsData } = await supabase
          .from('events')
          .select('id, title, start_time, location')
          .eq('status', 'upcoming')
          .order('start_time', { ascending: true })
          .limit(3);

        if (eventsData) setEvents(eventsData);

        // Fetch up to 2 announcements
        const { data: annData } = await supabase
          .from('announcements')
          .select('id, title, priority, created_at')
          .order('created_at', { ascending: false })
          .limit(2);

        if (annData) setAnnouncements(annData);

        // Fetch up to 3 clubs
        const { data: clubsData } = await supabase
          .from('clubs')
          .select('id, name, category, logo')
          .limit(3);

        if (clubsData) setClubs(clubsData);
      } catch (err) {
        console.warn('Sidebar data fetch:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSidebarContext();
  }, []);

  return (
    <aside className="sticky top-0 hidden h-screen w-80 flex-col space-y-4 overflow-y-auto px-4 py-5 xl:flex select-none">
      {/* Campus Identity Badge */}
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 via-white to-indigo-50/30 p-4 shadow-subtle">
        <div className="flex items-center space-x-2 text-indigo-700">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wide">
            Private Campus Access
          </span>
        </div>
        <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
          You are connected to the official{' '}
          <strong className="text-slate-900 font-semibold">
            {college?.name || 'Campus'}
          </strong>{' '}
          network. Only verified campus members can view and interact here.
        </p>
      </div>

      {/* College Announcements */}
      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-4">
          <div className="flex items-center space-x-2">
            <Megaphone className="h-4 w-4 text-indigo-600" />
            <CardTitle className="text-sm font-bold">Announcements</CardTitle>
          </div>
          <NavLink
            to="/campus/announcements"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5"
          >
            All <ArrowRight className="h-3 w-3" />
          </NavLink>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {announcements.length === 0 ? (
            <EmptyState
              compact
              icon={Megaphone}
              title="No announcements"
              description="Important notices from campus administration and departments will appear here."
            />
          ) : (
            <div className="space-y-2.5">
              {announcements.map((ann) => (
                <NavLink
                  key={ann.id}
                  to={`/campus/announcements`}
                  className="block rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 hover:bg-slate-100/60 transition-colors"
                >
                  <p className="text-xs font-bold text-slate-800 line-clamp-1">{ann.title}</p>
                  <span className="mt-1 inline-block text-[10px] font-medium text-slate-400">
                    {new Date(ann.created_at).toLocaleDateString()}
                  </span>
                </NavLink>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Campus Events */}
      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-indigo-600" />
            <CardTitle className="text-sm font-bold">Upcoming Events</CardTitle>
          </div>
          <NavLink
            to="/campus/events"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5"
          >
            Explore <ArrowRight className="h-3 w-3" />
          </NavLink>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {events.length === 0 ? (
            <EmptyState
              compact
              icon={Calendar}
              title="No upcoming events"
              description="Campus fests, workshops, hackathons, and webinars will appear once scheduled."
            />
          ) : (
            <div className="space-y-2.5">
              {events.map((ev) => (
                <NavLink
                  key={ev.id}
                  to="/campus/events"
                  className="block rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 hover:bg-slate-100/60 transition-colors"
                >
                  <p className="text-xs font-bold text-slate-800 line-clamp-1">{ev.title}</p>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{new Date(ev.start_time).toLocaleDateString()}</span>
                    <span className="truncate max-w-[120px]">{ev.location}</span>
                  </div>
                </NavLink>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Campus Clubs & Chapters */}
      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-4">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-indigo-600" />
            <CardTitle className="text-sm font-bold">Campus Clubs</CardTitle>
          </div>
          <NavLink
            to="/campus/clubs"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5"
          >
            Browse <ArrowRight className="h-3 w-3" />
          </NavLink>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {clubs.length === 0 ? (
            <EmptyState
              compact
              icon={Users}
              title="No active clubs registered yet"
              description="Student societies, cultural clubs, and technical bodies will appear here."
            />
          ) : (
            <div className="space-y-2">
              {clubs.map((club) => (
                <div
                  key={club.id}
                  className="flex items-center justify-between rounded-xl p-2 hover:bg-slate-50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-800">{club.name}</p>
                    <p className="truncate text-[10px] text-slate-400 capitalize">{club.category}</p>
                  </div>
                  <NavLink to="/campus/clubs">
                    <Button variant="outline" size="sm" className="h-7 text-[11px] px-2.5">
                      View
                    </Button>
                  </NavLink>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Helpful Campus Quick Links Footer */}
      <div className="px-3 pt-2 text-[11px] text-slate-400 space-y-1">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <NavLink to="/settings/privacy" className="hover:text-slate-600 transition-colors">
            Privacy Policy
          </NavLink>
          <span>•</span>
          <NavLink to="/settings" className="hover:text-slate-600 transition-colors">
            Guidelines
          </NavLink>
          <span>•</span>
          <NavLink to="/campus/notes" className="hover:text-slate-600 transition-colors">
            Student Resources
          </NavLink>
        </div>
        <p className="pt-2 text-[10px] text-slate-400">
          CampusGram © {new Date().getFullYear()} • Verified Campus Platform
        </p>
      </div>
    </aside>
  );
};
