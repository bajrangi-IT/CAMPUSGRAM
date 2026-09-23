import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Search,
  Users,
  MessageSquare,
  Building2,
  Calendar,
  BookOpen,
  Briefcase,
  Compass,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Card, CardContent } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { unifiedSearch, DiscoverResults } from '@/services/discoverService';
import { useAuth } from '@/contexts/AuthContext';
import { PostCard } from '@/components/social/PostCard';

type SearchTab = 'all' | 'students' | 'posts' | 'clubs' | 'events' | 'notes' | 'opportunities';

export const DiscoverPage: React.FC = () => {
  const { college } = useAuth();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [results, setResults] = useState<DiscoverResults>({
    students: [],
    posts: [],
    clubs: [],
    events: [],
    notes: [],
    opportunities: [],
  });
  const [isSearching, setIsSearching] = useState(false);

  // Debounce search input (350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  // Execute search
  useEffect(() => {
    async function execute() {
      if (!debouncedQuery) {
        setResults({
          students: [],
          posts: [],
          clubs: [],
          events: [],
          notes: [],
          opportunities: [],
        });
        return;
      }

      setIsSearching(true);
      const res = await unifiedSearch(debouncedQuery, college?.id);
      setResults(res);
      setIsSearching(false);
    }

    execute();
  }, [debouncedQuery, college?.id]);

  const tabs: { id: SearchTab; label: string; count?: number }[] = [
    { id: 'all', label: 'All Results' },
    { id: 'students', label: 'Students', count: results.students.length },
    { id: 'posts', label: 'Posts', count: results.posts.length },
    { id: 'clubs', label: 'Clubs', count: results.clubs.length },
    { id: 'events', label: 'Events', count: results.events.length },
    { id: 'notes', label: 'Notes', count: results.notes.length },
    { id: 'opportunities', label: 'Opportunities', count: results.opportunities.length },
  ];

  const totalResultsCount =
    results.students.length +
    results.posts.length +
    results.clubs.length +
    results.events.length +
    results.notes.length +
    results.opportunities.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Discover Campus</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Unified search across classmates, campus discussions, student clubs, and academic notes.
        </p>
      </div>

      {/* Unified Search Input */}
      <div className="relative">
        <Input
          type="search"
          placeholder="Search by student name, skill, club name, course code (e.g. CS101, Python, Robotics)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          leftIcon={<Search className="h-5 w-5 text-indigo-600" />}
          className="h-12 text-sm bg-white shadow-card rounded-2xl pl-11"
        />
      </div>

      {/* Category Tabs */}
      {debouncedQuery && (
        <div className="flex space-x-1.5 overflow-x-auto py-1 scrollbar-none border-b border-slate-200/80 pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/70'
              }`}
            >
              {tab.label} {tab.count !== undefined && tab.count > 0 && `(${tab.count})`}
            </button>
          ))}
        </div>
      )}

      {/* Results or Exploration State */}
      {!debouncedQuery ? (
        <div className="space-y-6">
          <EmptyState
            icon={Compass}
            title="Explore your verified campus network"
            description="Type a classmate's name, club category, subject note, or project keyword in the search bar above."
          />

          {/* Quick suggestions */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Popular Campus Topics
            </h3>
            <div className="flex flex-wrap gap-2">
              {[
                'Hackathons',
                'Data Structures',
                'AI / ML Club',
                'Robotics Society',
                'Internship 2026',
                'Campus Fest',
              ].map((topic) => (
                <button
                  key={topic}
                  onClick={() => setQuery(topic)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-colors"
                >
                  #{topic}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : isSearching ? (
        <div className="text-center py-12 text-xs text-slate-400">
          Searching campus network...
        </div>
      ) : totalResultsCount === 0 ? (
        <EmptyState
          icon={Search}
          title={`No results found for "${debouncedQuery}"`}
          description="Try checking for typos or searching with broader keywords."
        />
      ) : (
        <div className="space-y-6">
          {/* STUDENTS SECTION */}
          {(activeTab === 'all' || activeTab === 'students') && results.students.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Users className="h-4 w-4 text-indigo-600" />
                <span>Students ({results.students.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {results.students.map((student) => (
                  <NavLink
                    key={student.id}
                    to={`/profile/${student.username}`}
                    className="flex items-center space-x-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-subtle hover:shadow-card hover:border-indigo-200 transition-all group"
                  >
                    <Avatar className="h-11 w-11 shrink-0 ring-1 ring-slate-100">
                      <AvatarImage src={student.profile_photo || ''} />
                      <AvatarFallback className="text-xs font-bold">
                        {student.full_name ? student.full_name.substring(0, 2).toUpperCase() : 'CG'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                        {student.full_name}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate">
                        @{student.username}
                        {student.branch && ` • ${student.branch}`}
                      </p>
                    </div>
                  </NavLink>
                ))}
              </div>
            </div>
          )}

          {/* POSTS SECTION */}
          {(activeTab === 'all' || activeTab === 'posts') && results.posts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-indigo-600" />
                <span>Posts ({results.posts.length})</span>
              </h3>
              <div className="space-y-3">
                {results.posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </div>
          )}

          {/* CLUBS SECTION */}
          {(activeTab === 'all' || activeTab === 'clubs') && results.clubs.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-indigo-600" />
                <span>Clubs ({results.clubs.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {results.clubs.map((club) => (
                  <NavLink
                    key={club.id}
                    to="/campus/clubs"
                    className="block rounded-2xl border border-slate-200/80 bg-white p-4 shadow-subtle hover:border-indigo-200 transition-all"
                  >
                    <h4 className="text-xs font-bold text-slate-900">{club.name}</h4>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      {club.description || 'Campus student club'}
                    </p>
                  </NavLink>
                ))}
              </div>
            </div>
          )}

          {/* EVENTS SECTION */}
          {(activeTab === 'all' || activeTab === 'events') && results.events.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-indigo-600" />
                <span>Events ({results.events.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {results.events.map((ev) => (
                  <NavLink
                    key={ev.id}
                    to="/campus/events"
                    className="block rounded-2xl border border-slate-200/80 bg-white p-4 shadow-subtle hover:border-indigo-200 transition-all"
                  >
                    <h4 className="text-xs font-bold text-slate-900">{ev.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-1">Location: {ev.location}</p>
                  </NavLink>
                ))}
              </div>
            </div>
          )}

          {/* NOTES SECTION */}
          {(activeTab === 'all' || activeTab === 'notes') && results.notes.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-indigo-600" />
                <span>Notes & Resources ({results.notes.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {results.notes.map((note) => (
                  <NavLink
                    key={note.id}
                    to="/campus/notes"
                    className="block rounded-2xl border border-slate-200/80 bg-white p-4 shadow-subtle hover:border-indigo-200 transition-all"
                  >
                    <h4 className="text-xs font-bold text-slate-900">{note.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Subject: {note.subject}</p>
                  </NavLink>
                ))}
              </div>
            </div>
          )}

          {/* OPPORTUNITIES SECTION */}
          {(activeTab === 'all' || activeTab === 'opportunities') && results.opportunities.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Briefcase className="h-4 w-4 text-indigo-600" />
                <span>Opportunities ({results.opportunities.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {results.opportunities.map((opp) => (
                  <NavLink
                    key={opp.id}
                    to="/campus/opportunities"
                    className="block rounded-2xl border border-slate-200/80 bg-white p-4 shadow-subtle hover:border-indigo-200 transition-all"
                  >
                    <h4 className="text-xs font-bold text-slate-900">{opp.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{opp.organization}</p>
                  </NavLink>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
