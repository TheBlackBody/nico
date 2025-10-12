check_connection() {
  nc -z $DB_HOST 5432
}

while true; do
  echo "Trying to connect to PostgreSQL..."
  if check_connection; then
    echo "Connected to PostgreSQL!"
    break
  fi
  sleep 1
done

echo "Running migrations..."
python3 manage.py makemigrations
python3 manage.py migrate

echo "Starting server..."
exec gunicorn --bind 0.0.0.0:8000 Backend.wsgi:application