#!/bin/bash

echo "Применение миграций к базе данных..."

# Проверяем что контейнеры запущены
if ! docker-compose ps | grep -q "friend-yinsh-db-1"; then
    echo "Контейнер базы данных не запущен. Запускаю..."
    docker-compose up -d db
    sleep 5
fi

# Применяем миграцию
echo "Применяем миграцию 001_add_users_tables.sql..."
docker-compose exec db psql -U postgres -d friend_yinsh -f /app/lib/db/src/migrations/001_add_users_tables.sql

echo "Проверяем структуру таблицы games..."
docker-compose exec db psql -U postgres -d friend_yinsh -c "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'games' ORDER BY ordinal_position;"

echo "Готово!"