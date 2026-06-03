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

## Production deployment

### Systemd service for backend

Создайте сервисный файл `meshio-backend.service` в `/etc/systemd/system/` с содержимым примерно:

```ini
[Unit]
Description=Meshio Django backend
After=network.target

[Service]
User=meshio
Group=meshio
WorkingDirectory=/home/meshio/meshio/backend
EnvironmentFile=/home/meshio/meshio/backend/.env
ExecStart=/home/meshio/meshio/backend/.venv/bin/gunicorn config.wsgi:application --bind 127.0.0.1:8000
Restart=always
KillMode=mixed

[Install]
WantedBy=multi-user.target
```

Перезапуск и проверка:

```bash
sudo systemctl daemon-reload
sudo systemctl enable meshio-backend
sudo systemctl start meshio-backend
sudo systemctl status meshio-backend
```

### Nginx config example

Пример конфигурации Nginx можно положить в `/etc/nginx/sites-available/meshio` и включить через `sites-enabled`.

```nginx
server {
    listen 80;
    server_name 85.209.150.154;

    client_max_body_size 200M;

    root /home/meshio/meshio/frontend/dist;
    index index.html;

    location /static/ {
        alias /home/meshio/meshio/backend/staticfiles/;
    }

    location /media/ {
        alias /home/meshio/meshio/backend/media/;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /admin/ {
        proxy_pass http://127.0.0.1:8000/admin/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Проверка и перезапуск Nginx:

```bash
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl status nginx
```

### Обновление проекта на сервере

После изменения кода backend:

```bash
cd /home/meshio/meshio/backend
source .venv/bin/activate
git pull
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart meshio-backend
sudo systemctl restart nginx
```

После изменения frontend:

```bash
cd /home/meshio/meshio/frontend
npm install --legacy-peer-deps
npm run build
sudo systemctl restart nginx
```

После изменения `.env`:

```bash
sudo systemctl restart meshio-backend
```

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
