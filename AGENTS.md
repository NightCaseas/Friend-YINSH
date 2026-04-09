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
| product-analyst | Анализирует игровые метрики, формулирует продуктовые гипотезы и дает рекомендации по развитию фич на основе данных | `.opencode/agent/product-analyst.md` | При анализе продуктовых данных и необходимости рекомендаций по развитию фич |
| architect | Проектирует архитектурные решения, модульную структуру, API контракты и схемы БД для онлайн-игры YINSH | `.opencode/agent/architect.md` | При необходимости архитектурного проектирования, выбора технологий или оптимизации системы |

Commands
| Command | Что делает | Вызывает агентов |
|---|---|---|
| /init-backlog | Формализует и приоритизирует идеи по улучшению продукта, обновляет бэклог | @product-analyst |
| /idea | Добавляет одну идею по улучшению продукта в BACKLOG.md, уточняя описание через @product-analyst | @product-analyst |
| /finish-task | Финализирует активную задачу, мержит в main, обновляет артефакты и публикует результат | @developer |

Workflow
1. `/init-backlog` — формализовать идеи и обновить backlog
2. `/idea` — добавить новую идею с уточнением
3. `/start-task <feature-id>` — взять фичу в работу и подготовить реализацию
4. `/finish-task` — завершить активную задачу, смержить в main и обновить артефакты

Conventions
- Имена фич в бэклоге: `feature/<name>` или человекочитаемое название в `BACKLOG.md`
- Стиль коммитов: коротко и по делу, с глаголом в повелительном наклонении или в стиле `fix/add/update`
- Имена веток: `main` для основной ветки, рабочие ветки с префиксом по задаче
- Формат ADR: `docs/adr/YYYY-MM-DD-<topic>.md`

Self-maintenance rule
При создании любого нового файла в `.opencode/agent/` или `.opencode/command/` ты ОБЯЗАН в том же ходе обновить разделы Roles / Commands / Workflow в этом файле.
