# Projet Nico

## Vue d’ensemble

Ce projet est une application web composée de plusieurs services Docker :
- un frontend React pour la navigation dans la galerie et la gestion du panier,
- un backend Django REST pour l’accès aux fichiers médias et la validation du panier,
- une base de données Postgres,
- un moteur Celery + Celery Beat pour les tâches asynchrones,
- un reverse proxy Nginx pour exposer le frontend/backend et le dossier média.

Le flux principal :
1. l’utilisateur s’authentifie localement via un mot de passe,
2. il navigue dans les dossiers de photos du jour,
3. il sélectionne des images et crée un client,
4. il confirme le panier, qui copie les images vers `validated/<email>/`, avec option de copier les images du même dossier dans `wab_validation/<email>/`.

## Architecture

### Frontend (`srcs/Nico/Front`)

- Application React créée avec `react-scripts`.
- Composants clés :
  - `src/pages/Client.js` : gestion du mot de passe, de l’état de la page et du passage entre galerie et panier.
  - `src/components/PasswordPrompt.js` : formulaire de mot de passe client.
  - `src/components/MediaGallery.js` : exploration des fichiers média, sélection d’images et création de dossier client.
  - `src/components/CartPage.js` : affichage du panier, confirmation, envoi au backend.

### Backend (`srcs/Nico/Backend`)

- Projet Django avec l’application `list_albums`.
- Fichiers importants :
  - `srcs/Nico/Backend/list_albums/views.py` : logique d’exploration, de création de dossier client et de confirmation du panier.
  - `srcs/Nico/Backend/list_albums/urls.py` : routes API exposées.
  - `srcs/Nico/Backend/Backend/settings.py` : configuration Django, `MEDIA_ROOT`, `MEDIA_URL`, base de données SQLite.
- Stockage média : `srcs/Nico/Backend/media`.

### Base de données (`srcs/Nico/Postgres`)

- Conteneur Postgres inclus dans `docker-compose.yml`.
- Le service backend dépend de Postgres, même si l’application actuelle utilise SQLite par défaut.

### Exécution asynchrone

- `srcs/Nico/Celery` : worker Celery pour tâches en arrière-plan.
- `srcs/Nico/Celery-Beat` : scheduler Celery Beat.

### Proxy / SSL (`srcs/Nico/Nginx`)

- Nginx expose le service sur le port `4043` en HTTPS.
- Le dossier média est monté dans le conteneur Nginx pour servir les fichiers statiques via `/media`.

## Docker et exécution

Fichier principal : `srcs/docker-compose.yml`

Commandes utiles à la racine du projet :
- `make up` : démarrer les services en mode normal.
- `make upb` : reconstruire les images et démarrer.
- `make upbd` : reconstruire et démarrer en arrière-plan.
- `make fclean` : arrêter et nettoyer les conteneurs, images, volumes et réseau.
- `make db` : accéder au conteneur Postgres.

Le `docker-compose.yml` monte le dossier média du backend vers le frontend et Nginx pour que les images soient accessibles dans l’UI.

## API

### `GET /api/albums/liste/`

Renvoie la liste des fichiers images disponibles sous `MEDIA_ROOT`.

Réponse : tableau JSON d’objets :
- `folder` : chemin relatif du dossier contenant le fichier,
- `path` : URL du fichier calculée depuis `MEDIA_URL`.

### `POST /api/albums/create-client/`

Crée un dossier client et déplace les images sélectionnées.

Corps JSON attendu :
- `client` : nom du client,
- `files` : tableau de chemins `/media/...` des fichiers sélectionnés.

Comportement :
- déplace chaque image vers un sous-dossier client dans le dossier d’origine.
- renvoie la liste des fichiers déplacés.

### `POST /api/albums/confirm-cart/`

Valide le panier et copie les images sélectionnées.

Corps JSON attendu :
- `email` : adresse email du client,
- `files` : tableau de chemins `/media/...` des fichiers du panier,
- `copy_full_folders` : booléen facultatif.

