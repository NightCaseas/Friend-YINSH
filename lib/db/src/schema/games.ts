import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const gamesTable = pgTable("games", {
  id: text("id").primaryKey(),
  status: text("status").notNull().default("waiting"),
  currentPlayer: text("current_player"),
  winner: text("winner"),
  gameState: text("game_state"),
  
  // Связь с пользователями
  user1Id: uuid("user1_id").references(() => usersTable.id),
  user2Id: uuid("user2_id").references(() => usersTable.id),
  createdBy: uuid("created_by").references(() => usersTable.id),
  
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertGameSchema = createInsertSchema(gamesTable).omit({ createdAt: true, updatedAt: true });
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof gamesTable.$inferSelect;
