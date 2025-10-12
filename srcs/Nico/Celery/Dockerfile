FROM python:3.10-alpine

WORKDIR /usr/src/app

COPY requirement.txt ./

RUN pip install --no-cache-dir -r requirement.txt

COPY . .

CMD ["celery", "-A", "Backend", "beat", "--loglevel=info"]
