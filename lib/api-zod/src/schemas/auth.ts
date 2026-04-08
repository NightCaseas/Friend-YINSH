import { z } from "zod/v4";

// Регистрация
export const registerSchema = z.object({
  email: z.string().email("Некорректный email"),
  username: z.string()
    .min(3, "Имя пользователя должно содержать минимум 3 символа")
    .max(50, "Имя пользователя не должно превышать 50 символов")
    .regex(/^[a-zA-Z0-9_-]+$/, "Имя пользователя может содержать только буквы, цифры, дефисы и подчеркивания"),
  password: z.string()
    .min(8, "Пароль должен содержать минимум 8 символов")
    .regex(/[A-Z]/, "Пароль должен содержать хотя бы одну заглавную букву")
    .regex(/[a-z]/, "Пароль должен содержать хотя бы одну строчную букву")
    .regex(/[0-9]/, "Пароль должен содержать хотя бы одну цифру"),
  displayName: z.string()
    .min(1, "Отображаемое имя не может быть пустым")
    .max(100, "Отображаемое имя не должно превышать 100 символов")
    .optional(),
});

// Вход
export const loginSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(1, "Пароль не может быть пустым"),
});

// Обновление токена
export const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

// Выход
export const logoutSchema = z.object({
  refreshToken: z.string().optional(),
});

// Изменение пароля
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Текущий пароль не может быть пустым"),
  newPassword: z.string()
    .min(8, "Новый пароль должен содержать минимум 8 символов")
    .regex(/[A-Z]/, "Новый пароль должен содержать хотя бы одну заглавную букву")
    .regex(/[a-z]/, "Новый пароль должен содержать хотя бы одну строчную букву")
    .regex(/[0-9]/, "Новый пароль должен содержать хотя бы одну цифру"),
});

// Запрос сброса пароля
export const requestPasswordResetSchema = z.object({
  email: z.string().email("Некорректный email"),
});

// Сброс пароля
export const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string()
    .min(8, "Новый пароль должен содержать минимум 8 символов")
    .regex(/[A-Z]/, "Новый пароль должен содержать хотя бы одну заглавную букву")
    .regex(/[a-z]/, "Новый пароль должен содержать хотя бы одну строчную букву")
    .regex(/[0-9]/, "Новый пароль должен содержать хотя бы одну цифру"),
});

// Верификация email
export const verifyEmailSchema = z.object({
  token: z.string(),
});

// Ответы API
export const authResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    username: z.string(),
    displayName: z.string().optional(),
    avatarUrl: z.string().nullable(),
    rating: z.number(),
    gamesPlayed: z.number(),
    gamesWon: z.number(),
    gamesLost: z.number(),
    gamesDraw: z.number(),
    role: z.string(),
    createdAt: z.string().datetime(),
  }),
});

export const tokenResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export const messageResponseSchema = z.object({
  message: z.string(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
export type TokenResponse = z.infer<typeof tokenResponseSchema>;
export type MessageResponse = z.infer<typeof messageResponseSchema>;