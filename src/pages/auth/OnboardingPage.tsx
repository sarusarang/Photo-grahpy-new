import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import {
  Camera,
  Mail,
  ArrowRight,
  User,
  FolderOpen,
  Cloud,
  Users,
  Briefcase,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  emailSchema,
  otpSchema,
  profileSetupSchema,
  type EmailFormData,
  type OtpFormData,
  type ProfileSetupFormData,
} from '../../schemas/authSchemas';
import { useSendRegOtp, useVerifyRegOtp, useResendRegOtp } from '../../service/auth/useAuth';
import { useSubmitOnboarding, useOnboardingState } from '../../service/profile/useProfile';

type OnboardStep = 'email' | 'otp' | 'profile';

export const OnboardingPage: React.FC = () => {
  const { completeOnboarding, login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<OnboardStep>('email');
  const [activeEmail, setActiveEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);

  // Avatar upload state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // API hooks
  const sendOtpMutation = useSendRegOtp();
  const verifyOtpMutation = useVerifyRegOtp();
  const resendOtpMutation = useResendRegOtp();
  const submitOnboardingMutation = useSubmitOnboarding();
  const { data: onboardingState } = useOnboardingState(step === 'profile' && isAuthenticated);

  // React Hook Form for Step 1: Email
  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
    mode: 'onTouched',
  });

  // React Hook Form for Step 2: OTP
  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
    mode: 'onChange',
  });

  // React Hook Form for Step 3: Profile Setup (Phone and Occupation are REQUIRED)
  const profileForm = useForm<ProfileSetupFormData>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: {
      name: '',
      phone: '',
      occupation: '',
    },
    mode: 'onTouched',
  });

  // Prepopulate profile if onboarding state returns existing info
  useEffect(() => {
    if (onboardingState) {
      if (onboardingState.name && !profileForm.getValues('name')) {
        profileForm.setValue('name', onboardingState.name);
      }
      if (onboardingState.phone && !profileForm.getValues('phone')) {
        profileForm.setValue('phone', onboardingState.phone);
      }
      if (onboardingState.occupation && !profileForm.getValues('occupation')) {
        profileForm.setValue('occupation', onboardingState.occupation);
      }
      if (onboardingState.avatar_url && !avatarPreview) {
        setAvatarPreview(onboardingState.avatar_url);
      }
    }
  }, [onboardingState, profileForm, avatarPreview]);

  // Avatar File Handler
  const processAvatarFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Invalid File Type', {
        description: 'Please upload an image file (JPG, PNG, or WEBP).',
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File Size Too Large', {
        description: 'Please upload an image smaller than 5MB.',
      });
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target?.result as string);
      toast.success('Photo Uploaded', {
        description: 'Profile avatar preview set successfully.',
      });
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processAvatarFile(file);
    }
  };

  const handleDropAvatar = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingAvatar(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processAvatarFile(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Step 1: Email Submission via real API
  const onEmailSubmit = async (data: EmailFormData) => {
    setActiveEmail(data.email);
    try {
      await sendOtpMutation.mutateAsync({ email: data.email });
      setStep('otp');
    } catch {
      // Error message handled in mutation
    }
  };

  // Step 2: OTP Digit Synchronization & Submission
  const handleOtpDigitChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const nextDigits = [...otpDigits];
    nextDigits[index] = val.slice(-1);
    setOtpDigits(nextDigits);

    const fullCode = nextDigits.join('');
    otpForm.setValue('otp', fullCode, { shouldValidate: fullCode.length === 6 });

    if (val && index < 5) {
      const nextEl = document.getElementById(`reg-otp-${index + 1}`);
      nextEl?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevEl = document.getElementById(`reg-otp-${index - 1}`);
      prevEl?.focus();
    }
  };

  const onOtpSubmit = async (data: OtpFormData) => {
    try {
      const res = await verifyOtpMutation.mutateAsync({
        email: activeEmail,
        otp: data.otp,
        role: 'photographer',
      });

      if (res?.user) {
        login(res.user);
      }
      setStep('profile');
    } catch {
      // Error toast handled by mutation
    }
  };

  const handleResendOtp = async () => {
    if (!activeEmail) return;
    setOtpDigits(['', '', '', '', '', '']);
    otpForm.setValue('otp', '');
    try {
      await resendOtpMutation.mutateAsync({ email: activeEmail });
    } catch {
      // Handled
    }
  };

  // Step 3: Profile Setup Submission via Real API
  const onProfileSubmit = async (formData: ProfileSetupFormData) => {
    try {
      const res = await submitOnboardingMutation.mutateAsync({
        name: formData.name.trim(),
        phone: formData.phone?.trim() || "",
        occupation: formData.occupation?.trim() || "",
        avatar: avatarFile,
        avatar_url: avatarPreview && !avatarFile ? avatarPreview : undefined,
        onboarding_step: 3,
      });

      if (res?.user) {
        login(res.user);
      }

      completeOnboarding({
        fullName: res?.profile?.name || res?.user?.fullname || formData.name,
        phone: res?.profile?.phone || res?.user?.phone || formData.phone || '',
        occupation: res?.profile?.occupation || formData.occupation || '',
        avatarUrl: res?.profile?.avatar_url || avatarPreview,
        studioName: `${res?.profile?.name || formData.name} Studio`,
        bio: formData.occupation ? `${formData.occupation} capturing timeless moments.` : 'Ex Studio Photographer',
        isOnboarded: true,
      });

      navigate('/dashboard/drive');
    } catch {
      // Handled by mutation toast
    }
  };

  const stepLabel = step === 'email' ? '1 of 3' : step === 'otp' ? '2 of 3' : '3 of 3';
  const stepTitle =
    step === 'email'
      ? 'Create Your Account'
      : step === 'otp'
      ? 'Verify Your Email'
      : 'Set Up Your Profile';

  const stepSub =
    step === 'email'
      ? 'Join photographers worldwide building client galleries.'
      : step === 'otp'
      ? `Enter the 6-digit code sent to ${activeEmail}`
      : 'Tell us a bit about yourself to personalize your studio workspace.';

  const isEmailLoading = sendOtpMutation.isPending;
  const isOtpLoading = verifyOtpMutation.isPending;
  const isProfileLoading = submitOnboardingMutation.isPending;

  return (
    <div className="h-screen max-h-screen w-full flex overflow-hidden bg-neutral-950 text-white font-sans select-none">
      {/* LEFT PANEL */}
      <div className="w-full lg:w-[48%] xl:w-[44%] 2xl:w-[40%] h-full flex flex-col justify-between p-4 sm:p-6 lg:p-8 bg-neutral-950 border-r border-neutral-800/80 z-10 overflow-hidden">
        {/* Top Brand Nav */}
        <header className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center shadow-sm shadow-amber-500/20">
              <Camera className="w-4 h-4 text-neutral-950 stroke-[2.2]" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xs font-black tracking-wider text-white">EX STUDIO</span>
              <span className="text-[9px] tracking-widest text-neutral-400 font-medium mt-0.5">
                PHOTOGRAPHY
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-medium tracking-wide">
            <span>Capture</span>
            <span className="text-neutral-600">•</span>
            <span>Share</span>
            <span className="text-neutral-600">•</span>
            <span>Deliver</span>
          </div>
        </header>

        {/* Center Form Area */}
        <main className="my-auto w-full max-w-md mx-auto flex flex-col justify-center py-2">
          {/* Step Tag */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold tracking-[0.18em] text-amber-400 uppercase">
              STEP {stepLabel}
            </span>
          </div>

          {/* Heading & Subtitle */}
          <h1 className="text-2xl sm:text-[28px] font-extrabold text-white tracking-tight leading-tight mb-1">
            {stepTitle}
          </h1>
          <p className="text-xs sm:text-[13px] text-neutral-400 mb-3 sm:mb-4 leading-relaxed line-clamp-2">
            {stepSub}
          </p>

          {/* Step 1: Email Form */}
          {step === 'email' && (
            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="reg-email" className="text-[11px] font-medium text-neutral-300 tracking-wide">
                  Email Address <span className="text-amber-400">*</span>
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 pointer-events-none" />
                  <input
                    id="reg-email"
                    type="email"
                    {...emailForm.register('email')}
                    placeholder="you@studio.com"
                    className={`w-full py-2.5 pl-10 pr-3.5 rounded-xl bg-neutral-900 border text-xs sm:text-sm text-white placeholder:text-neutral-600 focus:outline-none transition-all ${
                      emailForm.formState.errors.email
                        ? 'border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/40'
                        : 'border-neutral-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40'
                    }`}
                    autoFocus
                  />
                </div>
                {emailForm.formState.errors.email && (
                  <div className="flex items-center gap-1.5 text-rose-400 text-[11px] mt-0.5">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{emailForm.formState.errors.email.message}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isEmailLoading}
                className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs sm:text-sm tracking-wide transition-all shadow-md shadow-amber-400/20 active:scale-[0.99] flex items-center justify-center gap-2 mt-1 cursor-pointer disabled:opacity-50"
              >
                {isEmailLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.2]" />
                  </>
                )}
              </button>

              <p className="text-center text-xs text-neutral-500 mt-2">
                Already have an account?{' '}
                <Link to="/login" className="text-amber-400 font-semibold hover:text-amber-300 transition-colors">
                  Sign in
                </Link>
              </p>
            </form>
          )}

          {/* Step 2: OTP Form */}
          {step === 'otp' && (
            <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="flex flex-col gap-3">
              <div className="flex gap-2 justify-between my-1">
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    id={`reg-otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className={`w-11 h-12 sm:w-12 sm:h-14 text-center rounded-xl font-mono text-lg font-bold outline-none transition-all ${
                      digit
                        ? 'bg-amber-400/10 border border-amber-400 text-amber-400'
                        : 'bg-neutral-900 border border-neutral-800 text-white focus:border-amber-400'
                    }`}
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              {otpForm.formState.errors.otp && (
                <div className="flex items-center gap-1.5 text-rose-400 text-[11px] justify-center">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{otpForm.formState.errors.otp.message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isOtpLoading || otpDigits.join('').length < 6}
                className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs sm:text-sm tracking-wide transition-all shadow-md shadow-amber-400/20 active:scale-[0.99] flex items-center justify-center gap-2 mt-1 cursor-pointer disabled:opacity-50"
              >
                {isOtpLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
                ) : (
                  <>
                    <span>Verify Email</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.2]" />
                  </>
                )}
              </button>

              <p className="text-center text-xs text-neutral-500 mt-2">
                Didn't get the code?{' '}
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendOtpMutation.isPending}
                  className="text-amber-400 font-semibold hover:text-amber-300 cursor-pointer disabled:opacity-50"
                >
                  {resendOtpMutation.isPending ? 'Sending...' : 'Resend'}
                </button>
                {' · '}
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="text-neutral-400 hover:text-white cursor-pointer"
                >
                  Change email
                </button>
              </p>
            </form>
          )}

          {/* Step 3: Profile Setup Form (Zod validated, Phone and Occupation required) */}
          {step === 'profile' && (
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="flex flex-col gap-2.5 sm:gap-3">
              {/* Profile Photo Upload Card */}
              <div className="p-2.5 sm:p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 hover:border-amber-400/30 transition-all duration-300">
                <div className="flex items-center gap-3">
                  {/* Clickable Avatar Dropzone */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingAvatar(true);
                    }}
                    onDragLeave={() => setIsDraggingAvatar(false)}
                    onDrop={handleDropAvatar}
                    className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 cursor-pointer group transition-all duration-200 ${
                      avatarPreview
                        ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-neutral-950 shadow-md shadow-amber-500/20'
                        : isDraggingAvatar
                        ? 'border-2 border-dashed border-amber-400 bg-amber-400/10 scale-105'
                        : 'border-2 border-dashed border-neutral-700 hover:border-amber-400 bg-neutral-800/60'
                    }`}
                    title="Click or drag image to upload"
                  >
                    {avatarPreview ? (
                      <>
                        <img
                          src={avatarPreview}
                          alt="Profile Preview"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[9px] font-semibold gap-0.5">
                          <Camera className="w-3.5 h-3.5 text-amber-400" />
                          <span>Change</span>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 group-hover:text-amber-400 transition-colors p-1 text-center">
                        <UploadCloud className="w-5 h-5 mb-0.5 text-neutral-400 group-hover:text-amber-400 group-hover:scale-110 transition-all" />
                        <span className="text-[9px] font-semibold tracking-wide leading-none">Upload</span>
                      </div>
                    )}
                  </div>

                  {/* Metadata & Actions */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-white tracking-wide">
                        Profile Picture
                      </span>
                      <span className="text-neutral-500 font-normal text-[10px]">(optional)</span>
                      {avatarPreview && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 font-medium border border-emerald-500/30">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Set
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-tight truncate mt-0.5">
                      Upload portrait or studio avatar (JPG, PNG up to 5MB)
                    </p>

                    <div className="flex items-center gap-2 mt-1.5">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 text-[11px] font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                      >
                        <UploadCloud className="w-3 h-3 stroke-[2.2]" />
                        <span>{avatarPreview ? 'Change' : 'Upload Photo'}</span>
                      </button>

                      {avatarPreview && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="px-2 py-1 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-neutral-800/80 text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={handleAvatarFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Your Name (Required) */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-neutral-300 tracking-wide">
                  Your Name <span className="text-amber-400">*</span>
                </label>
                <div className="relative flex items-center">
                  <User className="w-3.5 h-3.5 text-neutral-500 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    {...profileForm.register('name')}
                    placeholder="e.g. Sarang Varma"
                    className={`w-full py-2 pl-9 pr-3 rounded-xl bg-neutral-900 border text-xs sm:text-sm text-white placeholder:text-neutral-600 outline-none transition-all ${
                      profileForm.formState.errors.name
                        ? 'border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/40'
                        : 'border-neutral-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40'
                    }`}
                  />
                </div>
                {profileForm.formState.errors.name && (
                  <div className="flex items-center gap-1.5 text-rose-400 text-[11px] mt-0.5">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{profileForm.formState.errors.name.message}</span>
                  </div>
                )}
              </div>

              {/* Phone Number & Occupation 2-Column Grid (Both Required) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                {/* Phone Number with Country Code Dropdown */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-neutral-300 tracking-wide">
                    Phone Number <span className="text-amber-400">*</span>
                  </label>
                  <div className="relative">
                    <Controller
                      name="phone"
                      control={profileForm.control}
                      render={({ field }) => (
                        <PhoneInput
                          international
                          defaultCountry="US"
                          value={field.value}
                          onChange={(val) => field.onChange(val || '')}
                          placeholder="+1 (555) 000-0000"
                          className={`custom-phone-input ${
                            profileForm.formState.errors.phone ? 'is-error' : ''
                          }`}
                        />
                      )}
                    />
                  </div>
                  {profileForm.formState.errors.phone && (
                    <div className="flex items-center gap-1.5 text-rose-400 text-[11px] mt-0.5">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{profileForm.formState.errors.phone.message}</span>
                    </div>
                  )}
                </div>

                {/* Occupation */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-neutral-300 tracking-wide">
                    Occupation <span className="text-amber-400">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Briefcase className="w-3.5 h-3.5 text-neutral-500 absolute left-3 pointer-events-none" />
                    <input
                      type="text"
                      {...profileForm.register('occupation')}
                      placeholder="e.g. Wedding Photographer"
                      className={`w-full py-2 pl-9 pr-3 rounded-xl bg-neutral-900 border text-xs sm:text-sm text-white placeholder:text-neutral-600 outline-none transition-all ${
                        profileForm.formState.errors.occupation
                          ? 'border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/40'
                          : 'border-neutral-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40'
                      }`}
                    />
                  </div>
                  {profileForm.formState.errors.occupation && (
                    <div className="flex items-center gap-1.5 text-rose-400 text-[11px] mt-0.5">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{profileForm.formState.errors.occupation.message}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Enter Workspace Button */}
              <button
                type="submit"
                disabled={isProfileLoading}
                className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs sm:text-sm tracking-wide transition-all shadow-md shadow-amber-400/20 active:scale-[0.99] flex items-center justify-center gap-2 mt-1 sm:mt-2 cursor-pointer disabled:opacity-50"
              >
                {isProfileLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
                ) : (
                  <>
                    <span>Enter Workspace</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.2]" />
                  </>
                )}
              </button>
            </form>
          )}
        </main>

        {/* Footer */}
        <footer className="shrink-0 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-neutral-500">
          <div className="flex flex-col gap-0.5">
            <div className="w-5 h-0.5 bg-amber-400 mb-1" />
            <span className="text-[9px] font-semibold tracking-wider text-neutral-400 uppercase">
              FOR PHOTOGRAPHERS
            </span>
            <span className="text-[8px] font-medium tracking-wider text-neutral-500 uppercase">
              BY PHOTOGRAPHERS
            </span>
          </div>
          <div className="flex items-center gap-2 text-[9px] font-semibold tracking-widest text-neutral-500">
            <span>STORE</span>
            <span className="text-neutral-700">•</span>
            <span>SHARE</span>
            <span className="text-neutral-700">•</span>
            <span>GROW</span>
          </div>
        </footer>
      </div>

      {/* RIGHT PANEL */}
      <div className="hidden lg:block flex-1 h-full relative overflow-hidden bg-neutral-950 select-none">
        <img
          src="/auth_side_panel.jpg"
          alt="Ex Studio Photography Platform"
          className="w-full h-full object-cover object-center"
        />
        {/* Subtle Bottom Vignette / Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/20 to-transparent flex flex-col justify-end p-8">
          <div className="flex items-center justify-center gap-8 xl:gap-12 p-4 rounded-2xl bg-neutral-950/40 backdrop-blur-md border border-white/10 max-w-lg mx-auto">
            <div className="flex flex-col items-center gap-1.5 text-center text-neutral-300">
              <FolderOpen className="w-5 h-5 text-amber-400" />
              <span className="text-[11px] font-medium leading-tight">
                Organize<br />Your Work
              </span>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex flex-col items-center gap-1.5 text-center text-neutral-300">
              <Cloud className="w-5 h-5 text-amber-400" />
              <span className="text-[11px] font-medium leading-tight">
                Secure Cloud<br />Storage
              </span>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex flex-col items-center gap-1.5 text-center text-neutral-300">
              <Users className="w-5 h-5 text-amber-400" />
              <span className="text-[11px] font-medium leading-tight">
                Share with<br />Clients
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