Comportement :
- copie les images sélectionnées dans `media/validated/<email>/`.
- si `copy_full_folders` est vrai, copie aussi les images présentes dans le même dossier que chaque image sélectionnée vers `media/wab_validation/<email>/`.

Réponse :
- `success`: true,
- `copied`: fichiers copiés vers `validated`,
- `wab_copied`: fichiers copiés vers `wab_validation` (si demandé),
- `copy_full_folders`: flag retourné.

## Frontend : fonctionnement et fonctionnalités

### Authentification client

- La page `src/pages/Client.js` affiche d’abord `PasswordPrompt`.
- Le mot de passe est vérifié en local (`1234`).
- Après validation, la galerie est affichée.

### Exploration de la galerie

- `MediaGallery` charge le contenu via `/api/albums/liste/`.
- Elle filtre les fichiers du dossier du jour : `date/DD_MM_YYYY`.
- Le composant affiche les dossiers et les images.
- Cliquer sur un dossier navigue dans l’arborescence.

### Sélection d’images et création de client

- Le clic sur une image commence une sélection.
- Le second clic étend la sélection en fonction de l’intervalle entre deux images.
- Après sélection, une popup demande le nom du client.
- Un appel `POST /api/albums/create-client/` crée le sous-dossier client et déplace les images.
- Les images du client peuvent ensuite être affichées dans le panier.

### Panier et confirmation

- `CartPage` gère un panier global partagé depuis `MediaGallery`.
- L’utilisateur peut ajouter, enlever et prévisualiser les images.
- En confirmant :
  - l’email est demandé,
  - le panier est envoyé au backend,
  - le dossier `validated/<email>/` est créé/copied.
- Une case à cocher permet de copier les images du même dossier de chaque image dans `wab_validation/<email>/`.

### Comportement visuel

- La page affiche un aperçu grand format de l’image sélectionnée.
- Les images du panier sont listées en miniature dans la sidebar.
- Le bouton `Retour à la galerie` revient à l’exploration.

## Backend : logique et stockage

### Stockage média

- `MEDIA_ROOT` est défini dans `srcs/Nico/Backend/Backend/settings.py` sur `BASE_DIR / 'media'`.
- `MEDIA_URL` est `/media/`.
- Les dossiers créés par le backend :
  - `media/validated/<email>/` pour les images validées,
  - `media/wab_validation/<email>/` pour les copies secondaires.

### Application `list_albums`

- `list_albums/views.py` contient :
  - `get_all_files()` : lecture récursive des fichiers image,
  - `list_albums()` : API de listing,
  - `create_client_folder()` : création et déplacement d’images client,
  - `confirm_cart()` : copie des images validées et optionnellement du même dossier.

### Configuration Django

- Application `rest_framework` installée.
- Base créée avec SQLite par défaut dans `db.sqlite3`.
- `ALLOWED_HOSTS` est `['*']` pour faciliter l’accès depuis Docker.

## Structure du projet

- `Makefile` : commandes de démarrage Docker.
- `srcs/docker-compose.yml` : orchestration des services.
- `srcs/Nico/Front` : code frontend React.
- `srcs/Nico/Backend` : code backend Django et stockage média.
- `srcs/Nico/Postgres` : image et configuration Postgres.
- `srcs/Nico/Celery` : worker Celery.
- `srcs/Nico/Celery-Beat` : scheduler Celery Beat.
- `srcs/Nico/Nginx` : configuration Nginx et SSL.

## Notes importantes

- Le mot de passe client est codé en dur dans `src/pages/Client.js`.
- Les URLs du frontend utilisent `/api/albums/...` pour atteindre le backend.
- Le frontend monte le dossier média du backend pour accéder directement aux images.
- `docker-compose` expose Nginx sur `4043:443`.

## Comment démarrer

Depuis la racine du projet :
```bash
make upb
```

Puis ouvrir `https://localhost:4043` (ou l’URL Nginx configurée).

---

*Documentation générée pour le projet Nico.*
