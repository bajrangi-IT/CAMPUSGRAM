import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  User,
  Mail,
  Phone,
  Lock,
  GraduationCap,
  BookOpen,
  Calendar,
  Layers,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Building2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { College } from '@/types/database.types';
import { getAllColleges, registerNewCollege } from '@/services/collegesService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { toast } from 'sonner';

const phoneRegex = /^\+?[1-9]\d{6,14}$/;

const signupSchema = z
  .object({
    fullName: z
      .string()
      .min(2, 'Full name must be at least 2 characters')
      .max(60, 'Full name cannot exceed 60 characters'),
    email: z
      .string()
      .email('Please enter a valid email address')
      .toLowerCase(),
    phone: z
      .string()
      .regex(phoneRegex, 'Enter valid phone with country code (e.g. +14155552671)'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string(),
    collegeId: z.string().optional(),
    collegeName: z.string().optional(),
    course: z.string().min(2, 'Enter course (e.g. B.Tech, BS, MBA)'),
    branch: z.string().min(2, 'Enter department/branch (e.g. CS, Mechanical)'),
    year: z.string().min(1, 'Select your study year'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SignupFormData = z.infer<typeof signupSchema>;

export const SignupPage: React.FC = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [colleges, setColleges] = useState<College[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    setColleges(getAllColleges());
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      collegeId: 'col-iitb',
      collegeName: '',
      course: 'B.Tech Computer Science',
      branch: 'Engineering',
      year: '1st Year',
    },
  });

  const onSubmit = async (values: SignupFormData) => {
    setIsLoading(true);
    setServerError(null);

    try {
      let finalCollegeId = values.collegeId;

      // If user typed custom college, register it
      if (!finalCollegeId && values.collegeName) {
        const domain = values.email.split('@')[1] || 'campus.edu';
        const newCol = registerNewCollege(values.collegeName, domain);
        finalCollegeId = newCol.id;
      }

      const { data, error } = await signUp({
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        password: values.password,
        collegeId: finalCollegeId || undefined,
        course: values.course,
        branch: values.branch,
        year: values.year,
      });

      if (error) {
        if (error.message.includes('already registered')) {
          setServerError('An account with this email address already exists. Please log in.');
        } else {
          setServerError(error.message);
        }
        return;
      }

      toast.success('Registration initiated! Please verify your email.');
      navigate('/onboarding', {
        state: {
          email: values.email,
          phone: values.phone,
          step: 1,
        },
      });
    } catch (err: any) {
      setServerError('A network error occurred during signup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="rounded-2xl border-slate-200 shadow-card">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-bold tracking-tight text-slate-900">
          Create your campus account
        </CardTitle>
        <CardDescription>
          Join your private college network. Only verified students have access.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {serverError && (
          <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
          {/* Full Name */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Full Name
            </label>
            <Input
              type="text"
              placeholder="Alex Johnson"
              leftIcon={<User className="h-4 w-4" />}
              error={errors.fullName?.message}
              {...register('fullName')}
            />
          </div>

          {/* Email */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Campus Email
            </label>
            <Input
              type="email"
              placeholder="alex@college.edu"
              leftIcon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              {...register('email')}
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Phone Number (with country code)
            </label>
            <Input
              type="tel"
              placeholder="+14155552671"
              leftIcon={<Phone className="h-4 w-4" />}
              error={errors.phone?.message}
              {...register('phone')}
            />
          </div>

          {/* Passwords grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Password
              </label>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                leftIcon={<Lock className="h-4 w-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                error={errors.password?.message}
                {...register('password')}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Confirm Password
              </label>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm password"
                leftIcon={<Lock className="h-4 w-4" />}
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
            </div>
          </div>

          {/* College Selection / Input */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              College / University
            </label>
            {colleges.length > 0 ? (
              <select
                className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                {...register('collegeId')}
              >
                <option value="">Select your college</option>
                {colleges.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                type="text"
                placeholder="e.g. Stanford University, MIT, IIT"
                leftIcon={<Building2 className="h-4 w-4" />}
                error={errors.collegeName?.message}
                {...register('collegeName')}
              />
            )}
          </div>

          {/* Course, Branch, Year */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Course
              </label>
              <Input
                type="text"
                placeholder="B.Tech, BS"
                leftIcon={<GraduationCap className="h-4 w-4" />}
                error={errors.course?.message}
                {...register('course')}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Branch / Dept
              </label>
              <Input
                type="text"
                placeholder="Computer Science"
                leftIcon={<Layers className="h-4 w-4" />}
                error={errors.branch?.message}
                {...register('branch')}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Current Year
              </label>
              <select
                className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                {...register('year')}
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="Graduate / PG">Graduate / PG</option>
                <option value="Faculty / Staff">Faculty / Staff</option>
              </select>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full font-bold text-sm h-11 rounded-xl mt-4"
            isLoading={isLoading}
          >
            <span>Proceed to Verification</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col border-t border-slate-100 pt-4 text-center">
        <p className="text-xs text-slate-500">
          Already registered?{' '}
          <Link
            to="/login"
            className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
};
