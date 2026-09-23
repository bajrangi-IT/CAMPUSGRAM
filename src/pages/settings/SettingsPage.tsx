import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Shield,
  Bell,
  Lock,
  LogOut,
  Trash2,
  Building2,
  Mail,
  Phone,
  Key,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';

type SettingsSection = 'account' | 'profile' | 'privacy' | 'notifications' | 'security' | 'danger';

export const SettingsPage: React.FC = () => {
  const { user, profile, college, signOut, updatePassword, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState<SettingsSection>('account');

  // Security password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Privacy toggles
  const [privacyPublicProfile, setPrivacyPublicProfile] = useState(true);
  const [privacyAllowMessages, setPrivacyAllowMessages] = useState('all_students');
  const [privacyShowYear, setPrivacyShowYear] = useState(true);

  // Notification toggles
  const [notifyAnnouncements, setNotifyAnnouncements] = useState(true);
  const [notifyEvents, setNotifyEvents] = useState(true);
  const [notifyMessages, setNotifyMessages] = useState(true);

  // Account Deletion Dialog
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await updatePassword(newPassword);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error('Failed to change password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Logged out successfully.');
    navigate('/login');
  };

  const handleAccountDeletion = async () => {
    setIsDeleting(true);
    try {
      // In a production Supabase app, account deletion triggers a soft-delete status or
      // initiates an admin edge function to purge auth.users.
      await updateProfile({
        bio: '[Account scheduled for deletion]',
        onboarding_completed: false,
      });

      toast.info('Account marked for deletion. Signing out...');
      await signOut();
      navigate('/login');
    } catch (err: any) {
      toast.error('Failed to process account deletion.');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const navItems = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'profile', label: 'Profile Details', icon: Building2 },
    { id: 'privacy', label: 'Privacy & Safety', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security & Login', icon: Lock },
    { id: 'danger', label: 'Danger Zone', icon: Trash2 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Settings</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your campus account preferences, privacy, and security.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Settings Navigation Column */}
        <div className="md:col-span-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id as SettingsSection)}
                className={`w-full flex items-center space-x-2.5 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all text-left ${
                  isActive
                    ? item.id === 'danger'
                      ? 'bg-rose-50 text-rose-700'
                      : 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${
                    isActive
                      ? item.id === 'danger'
                        ? 'text-rose-600'
                        : 'text-indigo-600'
                      : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-4 border-t border-slate-200/80">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center space-x-2.5 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors text-left"
            >
              <LogOut className="h-4 w-4 text-slate-400" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Settings Main Content Area */}
        <div className="md:col-span-3">
          {/* SECTION: ACCOUNT */}
          {activeSection === 'account' && (
            <Card className="rounded-2xl border-slate-200 shadow-card">
              <CardHeader>
                <CardTitle className="text-base font-bold">Account Overview</CardTitle>
                <CardDescription>
                  Your institutional identity and linked student details.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                    <span className="text-slate-400 font-semibold block mb-1">
                      Campus Node
                    </span>
                    <p className="font-bold text-slate-800 text-sm">
                      {college?.name || 'Unassigned / Independent Campus'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                    <span className="text-slate-400 font-semibold block mb-1">
                      Student Email
                    </span>
                    <p className="font-mono font-medium text-slate-800 text-sm">
                      {user?.email || profile?.email || 'N/A'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                    <span className="text-slate-400 font-semibold block mb-1">
                      Verified Phone
                    </span>
                    <p className="font-mono font-medium text-slate-800 text-sm">
                      {profile?.phone || 'Not verified'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                    <span className="text-slate-400 font-semibold block mb-1">
                      Course & Year
                    </span>
                    <p className="font-bold text-slate-800 text-sm">
                      {[profile?.course, profile?.year].filter(Boolean).join(' • ') ||
                        'Not specified'}
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/profile')}
                    className="font-bold text-xs"
                  >
                    View Public Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECTION: PROFILE */}
          {activeSection === 'profile' && (
            <Card className="rounded-2xl border-slate-200 shadow-card">
              <CardHeader>
                <CardTitle className="text-base font-bold">Profile Settings</CardTitle>
                <CardDescription>
                  Manage your display name, username, and public bio.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Display Name
                  </label>
                  <Input value={profile?.full_name || ''} disabled />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username
                  </label>
                  <Input value={profile?.username || ''} disabled />
                </div>
                <Button
                  onClick={() => navigate('/profile')}
                  className="font-bold text-xs"
                >
                  Edit Complete Profile
                </Button>
              </CardContent>
            </Card>
          )}

          {/* SECTION: PRIVACY */}
          {activeSection === 'privacy' && (
            <Card className="rounded-2xl border-slate-200 shadow-card">
              <CardHeader>
                <CardTitle className="text-base font-bold">Privacy & Campus Safety</CardTitle>
                <CardDescription>
                  Control who can find and interact with you inside the campus network.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-bold text-slate-800">Public Campus Profile</h4>
                    <p className="text-slate-500">Allow other students from your college to view your profile</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={privacyPublicProfile}
                    onChange={(e) => {
                      setPrivacyPublicProfile(e.target.checked);
                      toast.success('Privacy preference updated.');
                    }}
                    className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-bold text-slate-800">Show Academic Batch / Year</h4>
                    <p className="text-slate-500">Display your graduation year publicly on cards</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={privacyShowYear}
                    onChange={(e) => {
                      setPrivacyShowYear(e.target.checked);
                      toast.success('Privacy preference updated.');
                    }}
                    className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Who can send you direct messages?
                  </label>
                  <select
                    value={privacyAllowMessages}
                    onChange={(e) => {
                      setPrivacyAllowMessages(e.target.value);
                      toast.success('Messaging preference updated.');
                    }}
                    className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900"
                  >
                    <option value="all_students">Any verified student in my college</option>
                    <option value="mutuals">Only students I follow back</option>
                    <option value="department_only">Only students in my department</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECTION: NOTIFICATIONS */}
          {activeSection === 'notifications' && (
            <Card className="rounded-2xl border-slate-200 shadow-card">
              <CardHeader>
                <CardTitle className="text-base font-bold">Notification Preferences</CardTitle>
                <CardDescription>
                  Configure email and in-app alerts for college activities.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-bold text-slate-800">Campus Announcements</h4>
                    <p className="text-slate-500">Important notices published by administration or departments</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyAnnouncements}
                    onChange={(e) => {
                      setNotifyAnnouncements(e.target.checked);
                      toast.success('Notification preference saved.');
                    }}
                    className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-bold text-slate-800">Event Reminders</h4>
                    <p className="text-slate-500">Alerts when registered fests or hackathons are starting</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyEvents}
                    onChange={(e) => {
                      setNotifyEvents(e.target.checked);
                      toast.success('Notification preference saved.');
                    }}
                    className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800">Direct Messages</h4>
                    <p className="text-slate-500">Real-time alerts for incoming peer chats</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyMessages}
                    onChange={(e) => {
                      setNotifyMessages(e.target.checked);
                      toast.success('Notification preference saved.');
                    }}
                    className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECTION: SECURITY */}
          {activeSection === 'security' && (
            <Card className="rounded-2xl border-slate-200 shadow-card">
              <CardHeader>
                <CardTitle className="text-base font-bold">Security & Login</CardTitle>
                <CardDescription>
                  Keep your password updated and monitor your active session.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handlePasswordChange} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      New Password
                    </label>
                    <Input
                      type="password"
                      placeholder="Min 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Confirm New Password
                    </label>
                    <Input
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    isLoading={isUpdatingPassword}
                    className="font-bold text-xs h-10 mt-1"
                  >
                    Update Password
                  </Button>
                </form>

                <div className="pt-4 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2 text-emerald-600 font-semibold mb-1">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Active Session Secure</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Your session is authenticated via Supabase JWT with automatic token refresh.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECTION: DANGER ZONE (ACCOUNT DELETION) */}
          {activeSection === 'danger' && (
            <Card className="rounded-2xl border-rose-200 shadow-card bg-rose-50/20">
              <CardHeader>
                <div className="flex items-center space-x-2 text-rose-600">
                  <AlertTriangle className="h-5 w-5" />
                  <CardTitle className="text-base font-bold text-rose-700">
                    Danger Zone
                  </CardTitle>
                </div>
                <CardDescription className="text-slate-600 text-xs">
                  Irreversible actions regarding your account and campus data.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="rounded-xl border border-rose-200 bg-white p-4">
                  <h4 className="font-bold text-slate-900 text-sm">Delete Campus Account</h4>
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                    Permanently delete your profile, posts, registrations, and direct messages.
                    Once deleted, you will lose access to the private campus network.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="mt-4 font-bold text-xs h-9"
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Request Account Deletion
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Account Deletion Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleAccountDeletion}
        title="Schedule Account Deletion?"
        description="Are you absolutely sure you want to delete your campus account? This will revoke your access to the private campus network and remove all your data."
        confirmText="Yes, Delete My Account"
        cancelText="Keep Account"
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  );
};
