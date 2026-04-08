import { z } from "zod/v4";

// Обновление профиля
export const updateProfileSchema = z.object({
  displayName: z.string()
    .min(1, "Отображаемое имя не может быть пустым")
    .max(100, "Отображаемое имя не должно превышать 100 символов")
    .optional(),
  bio: z.string()
    .max(500, "Биография не должна превышать 500 символов")
    .optional(),
  country: z.string()
    .length(2, "Код страны должен состоять из 2 букв")
    .optional(),
  timezone: z.string().optional(),
  avatarUrl: z.string().url("Некорректный URL аватара").optional().nullable(),
});

// Предпочтения пользователя
export const userPreferencesSchema = z.object({
  theme: z.enum(["light", "dark", "auto"]).default("auto"),
  language: z.string().default("ru"),
  notifications: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(true),
    friendRequests: z.boolean().default(true),
    gameInvites: z.boolean().default(true),
  }).default({}),
  gameSettings: z.object({
    soundVolume: z.number().min(0).max(100).default(70),
    musicVolume: z.number().min(0).max(100).default(50),
    animationSpeed: z.enum(["slow", "normal", "fast"]).default("normal"),
    showHints: z.boolean().default(true),
    autoSaveReplays: z.boolean().default(true),
  }).default({}),
  privacy: z.object({
    profileVisible: z.enum(["public", "friends", "private"]).default("public"),
    gameHistoryVisible: z.enum(["public", "friends", "private"]).default("public"),
    onlineStatusVisible: z.boolean().default(true),
  }).default({}),
});

// Поиск пользователей
export const searchUsersSchema = z.object({
  query: z.string().min(1, "Поисковый запрос не может быть пустым"),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

// Полный профиль пользователя
export const userProfileSchema = z.object({
  id: z.string(),
  username: z.string(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  bio: z.string().nullable(),
  country: z.string().nullable(),
  timezone: z.string().nullable(),
  rating: z.number(),
  gamesPlayed: z.number(),
  gamesWon: z.number(),
  gamesLost: z.number(),
  gamesDraw: z.number(),
  winRate: z.number(),
  createdAt: z.string().datetime(),
  lastLoginAt: z.string().datetime().nullable(),
  preferences: userPreferencesSchema,
});

// Краткий профиль для списков
export const userShortProfileSchema = z.object({
  id: z.string(),
  username: z.string(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  rating: z.number(),
  gamesPlayed: z.number(),
  winRate: z.number(),
  isOnline: z.boolean(),
});

// Друзья
export const friendSchema = z.object({
  id: z.string(),
  status: z.enum(["pending", "accepted", "blocked"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  user: userShortProfileSchema,
});

// Запрос на добавление в друзья
export const addFriendSchema = z.object({
  friendId: z.string(),
});

// Ответ на запрос дружбы
export const respondToFriendRequestSchema = z.object({
  requestId: z.string(),
  accept: z.boolean(),
});

// Игровая статистика
export const gameStatSchema = z.object({
  id: z.string(),
  gameId: z.string(),
  role: z.string(),
  result: z.enum(["win", "loss", "draw"]).nullable(),
  moves: z.number(),
  timeSpent: z.number(),
  ratingChange: z.number(),
  stats: z.record(z.any()),
  createdAt: z.string().datetime(),
});

// История игр
export const gameHistorySchema = z.object({
  gameId: z.string(),
  opponent: userShortProfileSchema,
  result: z.enum(["win", "loss", "draw"]),
  ratingChange: z.number(),
  moves: z.number(),
  duration: z.number(),
  createdAt: z.string().datetime(),
});

// Рейтинговая таблица
export const leaderboardEntrySchema = z.object({
  rank: z.number(),
  user: userShortProfileSchema,
  rating: z.number(),
  gamesPlayed: z.number(),
  winRate: z.number(),
  streak: z.number().nullable(),
});

// Пагинация
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  total: z.number().min(0),
  totalPages: z.number().min(0),
});

export const paginatedResponseSchema = <T extends z.ZodType>(schema: T) => 
  z.object({
    items: z.array(schema),
    pagination: paginationSchema,
  });

// Ответы API
export const updateProfileResponseSchema = z.object({
  user: userProfileSchema,
});

export const searchUsersResponseSchema = paginatedResponseSchema(userShortProfileSchema);

export const getUserProfileResponseSchema = z.object({
  profile: userProfileSchema,
  isFriend: z.boolean(),
  friendshipStatus: z.enum(["none", "pending", "accepted", "blocked"]).optional(),
});

export const getFriendsResponseSchema = z.object({
  friends: z.array(friendSchema),
  pendingRequests: z.array(friendSchema),
});

export const getGameHistoryResponseSchema = paginatedResponseSchema(gameHistorySchema);

export const getLeaderboardResponseSchema = paginatedResponseSchema(leaderboardEntrySchema);

export const preferencesResponseSchema = z.object({
  preferences: userPreferencesSchema,
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type SearchUsersInput = z.infer<typeof searchUsersSchema>;
export type AddFriendInput = z.infer<typeof addFriendSchema>;
export type RespondToFriendRequestInput = z.infer<typeof respondToFriendRequestSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
export type UserShortProfile = z.infer<typeof userShortProfileSchema>;
export type Friend = z.infer<typeof friendSchema>;
export type GameStat = z.infer<typeof gameStatSchema>;
export type GameHistory = z.infer<typeof gameHistorySchema>;
export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;
export type UserPreferences = z.infer<typeof userPreferencesSchema>;