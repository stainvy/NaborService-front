import { z } from 'zod';
import type { TFunction } from 'i18next';

// Schémas construits avec `t` pour des messages traduits (aucune chaîne en dur).
// Règle unique pour tous les mots de passe (création, reset, changement) : min 12.

export function registerSchema(t: TFunction) {
  return z.object({
    firstName: z.string().trim().min(1, t('validation.required')).max(100),
    lastName: z.string().trim().min(1, t('validation.required')).max(100),
    email: z.string().trim().email(t('validation.email_invalid')).max(255),
    password: z
      .string()
      .min(12, t('validation.password_min', { count: 12 }))
      .max(128, t('validation.password_max', { count: 128 })),
  });
}
export type RegisterForm = z.infer<ReturnType<typeof registerSchema>>;

export function loginSchema(t: TFunction) {
  return z.object({
    email: z.string().trim().email(t('validation.email_invalid')),
    password: z.string().min(1, t('validation.required')),
  });
}
export type LoginForm = z.infer<ReturnType<typeof loginSchema>>;

export function forgotPasswordSchema(t: TFunction) {
  return z.object({
    email: z.string().trim().email(t('validation.email_invalid')),
  });
}
export type ForgotPasswordForm = z.infer<ReturnType<typeof forgotPasswordSchema>>;

export function resetPasswordSchema(t: TFunction) {
  return z
    .object({
      password: z.string().min(12, t('validation.password_min', { count: 12 })),
      confirm: z.string(),
    })
    .refine((data) => data.password === data.confirm, {
      message: t('validation.password_mismatch'),
      path: ['confirm'],
    });
}
export type ResetPasswordForm = z.infer<ReturnType<typeof resetPasswordSchema>>;
