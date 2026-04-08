-- Migration: 001_add_users_tables
-- Description: Добавление таблиц для системы пользователей, аутентификации и друзей

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    
    -- Аутентификация
    password_hash TEXT,
    salt TEXT,
    
    -- Социальные данные
    bio TEXT,
    country TEXT,
    timezone TEXT,
    
    -- Статистика и рейтинг
    rating INTEGER NOT NULL DEFAULT 1200,
    games_played INTEGER NOT NULL DEFAULT 0,
    games_won INTEGER NOT NULL DEFAULT 0,
    games_lost INTEGER NOT NULL DEFAULT 0,
    games_draw INTEGER NOT NULL DEFAULT 0,
    
    -- Настройки
    preferences JSONB DEFAULT '{}',
    email_verified BOOLEAN NOT NULL DEFAULT false,
    
    -- Безопасность
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMPTZ,
    role TEXT NOT NULL DEFAULT 'user',
    
    -- Метаданные
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Индексы для таблицы users
CREATE UNIQUE INDEX IF NOT EXISTS users_username_idx ON users(username);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_rating_idx ON users(rating DESC);
CREATE INDEX IF NOT EXISTS users_created_at_idx ON users(created_at DESC);

-- Таблица сессий
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token TEXT NOT NULL UNIQUE,
    user_agent TEXT,
    ip_address TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Индексы для таблицы sessions
CREATE UNIQUE INDEX IF NOT EXISTS sessions_refresh_token_idx ON sessions(refresh_token);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);

-- Таблица друзей
CREATE TABLE IF NOT EXISTS friends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Индексы для таблицы friends
CREATE UNIQUE INDEX IF NOT EXISTS friends_unique_idx ON friends(user_id, friend_id);
CREATE INDEX IF NOT EXISTS friends_user_id_idx ON friends(user_id);
CREATE INDEX IF NOT EXISTS friends_friend_id_idx ON friends(friend_id);
CREATE INDEX IF NOT EXISTS friends_status_idx ON friends(status);

-- Таблица игровой статистики
CREATE TABLE IF NOT EXISTS game_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    result TEXT,
    moves INTEGER NOT NULL DEFAULT 0,
    time_spent INTEGER NOT NULL DEFAULT 0,
    rating_change INTEGER NOT NULL DEFAULT 0,
    stats JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Индексы для таблицы game_stats
CREATE INDEX IF NOT EXISTS game_stats_user_id_idx ON game_stats(user_id);
CREATE INDEX IF NOT EXISTS game_stats_game_id_idx ON game_stats(game_id);
CREATE INDEX IF NOT EXISTS game_stats_created_at_idx ON game_stats(created_at DESC);
CREATE INDEX IF NOT EXISTS game_stats_user_game_idx ON game_stats(user_id, game_id);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для автоматического обновления updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friends_updated_at BEFORE UPDATE ON friends
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Процедура для обновления статистики пользователя после игры
CREATE OR REPLACE FUNCTION update_user_stats_after_game()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.result = 'win' THEN
        UPDATE users SET 
            games_played = games_played + 1,
            games_won = games_won + 1,
            rating = rating + NEW.rating_change,
            updated_at = NOW()
        WHERE id = NEW.user_id;
    ELSIF NEW.result = 'loss' THEN
        UPDATE users SET 
            games_played = games_played + 1,
            games_lost = games_lost + 1,
            rating = rating + NEW.rating_change,
            updated_at = NOW()
        WHERE id = NEW.user_id;
    ELSIF NEW.result = 'draw' THEN
        UPDATE users SET 
            games_played = games_played + 1,
            games_draw = games_draw + 1,
            rating = rating + NEW.rating_change,
            updated_at = NOW()
        WHERE id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для автоматического обновления статистики
CREATE TRIGGER update_stats_after_game AFTER INSERT ON game_stats
    FOR EACH ROW EXECUTE FUNCTION update_user_stats_after_game();

-- Добавляем колонку user_id в таблицу games для связи с пользователями
ALTER TABLE games ADD COLUMN IF NOT EXISTS user1_id UUID REFERENCES users(id);
ALTER TABLE games ADD COLUMN IF NOT EXISTS user2_id UUID REFERENCES users(id);
ALTER TABLE games ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- Индексы для новых колонок в games
CREATE INDEX IF NOT EXISTS games_user1_id_idx ON games(user1_id);
CREATE INDEX IF NOT EXISTS games_user2_id_idx ON games(user2_id);
CREATE INDEX IF NOT EXISTS games_created_by_idx ON games(created_by);