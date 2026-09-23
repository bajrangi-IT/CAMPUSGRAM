import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  PlusCircle,
  Search,
  Download,
  FileText,
  ShieldCheck,
  Award,
  UserCheck,
  FolderTree,
  Filter,
  Layers,
  ArrowDownToLine,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { campusService } from '@/services/campusService';
import type { ResourceItem } from '@/types/campus.types';
import { toast } from 'sonner';

const SAMPLE_COURSES = [
  'All Courses',
  'Computer Science & Engineering',
  'Electronics & Communication',
  'Mechanical Engineering',
  'Electrical & Electronics',
  'Information Technology',
  'Civil Engineering',
  'Business Administration',
];

const SAMPLE_SUBJECTS: Record<string, string[]> = {
  'Computer Science & Engineering': [
    'All Subjects',
    'Data Structures & Algorithms',
    'Operating Systems',
    'Database Management Systems',
    'Computer Networks',
    'Compiler Design',
    'Machine Learning',
  ],
  'Electronics & Communication': [
    'All Subjects',
    'Digital Signal Processing',
    'Microprocessors & Microcontrollers',
    'VLSI Design',
    'Analog Electronics',
  ],
};

export const NotesPage: React.FC = () => {
  const { user, college } = useAuth();
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Course -> Subject Filters
  const [selectedCourse, setSelectedCourse] = useState('All Courses');
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');

  // Upload Resource Modal
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [course, setCourse] = useState('Computer Science & Engineering');
  const [subject, setSubject] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileType, setFileType] = useState('pdf');
  const [fileSizeKb, setFileSizeKb] = useState('2048');
  const [verificationStatus, setVerificationStatus] = useState<'student_uploaded' | 'faculty_verified' | 'club_verified'>('student_uploaded');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadResources = async () => {
    setIsLoading(true);
    try {
      const data = await campusService.getResources({
        course: selectedCourse === 'All Courses' ? undefined : selectedCourse,
        subject: selectedSubject === 'All Subjects' ? undefined : selectedSubject,
      });
      setResources(data);
    } catch (err: any) {
      toast.error('Failed to load study resources', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, [selectedCourse, selectedSubject]);

  const handleDownload = async (resource: ResourceItem) => {
    try {
      await campusService.incrementResourceDownloads(resource.id);
      setResources((prev) =>
        prev.map((r) =>
          r.id === resource.id
            ? {
                ...r,
                download_count: (r.download_count ?? r.downloads_count ?? 0) + 1,
                downloads_count: (r.downloads_count ?? r.download_count ?? 0) + 1,
              }
            : r
        )
      );
      toast.success(`Opening ${resource.title}`, {
        description: 'Resource download registered successfully.',
      });
      window.open(resource.file_url, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      toast.error(err.message || 'Download error');
    }
  };

  const handleUploadResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !college) return;
    if (!title.trim() || !subject.trim()) {
      toast.error('Please specify note title and subject');
      return;
    }

    setIsSubmitting(true);
    try {
      await campusService.uploadResource({
        college_id: college.id,
        uploader_id: user.id,
        title: title.trim(),
        course,
        subject: subject.trim(),
        file_url: fileUrl.trim() || 'https://campusgram.edu/resources/sample-notes.pdf',
        file_type: fileType,
        file_size_kb: parseInt(fileSizeKb, 10) || 1024,
        verification_status: verificationStatus,
      });

      toast.success('Study notes uploaded to campus resource vault!');
      setIsUploadOpen(false);
      setTitle('');
      setSubject('');
      setFileUrl('');
      loadResources();
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload resource');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredResources = resources.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.subject.toLowerCase().includes(search.toLowerCase()) ||
      r.course.toLowerCase().includes(search.toLowerCase())
  );

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'faculty_verified':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="h-3 w-3 text-emerald-600" />
            <span>Faculty Verified</span>
          </span>
        );
      case 'club_verified':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Award className="h-3 w-3 text-indigo-600" />
            <span>Club Endorsed</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            <UserCheck className="h-3 w-3 text-slate-400" />
            <span>Student Upload</span>
          </span>
        );
    }
  };

  const getFileTypeStyle = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return 'bg-rose-50 text-rose-600 border-rose-200';
      case 'ppt':
      case 'pptx':
        return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'doc':
      case 'docx':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'zip':
      case 'code':
        return 'bg-purple-50 text-purple-600 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-emerald-600 font-bold text-xs uppercase tracking-wider mb-1">
            <BookOpen className="h-4 w-4" />
            <span>Academic Knowledge Vault</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Notes & Resources</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Peer-shared and faculty-verified study materials organized by Course and Subject hierarchy.
          </p>
        </div>
        <Button
          onClick={() => setIsUploadOpen(true)}
          className="gap-2 font-bold text-xs sm:text-sm h-10 shrink-0 shadow-sm rounded-xl"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Upload Notes</span>
        </Button>
      </div>

      {/* Structured Hierarchy Filters: Course -> Subject */}
      <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <FolderTree className="h-4 w-4 text-indigo-600" />
          <span>Academic Hierarchy Selector</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">1. Select Course / Degree</label>
            <select
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setSelectedSubject('All Subjects');
              }}
              className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {SAMPLE_COURSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">2. Select Subject / Topic</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {(SAMPLE_SUBJECTS[selectedCourse] || ['All Subjects']).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <Input
            type="search"
            placeholder="Search notes by document title, module, or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4 text-slate-400" />}
            className="bg-white h-9 text-xs"
          />
        </div>
      </div>

      {/* Resources Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-white border border-slate-100 p-4 animate-pulse space-y-3">
              <div className="h-6 w-1/4 bg-slate-200 rounded" />
              <div className="h-4 w-3/4 bg-slate-200 rounded" />
              <div className="h-3 w-1/2 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : filteredResources.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No notes uploaded for this subject yet"
          description="Help fellow classmates ace upcoming examinations by uploading your lecture summaries or solved papers."
          action={
            <Button onClick={() => setIsUploadOpen(true)} className="gap-2 font-bold text-xs rounded-xl">
              <PlusCircle className="h-4 w-4" />
              <span>Share Notes</span>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map((res) => (
            <Card
              key={res.id}
              className="rounded-2xl border-slate-200/80 bg-white hover:border-emerald-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs uppercase border ${getFileTypeStyle(
                        res.file_type
                      )}`}
                    >
                      {res.file_type}
                    </span>
                    <div>
                      <p className="text-[11px] font-bold text-indigo-600 line-clamp-1">{res.subject}</p>
                      <p className="text-[10px] text-slate-400">{res.course}</p>
                    </div>
                  </div>

                  {getVerificationBadge(res.verification_status)}
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-sm line-clamp-2 leading-snug">{res.title}</h3>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>{((res.file_size_kb || res.file_size / 1024 || 1024) / 1024).toFixed(1)} MB</span>
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <Download className="h-3.5 w-3.5 text-slate-400" />
                    <span>{res.download_count ?? res.downloads_count ?? 0} downloads</span>
                  </span>
                </div>
              </CardContent>

              <div className="p-3 pt-0 border-t border-slate-50">
                <Button
                  onClick={() => handleDownload(res)}
                  variant="outline"
                  className="w-full text-xs font-bold rounded-xl h-8 gap-1.5 text-emerald-700 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/60"
                >
                  <ArrowDownToLine className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Download Resource</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Resource Modal */}
      <Modal open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <ModalContent className="max-w-md">
          <ModalHeader>
            <ModalTitle>Upload Study Material</ModalTitle>
            <ModalDescription>
              Share exam notes, lecture slides, formulas, or question banks with campus peers.
            </ModalDescription>
          </ModalHeader>

          <form onSubmit={handleUploadResource} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Resource Title</label>
              <Input
                placeholder="e.g. Unit 3 Trees & Graphs Comprehensive Summary"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Course / Branch</label>
              <select
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {SAMPLE_COURSES.filter((c) => c !== 'All Courses').map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Subject Name</label>
              <Input
                placeholder="e.g. Data Structures & Algorithms"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">File Format</label>
                <select
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="pdf">PDF Document (.pdf)</option>
                  <option value="ppt">Presentation (.ppt/.pptx)</option>
                  <option value="doc">Word Doc (.docx)</option>
                  <option value="zip">Archive Bundle (.zip)</option>
                  <option value="code">Source Code / Repo</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Estimated Size (KB)</label>
                <Input
                  type="number"
                  value={fileSizeKb}
                  onChange={(e) => setFileSizeKb(e.target.value)}
                  min="1"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Direct Download URL / Cloud Link</label>
              <Input
                placeholder="https://drive.google.com/... or storage link"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Verification Status</label>
              <select
                value={verificationStatus}
                onChange={(e: any) => setVerificationStatus(e.target.value)}
                className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="student_uploaded">Student Contributed</option>
                <option value="faculty_verified">Faculty Endorsed</option>
                <option value="club_verified">Academic Club Approved</option>
              </select>
            </div>

            <ModalFooter>
              <Button type="button" variant="outline" onClick={() => setIsUploadOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="font-bold">
                {isSubmitting ? 'Uploading...' : 'Publish to Vault'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
};
