import { z } from 'zod';

export const emailSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address (e.g. name@studio.com)'),
});

export type EmailFormData = z.infer<typeof emailSchema>;

export const otpSchema = z.object({
  otp: z
    .string()
    .trim()
    .length(6, 'Verification code must be 6 digits')
    .regex(/^\d{6}$/, 'Verification code must contain digits only'),
});

export type OtpFormData = z.infer<typeof otpSchema>;

export const profileSetupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Your name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(80, 'Name is too long (max 80 characters)'),
  phone: z
    .string()
    .trim()
    .min(1, 'Phone number is required')
    .refine((val) => {
      if (!val || val.trim() === '') return false;
      const clean = val.replace(/[\s\-().]/g, '');
      return clean.length >= 7 && clean.length <= 18 && /^(\+)?[0-9]+$/.test(clean);
    }, {
      message: 'Please enter a valid phone number with country code',
    }),
  occupation: z
    .string()
    .trim()
    .min(1, 'Occupation is required')
    .min(2, 'Occupation must be at least 2 characters')
    .max(80, 'Occupation is too long (max 80 characters)'),
});

export type ProfileSetupFormData = z.infer<typeof profileSetupSchema>;

export const personalInformationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(80, 'Name is too long (max 80 characters)'),
  phone: z
    .string()
    .trim()
    .min(1, 'Phone number is required')
    .refine((val) => {
      if (!val || val.trim() === '') return false;
      const clean = val.replace(/[\s\-().]/g, '');
      return clean.length >= 7 && clean.length <= 18 && /^(\+)?[0-9]+$/.test(clean);
    }, {
      message: 'Please enter a valid phone number with country code',
    }),
  email: z
    .string()
    .trim()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address (e.g. name@example.com)'),
  occupation: z
    .string()
    .trim()
    .min(1, 'Occupation is required')
    .min(2, 'Occupation must be at least 2 characters')
    .max(80, 'Occupation is too long (max 80 characters)'),
});

export type PersonalInformationFormData = z.infer<typeof personalInformationSchema>;
