import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Building2,
  GraduationCap,
  Calendar,
  Edit3,
  Share2,
  ShieldCheck,
  BookOpen,
  MessageSquare,
  Users,
  Award,
  Bookmark,
  UserPlus,
  UserCheck,
  Send,
  MoreHorizontal,
  ShieldAlert,
  Ban,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/Dropdown';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Profile } from '@/types/database.types';
import { Post } from '@/types/social.types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  checkIsFollowing,
  getFollowStats,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
} from '@/services/followService';
import { createDirectConversation } from '@/services/messagesService';
import { blockUser } from '@/services/safetyService';
import { PostCard } from '@/components/social/PostCard';
import { FollowListModal } from '@/components/social/FollowListModal';
import { ReportModal } from '@/components/social/ReportModal';
import { toast } from 'sonner';

export const ProfilePage: React.FC = () => {
  const { username: paramUsername } = useParams<{ username?: string }>();
  const { user, profile: myProfile, college: myCollege, updateProfile } = useAuth();
  const navigate = useNavigate();

  const isOwnProfile = !paramUsername || paramUsername === myProfile?.username;

  const [targetProfile, setTargetProfile] = useState<Profile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(!isOwnProfile);

  // Follow states
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  // Follower/Following Modals
  const [modalTitle, setModalTitle] = useState('');
  const [modalUsersList, setModalUsersList] = useState<Profile[]>([]);
  const [isFollowModalOpen, setIsFollowModalOpen] = useState(false);

  // Safety Modals
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Content Tabs
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);

  // Edit Profile Modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [bio, setBio] = useState('');
  const [course, setCourse] = useState('');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [coverPhoto, setCoverPhoto] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [newInterest, setNewInterest] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const activeProfile = isOwnProfile ? myProfile : targetProfile;
  const activeCollege = isOwnProfile ? myCollege : (targetProfile as any)?.college;

  // Load Profile Details
  useEffect(() => {
    async function loadData() {
      if (isOwnProfile) {
        if (myProfile) {
          const stats = await getFollowStats(myProfile.id);
          setFollowersCount(stats.followersCount);
          setFollowingCount(stats.followingCount);
          loadPosts(myProfile.id);
          loadSavedPosts(myProfile.id);
        }
      } else if (paramUsername && isSupabaseConfigured) {
        setIsLoadingProfile(true);
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*, college:colleges(*)')
            .eq('username', paramUsername)
            .single();

          if (error || !data) {
            toast.error('Student profile not found');
            navigate('/discover');
            return;
          }

          setTargetProfile(data as Profile);

          const stats = await getFollowStats(data.id);
          setFollowersCount(stats.followersCount);
          setFollowingCount(stats.followingCount);

          if (user) {
            const following = await checkIsFollowing(user.id, data.id);
            setIsFollowing(following);
          }

          loadPosts(data.id);
        } catch {
          toast.error('Failed to load profile');
        } finally {
          setIsLoadingProfile(false);
        }
      }
    }

    loadData();
  }, [isOwnProfile, paramUsername, myProfile?.id, user?.id]);

  const loadPosts = async (userId: string) => {
    if (!isSupabaseConfigured) return;
    setIsLoadingPosts(true);
    try {
      const { data } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles!posts_author_id_fkey(
            id, full_name, username, profile_photo, course, year, branch
          )
        `)
        .eq('author_id', userId)
        .order('created_at', { ascending: false });

      setUserPosts((data || []) as Post[]);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const loadSavedPosts = async (userId: string) => {
    if (!isSupabaseConfigured) return;
    try {
      const { data } = await supabase
        .from('saves')
        .select(`
          post:posts(
            *,
            author:profiles!posts_author_id_fkey(
              id, full_name, username, profile_photo, course, year, branch
            )
          )
        `)
        .eq('user_id', userId);

      const saved = (data || []).map((row: any) => row.post).filter(Boolean);
      setSavedPosts(saved as Post[]);
    } catch {}
  };

  // Follow / Unfollow Toggle
  const handleToggleFollow = async () => {
    if (!user || !activeProfile) return;
    setIsFollowLoading(true);

    try {
      if (isFollowing) {
        await unfollowUser(user.id, activeProfile.id);
        setIsFollowing(false);
        setFollowersCount((prev) => Math.max(0, prev - 1));
        toast.success(`Unfollowed @${activeProfile.username}`);
      } else {
        await followUser(user.id, activeProfile.id);
        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
        toast.success(`Following @${activeProfile.username}!`);
      }
    } catch {
      toast.error('Action failed.');
    } finally {
      setIsFollowLoading(false);
    }
  };

  // Direct Message Trigger
  const handleStartMessage = async () => {
    if (!user || !activeProfile) return;
    try {
      const { conversationId, error } = await createDirectConversation(user.id, activeProfile.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      navigate('/messages', { state: { openConversationId: conversationId } });
    } catch {
      toast.error('Failed to initiate conversation.');
    }
  };

  // Block User Trigger
  const handleBlockUser = async () => {
    if (!user || !activeProfile) return;
    if (!window.confirm(`Are you sure you want to block @${activeProfile.username}?`)) return;

    try {
      const { success } = await blockUser(user.id, activeProfile.id);
      if (success) {
        toast.success(`Blocked @${activeProfile.username}.`);
        navigate('/discover');
      }
    } catch {
      toast.error('Failed to block user.');
    }
  };

  // Show Followers Modal
  const handleOpenFollowers = async () => {
    if (!activeProfile) return;
    const list = await getFollowers(activeProfile.id);
    setModalUsersList(list);
    setModalTitle(`Followers of @${activeProfile.username}`);
    setIsFollowModalOpen(true);
  };

  // Show Following Modal
  const handleOpenFollowing = async () => {
    if (!activeProfile) return;
    const list = await getFollowing(activeProfile.id);
    setModalUsersList(list);
    setModalTitle(`@${activeProfile.username} is Following`);
    setIsFollowModalOpen(true);
  };

  // Edit Profile
  const handleOpenEdit = () => {
    if (!myProfile) return;
    setFullName(myProfile.full_name || '');
    setEditUsername(myProfile.username || '');
    setBio(myProfile.bio || '');
    setCourse(myProfile.course || '');
    setBranch(myProfile.branch || '');
    setYear(myProfile.year || '');
    setProfilePhoto(myProfile.profile_photo || '');
    setCoverPhoto(myProfile.cover_photo || '');
    setSkills(myProfile.skills || []);
    setInterests(myProfile.interests || []);
    setIsEditOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { error } = await updateProfile({
        full_name: fullName.trim(),
        username: editUsername.trim().toLowerCase(),
        bio: bio.trim(),
        course: course.trim(),
        branch: branch.trim(),
        year: year.trim(),
        profile_photo: profilePhoto.trim() || null,
        cover_photo: coverPhoto.trim() || null,
        skills,
        interests,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Profile updated successfully!');
      setIsEditOpen(false);
    } catch {
      toast.error('Failed to save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="text-center py-20 text-xs text-slate-400">
        Loading student profile...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Profile Card */}
      <Card className="overflow-hidden rounded-2xl border-slate-200/80 shadow-card bg-white">
        {/* Cover Photo */}
        <div
          className="h-36 sm:h-48 w-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-800 relative"
          style={
            activeProfile?.cover_photo
              ? {
                  backgroundImage: `url(${activeProfile.cover_photo})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : undefined
          }
        >
          <div className="absolute inset-0 bg-black/10" />
        </div>

        {/* Profile Info Header */}
        <div className="relative px-6 pb-6 pt-0">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-16 sm:-mt-20 gap-4 mb-4">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="h-28 w-28 sm:h-32 sm:w-32 ring-4 ring-white shadow-md">
                <AvatarImage src={activeProfile?.profile_photo || ''} />
                <AvatarFallback className="text-2xl font-black">
                  {activeProfile?.full_name
                    ? activeProfile.full_name.substring(0, 2).toUpperCase()
                    : 'CG'}
                </AvatarFallback>
              </Avatar>
              <div
                className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white ring-2 ring-white"
                title="Verified Student Account"
              >
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 self-start sm:self-end">
              {isOwnProfile ? (
                <>
                  <Button
                    size="sm"
                    onClick={handleOpenEdit}
                    className="gap-1.5 font-bold text-xs h-9 px-4 rounded-xl"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Edit Profile</span>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant={isFollowing ? 'outline' : 'default'}
                    onClick={handleToggleFollow}
                    isLoading={isFollowLoading}
                    className="gap-1.5 font-bold text-xs h-9 px-4 rounded-xl"
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="h-4 w-4 text-emerald-600" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        <span>Follow</span>
                      </>
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleStartMessage}
                    className="gap-1.5 font-bold text-xs h-9 px-3 rounded-xl"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Message</span>
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger className="rounded-xl p-2 border border-slate-200 text-slate-500 hover:bg-slate-50 focus:outline-none">
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36 text-xs">
                      <DropdownMenuItem
                        onClick={() => setIsReportOpen(true)}
                        className="text-rose-600 focus:text-rose-600"
                      >
                        <ShieldAlert className="mr-2 h-3.5 w-3.5" />
                        <span>Report User</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleBlockUser}
                        className="text-rose-600 focus:text-rose-600"
                      >
                        <Ban className="mr-2 h-3.5 w-3.5" />
                        <span>Block User</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          </div>

          {/* User Details */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {activeProfile?.full_name || 'Campus Student'}
              </h1>
              <span className="text-sm font-semibold text-indigo-600">
                @{activeProfile?.username || 'user'}
              </span>
              <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700">
                Student
              </span>
            </div>

            {/* Academic Credentials */}
            <div className="mt-2.5 flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1.5 text-slate-700">
                <Building2 className="h-4 w-4 text-indigo-600" />
                <span>{activeCollege?.name || 'Verified Campus'}</span>
              </div>
              {(activeProfile?.course || activeProfile?.branch) && (
                <div className="flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4 text-slate-400" />
                  <span>
                    {[activeProfile?.course, activeProfile?.branch].filter(Boolean).join(' • ')}
                  </span>
                </div>
              )}
              {activeProfile?.year && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>{activeProfile.year}</span>
                </div>
              )}
            </div>

            {/* Bio */}
            {activeProfile?.bio ? (
              <p className="mt-3 text-sm text-slate-600 leading-relaxed max-w-2xl">
                {activeProfile.bio}
              </p>
            ) : (
              <p className="mt-3 text-xs italic text-slate-400">
                No bio added yet.
              </p>
            )}

            {/* Followers & Following Counts (Interactive) */}
            <div className="mt-4 flex items-center space-x-6 text-xs">
              <button
                onClick={handleOpenFollowers}
                className="hover:underline text-slate-700 font-medium"
              >
                <strong className="text-slate-900 font-black mr-1">{followersCount}</strong>
                Followers
              </button>
              <button
                onClick={handleOpenFollowing}
                className="hover:underline text-slate-700 font-medium"
              >
                <strong className="text-slate-900 font-black mr-1">{followingCount}</strong>
                Following
              </button>
            </div>

            {/* Skills Pills */}
            {activeProfile?.skills && activeProfile.skills.length > 0 && (
              <div className="mt-4">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Skills & Expertise
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {activeProfile.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Interests Pills */}
            {activeProfile?.interests && activeProfile.interests.length > 0 && (
              <div className="mt-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Campus Interests
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {activeProfile.interests.map((interest) => (
                    <span
                      key={interest}
                      className="rounded-lg bg-indigo-50/70 border border-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs for Posts, Saved, Achievements, Clubs */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="w-full justify-start border-b border-slate-200/80 bg-transparent p-0 rounded-none h-auto">
          <TabsTrigger
            value="posts"
            className="rounded-none border-b-2 border-transparent py-3 px-4 text-xs font-bold data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:text-indigo-600 shadow-none"
          >
            Posts ({userPosts.length})
          </TabsTrigger>
          {isOwnProfile && (
            <TabsTrigger
              value="saved"
              className="rounded-none border-b-2 border-transparent py-3 px-4 text-xs font-bold data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:text-indigo-600 shadow-none"
            >
              Saved ({savedPosts.length})
            </TabsTrigger>
          )}
          <TabsTrigger
            value="achievements"
            className="rounded-none border-b-2 border-transparent py-3 px-4 text-xs font-bold data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:text-indigo-600 shadow-none"
          >
            Achievements
          </TabsTrigger>
          <TabsTrigger
            value="clubs"
            className="rounded-none border-b-2 border-transparent py-3 px-4 text-xs font-bold data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:text-indigo-600 shadow-none"
          >
            Clubs
          </TabsTrigger>
        </TabsList>

        {/* Posts Tab */}
        <TabsContent value="posts" className="pt-2 space-y-4">
          {isLoadingPosts ? (
            <div className="text-center py-8 text-xs text-slate-400">Loading posts...</div>
          ) : userPosts.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No posts published yet"
              description="Updates and discussions shared will appear here."
            />
          ) : (
            userPosts.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                onPostDeleted={(id) => setUserPosts((prev) => prev.filter((x) => x.id !== id))}
              />
            ))
          )}
        </TabsContent>

        {/* Saved Tab */}
        {isOwnProfile && (
          <TabsContent value="saved" className="pt-2 space-y-4">
            {savedPosts.length === 0 ? (
              <EmptyState
                icon={Bookmark}
                title="No saved posts"
                description="Save helpful study guides, discussions, or opportunities to revisit them later."
              />
            ) : (
              savedPosts.map((p) => <PostCard key={p.id} post={p} />)
            )}
          </TabsContent>
        )}

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-card flex items-center space-x-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Verified Campus Citizen</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Authenticated institutional email & phone security verification passed.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card flex items-center space-x-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Early Campus Pioneer</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Founding member of {activeCollege?.name || 'the campus network'}.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Clubs Tab */}
        <TabsContent value="clubs" className="pt-2">
          <EmptyState
            icon={Users}
            title="No club memberships"
            description="Student societies and chapters joined will be listed here."
          />
        </TabsContent>
      </Tabs>

      {/* Followers / Following List Modal */}
      <FollowListModal
        isOpen={isFollowModalOpen}
        onClose={() => setIsFollowModalOpen(false)}
        title={modalTitle}
        users={modalUsersList}
        currentUserId={user?.id}
      />

      {/* Report User Modal */}
      {isReportOpen && activeProfile && (
        <ReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          targetType="profile"
          targetId={activeProfile.id}
          targetTitle={`@${activeProfile.username}`}
        />
      )}

      {/* Edit Profile Modal */}
      {isOwnProfile && (
        <Modal open={isEditOpen} onOpenChange={setIsEditOpen}>
          <ModalContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <ModalHeader>
              <ModalTitle>Edit Profile</ModalTitle>
              <ModalDescription>
                Update your academic credentials, status, and campus tags.
              </ModalDescription>
            </ModalHeader>

            <form onSubmit={handleSaveProfile} className="space-y-4 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name
                  </label>
                  <Input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username
                  </label>
                  <Input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    leftIcon={<span className="font-mono text-slate-400">@</span>}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bio
                </label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Introduce yourself..."
                  maxLength={160}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Course
                  </label>
                  <Input
                    type="text"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Branch
                  </label>
                  <Input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Year
                  </label>
                  <Input
                    type="text"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Profile Photo URL
                </label>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={profilePhoto}
                  onChange={(e) => setProfilePhoto(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cover Photo URL
                </label>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={coverPhoto}
                  onChange={(e) => setCoverPhoto(e.target.value)}
                />
              </div>

              <ModalFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSaving} className="font-bold">
                  Save Changes
                </Button>
              </ModalFooter>
            </form>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
};
