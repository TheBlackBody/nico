FROM python:3.10-slim

# Installer les dépendances nécessaires
RUN apt-get update && apt-get install -y \
    netcat-openbsd \
    vim \
    curl \
    cron \
    && rm -rf /var/lib/apt/lists/*

# Créer le dossier d'application
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Copier le contenu du projet
COPY . .

# Installer les dépendances Python
RUN pip install --upgrade pip
RUN pip install -r ./tools/requirement.txt

# --- Partie Cron ---
# Créer le script du cron job
RUN mkdir -p /usr/local/bin/cron_scripts

# Script 1 : créer un dossier daté
RUN echo '#!/bin/bash\n' \
    'DATE=$(date +"%d_%m_%Y")\n' \
    'mkdir -p /usr/src/app/media/date/$DATE\n' \
    >> /usr/local/bin/cron_scripts/create_date_dir.sh

# Script 2 : appliquer les permissions chaque minute
RUN echo '#!/bin/bash\n' \
    'chmod 655 /usr/src/app/media/validated/*/* 2>/dev/null || true\n' \
    >> /usr/local/bin/cron_scripts/fix_permissions.sh

# Donner les droits d’exécution
RUN chmod +x /usr/local/bin/cron_scripts/*.sh

# Créer la crontab avec deux instructions
RUN echo "0 0 * * * root /usr/local/bin/cron_scripts/create_date_dir.sh >> /var/log/cron.log 2>&1" > /etc/cron.d/custom-cron \
    && echo "* * * * * root /usr/local/bin/cron_scripts/fix_permissions.sh >> /var/log/cron.log 2>&1" >> /etc/cron.d/custom-cron \
    && chmod 0644 /etc/cron.d/custom-cron \
    && crontab /etc/cron.d/custom-cron

# Exposer le port du backend
EXPOSE 8000

# Lancer cron + ton script setup
CMD service cron start && sh tools/setup.sh
