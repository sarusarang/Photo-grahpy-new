import React, { useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { useAuth } from '../../context/AuthContext';
import {
  usePhotographerProfile,
  useUpdatePersonalInformation,
  useUploadProfileAvatar,
  useRemoveProfileAvatar,
} from '../../service/profile/useProfile';
import {
  personalInformationSchema,
  type PersonalInformationFormData,
} from '../../schemas/authSchemas';
import { toast } from 'sonner';
import {
  User,
  Mail,
  Briefcase,
  Bookmark,
  Camera,
  Upload,
  Trash2,
  Calendar,
  LayoutGrid,
  Image as ImageIcon,
  Film,
  Cloud,
  ChevronRight,
  Crown,
  AlertCircle,
  RotateCcw,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

interface PersonalInformationSectionProps {
  onManagePlan?: () => void;
}

// ---------------------------------------------------------------------------
// 1. Reusable Form Input Component
// ---------------------------------------------------------------------------
interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  error?: string;
  icon: React.ReactNode;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, required, error, icon, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
          <span>{label}</span>
          {required && <span className="text-amber-500">*</span>}
        </label>
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 pointer-events-none">
            {icon}
          </div>
          <input
            ref={ref}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950/80 border text-neutral-900 dark:text-white text-xs placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none transition-colors ${
              error
                ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/30'
                : 'border-neutral-200 dark:border-neutral-800 focus:border-amber-400'
            } ${className}`}
            {...props}
          />
        </div>
        {error && (
          <div className="flex items-center gap-1.5 text-rose-400 text-[11px] mt-0.5 animate-in fade-in duration-150">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }
);
FormInput.displayName = 'FormInput';

// ---------------------------------------------------------------------------
// 2. Reusable Phone Input with Country Code Component
// ---------------------------------------------------------------------------
interface FormPhoneInputProps {
  label: string;
  required?: boolean;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const FormPhoneInput: React.FC<FormPhoneInputProps> = ({
  label,
  required,
  error,
  value,
  onChange,
  placeholder = '+1 (555) 000-0000',
}) => {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
        <span>{label}</span>
        {required && <span className="text-amber-500">*</span>}
      </label>
      <div className="relative">
        <PhoneInput
          international
          defaultCountry="US"
          value={value}
          onChange={(val) => onChange(val || '')}
          placeholder={placeholder}
          className={`custom-phone-input ${error ? 'is-error' : ''}`}
        />
      </div>
      {error && (
        <div className="flex items-center gap-1.5 text-rose-400 text-[11px] mt-0.5 animate-in fade-in duration-150">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// 3. Shimmer Loading Skeleton Component
// ---------------------------------------------------------------------------
export const PersonalInformationSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-pulse">
      {/* Left Form Card Skeleton */}
      <div className="lg:col-span-8 rounded-3xl bg-white dark:bg-[#121319] border border-neutral-200 dark:border-neutral-800/90 p-6 sm:p-7 shadow-sm space-y-6">
        <div className="flex items-center gap-3.5 pb-1">
          <div className="w-10 h-10 rounded-xl bg-neutral-200 dark:bg-neutral-800/80 shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="w-48 h-5 rounded-lg bg-neutral-200 dark:bg-neutral-800/80" />
            <div className="w-72 h-3.5 rounded-lg bg-neutral-100 dark:bg-neutral-800/50" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="w-20 h-3.5 rounded bg-neutral-200 dark:bg-neutral-800/80" />
            <div className="w-full h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800/50" />
          </div>
          <div className="space-y-2">
            <div className="w-28 h-3.5 rounded bg-neutral-200 dark:bg-neutral-800/80" />
            <div className="w-full h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800/50" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="w-24 h-3.5 rounded bg-neutral-200 dark:bg-neutral-800/80" />
            <div className="w-full h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800/50" />
          </div>
          <div className="space-y-2">
            <div className="w-24 h-3.5 rounded bg-neutral-200 dark:bg-neutral-800/80" />
            <div className="w-full h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800/50" />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <div className="w-32 h-10 rounded-xl bg-neutral-200 dark:bg-neutral-800/80" />
        </div>
      </div>

      {/* Right Column Skeletons */}
      <div className="lg:col-span-4 space-y-6">
        <div className="rounded-3xl bg-white dark:bg-[#121319] border border-neutral-200 dark:border-neutral-800/90 p-5 shadow-sm space-y-4">
          <div className="space-y-1.5">
            <div className="w-28 h-4 rounded bg-neutral-200 dark:bg-neutral-800/80" />
            <div className="w-44 h-3 rounded bg-neutral-100 dark:bg-neutral-800/50" />
          </div>
          <div className="flex items-center gap-4 pt-1">
            <div className="w-20 h-20 rounded-full bg-neutral-200 dark:bg-neutral-800/80 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="w-full h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800/50" />
              <div className="w-full h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800/50" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white dark:bg-[#121319] border border-neutral-200 dark:border-neutral-800/90 p-5 shadow-sm space-y-4">
          <div className="w-28 h-4 rounded bg-neutral-200 dark:bg-neutral-800/80" />
          <div className="space-y-3 pt-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="w-24 h-3.5 rounded bg-neutral-100 dark:bg-neutral-800/50" />
                <div className="w-16 h-3.5 rounded bg-neutral-200 dark:bg-neutral-800/80" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 4. Error Display Component with Retry Action
// ---------------------------------------------------------------------------
export const PersonalInformationError: React.FC<{
  errorMessage?: string;
  onRetry: () => void;
  isRetrying: boolean;
}> = ({ errorMessage, onRetry, isRetrying }) => {
  return (
    <div className="rounded-3xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 p-6 sm:p-8 text-center space-y-4 max-w-2xl mx-auto">
      <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
        <AlertCircle className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
          Unable to Load Profile Details
        </h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto mt-1">
          {errorMessage || 'There was an issue connecting to the photographer profile service.'}
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        disabled={isRetrying}
        className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-950 text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
      >
        {isRetrying ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <RotateCcw className="w-3.5 h-3.5" />
        )}
        <span>{isRetrying ? 'Retrying...' : 'Retry Connection'}</span>
      </button>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 5. Main Personal Information Section
// ---------------------------------------------------------------------------
export const PersonalInformationSection: React.FC<PersonalInformationSectionProps> = ({
  onManagePlan,
}) => {
  const { photographer, user, updateProfile } = useAuth();

  // API Queries & Mutations
  const {
    data: profileData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = usePhotographerProfile();

  const updateMutation = useUpdatePersonalInformation();
  const uploadAvatarMutation = useUploadProfileAvatar();
  const removeAvatarMutation = useRemoveProfileAvatar();

  // Hidden File Input for Avatar
  const fileInputRef = useRef<HTMLInputElement>(null);

  // React Hook Form with Zod schema
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm<PersonalInformationFormData>({
    resolver: zodResolver(personalInformationSchema),
    defaultValues: {
      name: profileData?.name || user?.fullname || user?.username || '',
      phone: profileData?.phone || user?.phone || '',
      email: profileData?.email || user?.email || '',
      occupation: profileData?.occupation || '',
    },
  });

  // Synchronize form values whenever backend profile data returns
  useEffect(() => {
    if (profileData) {
      const updatedName = profileData.name || user?.fullname || user?.username || '';
      const updatedPhone = profileData.phone || user?.phone || '';
      const updatedEmail = profileData.email || user?.email || '';
      const updatedOccupation = profileData.occupation || '';

      reset({
        name: updatedName,
        phone: updatedPhone,
        email: updatedEmail,
        occupation: updatedOccupation,
      });

      // Synchronize into AuthContext so the header and dropdown stay fresh
      updateProfile({
        fullName: updatedName,
        phone: updatedPhone,
        email: updatedEmail,
        occupation: updatedOccupation,
        avatarUrl:
          profileData.avatar_url ||
          profileData.avatar ||
          profileData.profile_image ||
          '',
      });
    }
  }, [profileData, reset]);

  // Handle Form Submit (PATCH /api/photographers/profiles/me/)
  const onSubmit = async (values: PersonalInformationFormData) => {
    try {
      const res = await updateMutation.mutateAsync({
        name: values.name.trim(),
        phone: values.phone.trim(),
        email: values.email.trim(),
        occupation: values.occupation.trim(),
      });

      // Update AuthContext optimistically & consistently
      updateProfile({
        fullName: res?.data?.name || values.name.trim(),
        phone: res?.data?.phone || values.phone.trim(),
        email: res?.data?.email || values.email.trim(),
        occupation: res?.data?.occupation || values.occupation.trim(),
      });

      // Reset form to clear isDirty status with saved values
      reset(values);
    } catch {
      // Handled in mutation onError
    }
  };

  // Handle Image Upload (POST /api/photographers/profiles/me/avatar/)
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be re-selected if needed
    e.target.value = '';

    if (!file.type.startsWith('image/')) {
      toast.error('Invalid File Type', {
        description: 'Please select a valid image file (JPG, PNG, WebP).',
      });
      return;
    }

    // Limit to 10MB
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File Too Large', {
        description: 'Image file size must be less than 10MB.',
      });
      return;
    }

    try {
      const res = await uploadAvatarMutation.mutateAsync(file);
      const newAvatarUrl = res?.avatar_url || res?.data?.avatar_url;
      if (newAvatarUrl) {
        updateProfile({ avatarUrl: newAvatarUrl });
      }
    } catch {
      // Handled in mutation onError
    }
  };

  // Handle Avatar Removal (DELETE /api/photographers/profiles/me/avatar/)
  const handleRemoveAvatar = async () => {
    if (!window.confirm('Remove your profile photo?')) return;

    try {
      await removeAvatarMutation.mutateAsync();
      updateProfile({ avatarUrl: '' });
    } catch {
      // Handled in mutation onError
    }
  };

  // 1. Loading State (Show Skeleton when first fetching without cache)
  if (isLoading && !profileData) {
    return <PersonalInformationSkeleton />;
  }

  // 2. Error State (Show Error Banner with retry when fetch fails and no data)
  if (isError && !profileData) {
    return (
      <PersonalInformationError
        errorMessage={(error as any)?.message || 'Failed to load profile details'}
        onRetry={() => refetch()}
        isRetrying={isFetching}
      />
    );
  }

  // Active avatar URL without dummy fallback pictures
  const currentAvatar =
    profileData?.avatar_url ||
    profileData?.avatar ||
    profileData?.profile_image ||
    photographer.avatarUrl ||
    '';

  // Quick info statistics from API (defaults to 0 / dash, no mock values)
  const quickInfo = profileData?.quick_info;

  // Plan details from API
  const planDetails = profileData?.plan_details;

  const isSaving = updateMutation.isPending;
  const isUploading = uploadAvatarMutation.isPending;
  const isRemoving = removeAvatarMutation.isPending;

  // Initials for avatar fallback if no image is uploaded
  const userInitials = (
    profileData?.name ||
    photographer.fullName ||
    user?.username ||
    'U'
  )
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start fade-up">
      {/* Hidden File Input for Avatar */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp"
        onChange={handleFileSelected}
        className="hidden"
      />

      {/* LEFT COLUMN: Personal Information Form (8 Cols) */}
      <div className="lg:col-span-8">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-3xl bg-white dark:bg-[#121319] border border-neutral-200 dark:border-neutral-800/90 p-6 sm:p-7 shadow-sm dark:shadow-xl space-y-6"
        >
          {/* Card Header */}
          <div className="flex items-center gap-3.5 pb-1">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400 shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white tracking-tight">
                Personal Information
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Manage your personal details and contact information.
              </p>
            </div>
          </div>

          {/* Row 1: Name & Phone Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Reusable FormInput for Name */}
            <FormInput
              label="Name"
              required
              placeholder="e.g. Elena Rostova"
              icon={<User className="w-4 h-4" />}
              error={errors.name?.message}
              {...register('name')}
            />

            {/* Reusable FormPhoneInput with Country Code */}
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <FormPhoneInput
                  label="Phone Number"
                  required
                  placeholder="+1 (555) 000-0000"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.phone?.message}
                />
              )}
            />
          </div>

          {/* Row 2: Email Address & Occupation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Reusable FormInput for Email */}
            <FormInput
              label="Email Address"
              required
              type="email"
              placeholder="e.g. name@example.com"
              icon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            {/* Reusable FormInput for Occupation */}
            <FormInput
              label="Occupation"
              required
              placeholder="e.g. Wedding & Editorial Photographer"
              icon={<Briefcase className="w-4 h-4" />}
              error={errors.occupation?.message}
              {...register('occupation')}
            />
          </div>

          {/* Unsaved Changes Banner */}
          {isDirty && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>You have unsaved personal information changes.</span>
            </div>
          )}

          {/* Save Changes Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-amber-500/10 active:scale-[0.98] hover:scale-[1.01] cursor-pointer disabled:opacity-60"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
              ) : (
                <Bookmark className="w-4 h-4 stroke-[2.2]" />
              )}
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* RIGHT COLUMN: Profile Photo, Quick Info & Plan (4 Cols) */}
      <div className="lg:col-span-4 space-y-6">
        {/* Card 1: Profile Photo */}
        <div className="rounded-3xl bg-white dark:bg-[#121319] border border-neutral-200 dark:border-neutral-800/90 p-5 shadow-sm dark:shadow-xl space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">Profile Photo</h4>
              </div>
              {currentAvatar ? (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 font-semibold border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 font-medium">
                  Optional
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              This will be used as your profile image.
            </p>
          </div>

          <div className="flex items-center gap-4 pt-1">
            <div className="relative shrink-0">
              {currentAvatar ? (
                <img
                  src={currentAvatar}
                  alt={profileData?.name || user?.fullname || 'Profile Avatar'}
                  className="w-20 h-20 rounded-full object-cover ring-2 ring-neutral-300 dark:ring-neutral-700/80 shadow-md bg-neutral-900"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-neutral-100 dark:bg-neutral-900 border-2 border-dashed border-neutral-300 dark:border-neutral-700 flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-500 select-none">
                  {userInitials ? (
                    <span className="text-xl font-bold text-neutral-600 dark:text-neutral-400 uppercase">
                      {userInitials}
                    </span>
                  ) : (
                    <User className="w-8 h-8 stroke-[1.5]" />
                  )}
                </div>
              )}
              {(isUploading || isRemoving) && (
                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isRemoving}
                className="w-full py-2 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isUploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>{isUploading ? 'Uploading...' : 'Upload Image'}</span>
              </button>

              <button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={!currentAvatar || isUploading || isRemoving}
                className="w-full py-2 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isRemoving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{isRemoving ? 'Removing...' : 'Remove'}</span>
              </button>
            </div>
          </div>

          <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
            Recommended: Square image, at least 500x500px (JPG, PNG, WebP)
          </p>
        </div>

        {/* Card 2: Quick Info */}
        <div className="rounded-3xl bg-white dark:bg-[#121319] border border-neutral-200 dark:border-neutral-800/90 p-5 shadow-sm dark:shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">Quick Info</h4>
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-semibold">
              Live Stats
            </span>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5 text-neutral-500 dark:text-neutral-400">
                <Calendar className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                <span>Member Since</span>
              </div>
              <span className="text-neutral-900 dark:text-neutral-200 font-medium">
                {quickInfo?.member_since || '—'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5 text-neutral-500 dark:text-neutral-400">
                <LayoutGrid className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                <span>Galleries Created</span>
              </div>
              <span className="text-neutral-900 dark:text-neutral-200 font-medium">
                {quickInfo?.galleries_created ?? 0}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5 text-neutral-500 dark:text-neutral-400">
                <ImageIcon className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                <span>Total Photos</span>
              </div>
              <span className="text-neutral-900 dark:text-neutral-200 font-medium">
                {quickInfo?.total_photos !== undefined
                  ? Number(quickInfo.total_photos).toLocaleString()
                  : 0}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5 text-neutral-500 dark:text-neutral-400">
                <Film className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                <span>Total Videos</span>
              </div>
              <span className="text-neutral-900 dark:text-neutral-200 font-medium">
                {quickInfo?.total_videos ?? 0}
              </span>
            </div>

            <div
              onClick={onManagePlan}
              className="flex items-center justify-between text-xs cursor-pointer group pt-1"
            >
              <div className="flex items-center gap-2.5 text-neutral-500 dark:text-neutral-400">
                <Cloud className="w-4 h-4 text-neutral-400 dark:text-neutral-500 group-hover:text-amber-500 transition-colors" />
                <span>Storage Used</span>
              </div>
              <div className="flex items-center gap-1 text-neutral-900 dark:text-neutral-200 font-medium group-hover:text-amber-500 transition-colors">
                <span>{quickInfo?.storage_display || '0 GB'}</span>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-amber-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Plan Details Card */}
        <div className="rounded-3xl bg-gradient-to-r from-neutral-900 via-[#181510] to-[#261d0b] dark:from-[#12141a] dark:via-[#171510] dark:to-[#241c0e] border border-amber-500/20 p-5 shadow-sm dark:shadow-xl relative overflow-hidden">
          {/* Golden Geometric Graphic */}
          <div className="absolute right-0 bottom-0 pointer-events-none opacity-50 select-none">
            <svg width="150" height="90" viewBox="0 0 150 90" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon points="120,10 150,90 90,90" fill="#eab308" opacity="0.6" />
              <polygon points="120,10 90,90 70,90" fill="#ca8a04" opacity="0.8" />
              <polygon points="80,35 110,90 50,90" fill="#facc15" opacity="0.4" />
              <polygon points="80,35 50,90 35,90" fill="#a16207" opacity="0.7" />
            </svg>
          </div>

          <div className="relative z-10">
            <Crown className="w-4 h-4 text-amber-400 mb-2" />
            <h4 className="text-sm font-semibold text-white">
              {planDetails?.headline || planDetails?.name || 'Pro Studio Plan'}
            </h4>
            <p className="text-xs text-neutral-400 mt-1 mb-4">
              {planDetails?.description || 'Unlock more storage and premium photography studio features.'}
            </p>
            <button
              type="button"
              onClick={onManagePlan}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-[0.98] hover:scale-[1.02] cursor-pointer"
            >
              <span>Manage Plan</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
