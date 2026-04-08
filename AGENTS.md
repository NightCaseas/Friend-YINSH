# Friends YINSH

Project
Friends YINSH - online игра YINSH из GIPH Project

Stack
- TypeScript
- React
- Vite
- Node.js
- Express
- WebSocket
- PostgreSQL
- Drizzle ORM
- Zod
- pnpm workspaces
- Docker / Docker Compose

Structure
- `artifacts/friendsyinsh` - frontend приложение на React/Vite
- `artifacts/api-server` - backend API и WebSocket сервер
- `artifacts/mockup-sandbox` - статический mockup/песочница
- `lib/db` - общая схема БД и подключение к PostgreSQL
- `lib/api-client-react` - клиентские API-хуки/генерация клиента
- `lib/api-spec` - контракт API
- `lib/api-zod` - Zod-схемы для контрактов
- `docs/` - документация проекта
- `Dockerfile.*`, `docker-compose.yml` - запуск через Docker
- `scripts/` - служебные скрипты workspace

Backlog
`docs/BACKLOG.md` - формат фичи: `[Название | Приоритет | Описание | Медиа-объекты]`

Roles
| Agent | Что делает | Где пишет | Когда вызывается |
|---|---|---|---|
| Пока пусто | Заполним позже | Заполним позже | Заполним позже |

Commands
| Command | Что делает |
|---|---|
| Пока пусто | Заполним позже |

Workflow
Заполним позже: здесь будет описан процесс работы над задачей, проверки, тесты и порядок обновления артефактов.

Conventions
- Имена фич в бэклоге: `feature/<name>` или человекочитаемое название в `BACKLOG.md`
- Стиль коммитов: коротко и по делу, с глаголом в повелительном наклонении или в стиле `fix/add/update`
- Имена веток: `main` для основной ветки, рабочие ветки с префиксом по задаче
- Формат ADR: `docs/adr/YYYY-MM-DD-<topic>.md`

Self-maintenance rule
При создании любого нового файла в `.opencode/agent/` или `.opencode/command/` ты ОБЯЗАН в том же ходе обновить разделы Roles / Commands / Workflow в этом файле.
