import { eq, and, or, desc, asc, sql } from "drizzle-orm";
import { db } from "../index";
import { usersTable, sessionsTable, friendsTable, gameStatsTable } from "../schema/users";
import { gamesTable } from "../schema/games";
import { type InsertUser, type UpdateUser, type User, type Session, type Friend, type GameStat } from "../schema/users";

export class UserRepository {
  // === Основные CRUD операции ===
  
  async create(userData: InsertUser & { passwordHash: string; salt: string }): Promise<User> {
    const [user] = await db.insert(usersTable).values({
      ...userData,
      emailVerified: false,
      isActive: true,
      role: "user",
    }).returning();
    
    return user;
  }

  async findById(id: string): Promise<User | null> {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    return user || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    return user || null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
    return user || null;
  }

  async update(id: string, userData: UpdateUser): Promise<User | null> {
    const [user] = await db.update(usersTable)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(usersTable.id, id))
      .returning();
    
    return user || null;
  }

  async updatePassword(id: string, passwordHash: string, salt: string): Promise<void> {
    await db.update(usersTable)
      .set({ passwordHash, salt, updatedAt: new Date() })
      .where(eq(usersTable.id, id));
  }

  async delete(id: string): Promise<boolean> {
    const [user] = await db.delete(usersTable)
      .where(eq(usersTable.id, id))
      .returning();
    
    return !!user;
  }

  async updateLastLogin(id: string): Promise<void> {
    await db.update(usersTable)
      .set({ lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(usersTable.id, id));
  }

  async verifyEmail(id: string): Promise<void> {
    await db.update(usersTable)
      .set({ emailVerified: true, updatedAt: new Date() })
      .where(eq(usersTable.id, id));
  }

  // === Сессии ===

  async createSession(sessionData: Omit<Session, "id" | "createdAt">): Promise<Session> {
    const [session] = await db.insert(sessionsTable).values(sessionData).returning();
    return session;
  }

  async findSessionByRefreshToken(refreshToken: string): Promise<Session | null> {
    const [session] = await db.select()
      .from(sessionsTable)
      .where(eq(sessionsTable.refreshToken, refreshToken))
      .limit(1);
    
    return session || null;
  }

  async deleteSession(id: string): Promise<boolean> {
    const [session] = await db.delete(sessionsTable)
      .where(eq(sessionsTable.id, id))
      .returning();
    
    return !!session;
  }

  async deleteAllUserSessions(userId: string): Promise<void> {
    await db.delete(sessionsTable).where(eq(sessionsTable.userId, userId));
  }

  async deleteExpiredSessions(): Promise<void> {
    await db.delete(sessionsTable).where(sql`expires_at < NOW()`);
  }

  // === Друзья ===

  async createFriendRequest(userId: string, friendId: string): Promise<Friend> {
    const [friend] = await db.insert(friendsTable).values({
      userId,
      friendId,
      status: "pending",
    }).returning();
    
    return friend;
  }

  async acceptFriendRequest(userId: string, friendId: string): Promise<Friend | null> {
    const [friend] = await db.update(friendsTable)
      .set({ status: "accepted", updatedAt: new Date() })
      .where(and(
        eq(friendsTable.userId, friendId),
        eq(friendsTable.friendId, userId),
        eq(friendsTable.status, "pending")
      ))
      .returning();
    
    // Создаем обратную запись для симметрии
    if (friend) {
      await db.insert(friendsTable).values({
        userId,
        friendId,
        status: "accepted",
      }).onConflictDoNothing();
    }
    
    return friend || null;
  }

  async rejectFriendRequest(userId: string, friendId: string): Promise<boolean> {
    const [friend] = await db.delete(friendsTable)
      .where(and(
        eq(friendsTable.userId, friendId),
        eq(friendsTable.friendId, userId),
        eq(friendsTable.status, "pending")
      ))
      .returning();
    
    return !!friend;
  }

  async blockUser(userId: string, blockedUserId: string): Promise<Friend> {
    // Удаляем существующие записи о дружбе
    await db.delete(friendsTable).where(or(
      and(eq(friendsTable.userId, userId), eq(friendsTable.friendId, blockedUserId)),
      and(eq(friendsTable.userId, blockedUserId), eq(friendsTable.friendId, userId))
    ));

    // Создаем запись о блокировке
    const [block] = await db.insert(friendsTable).values({
      userId,
      friendId: blockedUserId,
      status: "blocked",
    }).returning();
    
    return block;
  }

  async getFriends(userId: string, status: "accepted" | "pending" = "accepted"): Promise<Array<Friend & { friend: User }>> {
    const friends = await db.select({
      friend: usersTable,
      friendship: friendsTable,
    })
    .from(friendsTable)
    .innerJoin(usersTable, eq(friendsTable.friendId, usersTable.id))
    .where(and(
      eq(friendsTable.userId, userId),
      eq(friendsTable.status, status)
    ))
    .orderBy(asc(usersTable.displayName));
    
    return friends.map(f => ({ ...f.friendship, friend: f.friend }));
  }

  async getFriendRequests(userId: string): Promise<Array<Friend & { user: User }>> {
    const requests = await db.select({
      user: usersTable,
      friendship: friendsTable,
    })
    .from(friendsTable)
    .innerJoin(usersTable, eq(friendsTable.userId, usersTable.id))
    .where(and(
      eq(friendsTable.friendId, userId),
      eq(friendsTable.status, "pending")
    ))
    .orderBy(desc(friendsTable.createdAt));
    
    return requests.map(r => ({ ...r.friendship, user: r.user }));
  }

  async isFriend(userId: string, friendId: string): Promise<boolean> {
    const [friend] = await db.select()
      .from(friendsTable)
      .where(and(
        eq(friendsTable.userId, userId),
        eq(friendsTable.friendId, friendId),
        eq(friendsTable.status, "accepted")
      ))
      .limit(1);
    
    return !!friend;
  }

  async removeFriend(userId: string, friendId: string): Promise<void> {
    await db.delete(friendsTable).where(or(
      and(eq(friendsTable.userId, userId), eq(friendsTable.friendId, friendId)),
      and(eq(friendsTable.userId, friendId), eq(friendsTable.friendId, userId))
    ));
  }

  // === Игровая статистика ===

  async createGameStat(statData: Omit<GameStat, "id" | "createdAt">): Promise<GameStat> {
    const [stat] = await db.insert(gameStatsTable).values(statData).returning();
    return stat;
  }

  async getUserStats(userId: string, limit = 10, offset = 0): Promise<Array<GameStat & { game: typeof gamesTable.$inferSelect }>> {
    const stats = await db.select({
      stat: gameStatsTable,
      game: gamesTable,
    })
    .from(gameStatsTable)
    .innerJoin(gamesTable, eq(gameStatsTable.gameId, gamesTable.id))
    .where(eq(gameStatsTable.userId, userId))
    .orderBy(desc(gameStatsTable.createdAt))
    .limit(limit)
    .offset(offset);
    
    return stats.map(s => ({ ...s.stat, game: s.game }));
  }

  async getUserRatingHistory(userId: string, days = 30): Promise<Array<{ date: string; rating: number }>> {
    const history = await db.select({
      date: sql<string>`DATE(${gameStatsTable.createdAt})`,
      rating: sql<number>`AVG(${usersTable.rating})`,
    })
    .from(gameStatsTable)
    .innerJoin(usersTable, eq(gameStatsTable.userId, usersTable.id))
    .where(and(
      eq(gameStatsTable.userId, userId),
      sql`${gameStatsTable.createdAt} >= NOW() - INTERVAL '${days} days'`
    ))
    .groupBy(sql`DATE(${gameStatsTable.createdAt})`)
    .orderBy(sql`DATE(${gameStatsTable.createdAt})`);
    
    return history;
  }

  // === Поиск и пагинация ===

  async searchUsers(query: string, limit = 20, offset = 0): Promise<User[]> {
    const users = await db.select()
      .from(usersTable)
      .where(or(
        sql`LOWER(${usersTable.username}) LIKE LOWER(${`%${query}%`})`,
        sql`LOWER(${usersTable.displayName}) LIKE LOWER(${`%${query}%`})`
      ))
      .orderBy(asc(usersTable.username))
      .limit(limit)
      .offset(offset);
    
    return users;
  }

  async getLeaderboard(limit = 50, offset = 0): Promise<User[]> {
    const leaders = await db.select()
      .from(usersTable)
      .where(and(
        eq(usersTable.isActive, true),
        sql`${usersTable.gamesPlayed} >= 5` // Минимум 5 игр для попадания в рейтинг
      ))
      .orderBy(desc(usersTable.rating))
      .limit(limit)
      .offset(offset);
    
    return leaders;
  }

  // === Административные функции ===

  async deactivateUser(id: string): Promise<User | null> {
    const [user] = await db.update(usersTable)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(usersTable.id, id))
      .returning();
    
    return user || null;
  }

  async changeRole(id: string, role: "user" | "moderator" | "admin"): Promise<User | null> {
    const [user] = await db.update(usersTable)
      .set({ role, updatedAt: new Date() })
      .where(eq(usersTable.id, id))
      .returning();
    
    return user || null;
  }

  async getActiveUsersCount(): Promise<number> {
    const [result] = await db.select({ count: sql<number>`COUNT(*)` })
      .from(usersTable)
      .where(eq(usersTable.isActive, true));
    
    return result.count;
  }

  async getNewUsersCount(days = 7): Promise<number> {
    const [result] = await db.select({ count: sql<number>`COUNT(*)` })
      .from(usersTable)
      .where(sql`${usersTable.createdAt} >= NOW() - INTERVAL '${days} days'`);
    
    return result.count;
  }
}