# Meshio

Проект `Meshio` — онлайн-маркетплейс 3D-моделей.

## Подготовка к запуску

### Backend

Перейдите в директорию backend и создайте виртуальное окружение:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Создайте файл окружения:

```bash
cp .env.example .env
```

Отредактируйте `backend/.env`, указав реальные значения для:

- `SECRET_KEY`
- `DEBUG`
- `ALLOWED_HOSTS`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `CLOUDRU_*`
- `YANDEX_*`
- `UNISENDER_*`
- `EMAIL_*`

### Команды для запуска и деплоя

Применение миграций и сборка статики:

```bash
cd backend
source .venv/bin/activate
python manage.py migrate
python manage.py collectstatic --noinput
```

Запуск сервера через Gunicorn:

```bash
cd backend
source .venv/bin/activate
gunicorn config.wsgi:application --bind 127.0.0.1:8000
```

### Frontend

Перейдите в директорию frontend и установите зависимости:

```bash
cd frontend
npm install --legacy-peer-deps
npm run build
```

Готовая сборка будет находиться в `frontend/dist`.

### Структура .env

Файл `backend/.env.example` содержит пример всех переменных окружения, необходимых для запуска.

### Git ignore

В репозитории игнорируется:

- `backend/.env`
- `backend/db.sqlite3`
- `backend/media/`
- `backend/staticfiles/`
- `backend/.venv/`
- `frontend/dist/`
- `frontend/node_modules/`
- `meshio_backup_before_deploy/`

## Production-советы

- Установите `DEBUG=False` в `.env` на боевом сервере.
- Укажите в `ALLOWED_HOSTS` ваш домен или IP сервера.
- Для production можно использовать Nginx как reverse proxy и Gunicorn для backend.
- Для статических файлов можно использовать `whitenoise`, но если вы отдаёте статику через nginx, достаточно настроить `STATIC_ROOT` и `collectstatic`.
