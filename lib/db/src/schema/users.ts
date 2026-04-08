import { pgTable, text, timestamp, uuid, boolean, integer, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Таблица пользователей
export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  
  // Аутентификация (hash и salt для JWT)
  passwordHash: text("password_hash"),
  salt: text("salt"),
  
  // Социальные данные
  bio: text("bio"),
  country: text("country"),
  timezone: text("timezone"),
  
  // Статистика и рейтинг
  rating: integer("rating").notNull().default(1200), // ELO рейтинг
  gamesPlayed: integer("games_played").notNull().default(0),
  gamesWon: integer("games_won").notNull().default(0),
  gamesLost: integer("games_lost").notNull().default(0),
  gamesDraw: integer("games_draw").notNull().default(0),
  
  // Настройки
  preferences: jsonb("preferences").default({}),
  emailVerified: boolean("email_verified").notNull().default(false),
  
  // Безопасность
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  role: text("role").notNull().default("user"), // user, moderator, admin
  
  // Метаданные
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  usernameIdx: uniqueIndex("users_username_idx").on(table.username),
  emailIdx: uniqueIndex("users_email_idx").on(table.email),
}));

// Таблица сессий (для JWT/refresh токенов)
export const sessionsTable = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  refreshToken: text("refresh_token").notNull(),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  refreshTokenIdx: uniqueIndex("sessions_refresh_token_idx").on(table.refreshToken),
}));

// Таблица друзей
export const friendsTable = pgTable("friends", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  friendId: uuid("friend_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"), // pending, accepted, blocked
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  uniqueFriendshipIdx: uniqueIndex("friends_unique_idx").on(table.userId, table.friendId),
}));

// Таблица игровой статистики по сессиям
export const gameStatsTable = pgTable("game_stats", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  gameId: text("game_id").notNull().references(() => import("./games").gamesTable.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // player1, player2, spectator
  result: text("result"), // win, loss, draw
  moves: integer("moves").notNull().default(0),
  timeSpent: integer("time_spent").notNull().default(0), // в секундах
  ratingChange: integer("rating_change").notNull().default(0),
  
  // Подробная статистика игры
  stats: jsonb("stats").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Zod схемы
export const insertUserSchema = createInsertSchema(usersTable, {
  email: z.string().email(),
  username: z.string().min(3).max(50),
  displayName: z.string().min(1).max(100).optional(),
  rating: z.number().int().min(0).default(1200),
}).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  passwordHash: true,
  salt: true,
  emailVerified: true,
  isActive: true,
  role: true,
});

export const updateUserSchema = createInsertSchema(usersTable, {
  email: z.string().email().optional(),
  username: z.string().min(3).max(50).optional(),
  displayName: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  country: z.string().max(2).optional(),
  timezone: z.string().optional(),
  preferences: z.record(z.any()).optional(),
}).partial().omit({ 
  id: true,
  createdAt: true,
  updatedAt: true,
  passwordHash: true,
  salt: true,
  emailVerified: true,
  rating: true,
  gamesPlayed: true,
  gamesWon: true,
  gamesLost: true,
  gamesDraw: true,
  role: true,
});

export const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type User = typeof usersTable.$inferSelect;
export type Session = typeof sessionsTable.$inferSelect;
export type Friend = typeof friendsTable.$inferSelect;
export type GameStat = typeof gameStatsTable.$inferSelect;