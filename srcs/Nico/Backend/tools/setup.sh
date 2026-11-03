#!/bin/sh

set -eu

DB_HOST=${DB_HOST:-postgres}
DB_PORT=${DB_PORT:-5432}

echo "Waiting for PostgreSQL..."

until nc -z -w 1 "$DB_HOST" "$DB_PORT"; do
    echo "Trying to connect to PostgreSQL..."
    sleep 1
done

echo "Connected to PostgreSQL!"

echo "Running migrations..."
python3 manage.py migrate

echo "Starting server..."

exec gunicorn Backend.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 3 \
    --threads 4 \
    --timeout 1800