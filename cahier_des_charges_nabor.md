# Nabor Services — Cahier des charges technique
## v1.0 · 19 mars 2026 · ESGI 3AL 2025/2026

**Équipe :** Amélie · Antonio · Nathan  
**Encadrement :** ESGI 3AL — Projet annuel  
**Maquettes Figma :** https://www.figma.com/design/TLa3Cbo10YuKmTqxPCVfLJPA  
**Dépôt GitHub :** `[À RENSEIGNER]`  
**Tableau Plane :** `[À RENSEIGNER]`  

---

> **Convention de lecture**  
> `[À RENSEIGNER]` = valeur à compléter par l'équipe avant livraison  
> ⚠️ = point d'attention sécurité ou RGPD  
> ⚡ = événement temps réel Socket.io  

---

## Sommaire

1. [Présentation du projet](#1-présentation-du-projet)
2. [Architecture générale](#2-architecture-générale)
3. [Modèles de données](#3-modèles-de-données)
4. [API REST — Référence complète](#4-api-rest--référence-complète)
5. [Socket.io — Événements temps réel](#5-socketio--événements-temps-réel)
6. [Modules fonctionnels](#6-modules-fonctionnels)
7. [Application Java Desktop](#7-application-java-desktop)
8. [Sécurité & RGPD](#8-sécurité--rgpd)
9. [Infrastructure & déploiement](#9-infrastructure--déploiement)
10. [Internationalisation (i18n)](#10-internationalisation-i18n)
11. [Tests & qualité](#11-tests--qualité)
12. [Identité visuelle](#12-identité-visuelle)
13. [Décisions architecturales](#13-décisions-architecturales)
14. [Organisation de l'équipe](#14-organisation-de-léquipe)
15. [Glossaire technique](#15-glossaire-technique)
16. [Évolutions futures (v2+)](#16-évolutions-futures-v2)
17. [Matrice des risques](#17-matrice-des-risques)

---


# 1. Présentation du projet

## 1.1 Vision & objectifs

Nabor Services est une **plateforme collaborative de quartier** permettant aux habitants d'échanger des services, de signer des documents numériques, de participer à des événements communautaires et de communiquer via une messagerie multimédia sécurisée.

**Vision :** Créer un espace numérique de confiance où chaque habitant peut contribuer à la vie de son quartier, simplement et en toute sécurité, dans le respect du RGPD.

**Principes fondateurs :**
- Pas d'argent sur la plateforme — les transactions sont directes entre utilisateurs via Stripe Connect
- Modération réactive, pas préventive — la publication est immédiate
- Privacy by design — soft delete, anonymisation, export RGPD natifs
- Offline-first pour les administrateurs via l'application Java Desktop

## 1.2 Périmètre fonctionnel

| Module | Description |
|--------|-------------|
| **Authentification & SSO** | Inscription, connexion MFA TOTP, SSO QR Code Java |
| **Profils & réseau social** | Suivi asymétrique, découverte Neo4j, blocage |
| **Annonces & services** | Offres/demandes entre voisins, cycle de vie complet |
| **Paiements** | Stripe Connect, commission admin, webhooks |
| **Documents & signatures** | eIDAS niveau simple, contrat + reçu, SHA-256 |
| **Événements** | Fil Neo4j, liste d'attente FIFO, billets QR |
| **Messagerie** | Modèle unifié DM/groupe/quartier, AES-256 |
| **Appels vidéo/vocaux** | WebRTC P2P, signaling Socket.io, relay coturn |
| **Votes & sondages** | Simple/multiple/pondéré, temps réel |
| **Incidents** | Saisie offline Java, sync NestJS |
| **DSL** | Langage de requête custom PLY pour MongoDB |
| **Quartiers** | Gestion géographique Neo4j + Leaflet.draw |
| **Administration** | Back-office web + Java Desktop |
| **i18n** | Français / Anglais (extensible) |

## 1.3 Utilisateurs cibles & rôles

| Rôle | Accès | Description |
|------|-------|-------------|
| `resident` | App web | Habitant standard — services, messagerie, événements |
| `neighbourhood_rep` | App web | Représentant de quartier — peut créer des polls de quartier |
| `moderator` | App web + Java | Gestion des signalements, modération des annonces/événements, peut créer des polls |
| `admin` | App web + Java | Configuration plateforme, gestion utilisateurs, accès total |

> **Hiérarchie des rôles :** `resident` < `neighbourhood_rep` < `moderator` < `admin`. Tout rôle supérieur hérite des permissions du rôle inférieur.

## 1.4 Cas d'usage principaux

1. **Échange de service** : un habitant propose un service, un voisin accepte, les deux signent un contrat numérique, le paiement Stripe est déclenché automatiquement
2. **Événement communautaire** : un organisateur publie un événement → groupe de messagerie créé → inscriptions avec liste d'attente FIFO → billets QR envoyés
3. **Vote de quartier** : un représentant crée un sondage → résultats en temps réel via Socket.io → clôture automatique à `ends_at`
4. **Signalement & modération** : un habitant signale une annonce → le modérateur traite depuis le panneau web ou l'app Java en offline → action tracée avec motif
5. **SSO Java** : l'admin ouvre l'app Java → affiche un QR code → scanne depuis l'app web → reçoit un JWT valide 90 jours

### UC-01 — Échange de service payant
**Acteur principal :** Habitant (prestataire)
**Acteurs secondaires :** Habitant (demandeur), Stripe, NestJS
**Pré-conditions :** Les deux utilisateurs ont un compte actif, TOTP activé, prestataire onboardé Stripe Connect
**Scénario principal :**
1. Le prestataire publie une annonce `offer` avec prix
2. Le demandeur exprime son intérêt → statut `pending`
3. Le prestataire accepte → statut `in_progress`
4. NestJS génère le contrat de promesse PDF (SHA-256)
5. Chaque partie signe (canvas + TOTP) → déclenchement Stripe Checkout
6. Stripe confirme via webhook → statut transaction `completed`
7. Les parties confirment l'exécution → signature reçu → statut `closed`
**Scénario alternatif A :** Le contrat n'est pas signé dans les 24h → `cancelled`, aucun paiement
**Scénario alternatif B :** Paiement refusé → statut `payment_failed`, annonce retourne `open`

### UC-02 — Inscription à un événement (avec liste d'attente FIFO)

**Acteur principal :** Habitant (participant)
**Acteurs secondaires :** NestJS, BullMQ (queue), Stripe (si payant), Socket.io
**Pré-conditions :** Utilisateur connecté, événement en statut `open`

**Scénario principal — place disponible :**
1. L'utilisateur découvre l'événement dans son fil Neo4j (swipe ou scroll)
2. Il clique sur « Participer » → `POST /events/:id/register`
3. NestJS retourne immédiatement `202 Accepted` (sans bloquer l'UI)
4. Un job `bull:event-register` est ajouté avec `job_id = eventId:userId` (idempotent — double-clic ignoré)
5. Le worker (concurrency=1) ouvre une transaction PostgreSQL avec `SELECT FOR UPDATE` sur l'événement
6. La place est disponible (`count(registered) < max_participants`) → `INSERT event_participants` avec `status='registered'` (override du default `waitlisted`)
7. Socket.io notifie le client : `event:registration_result { status: "registered" }`
8. Accès au groupe de messagerie de l'événement accordé
9. Si événement payant → flux Stripe Connect déclenché, billet PDF généré après confirmation webhook

**Scénario alternatif A — événement complet (liste d'attente) :**
- Étape 6 : capacité atteinte → `INSERT event_participants status='waitlisted'`
- Socket.io notifie : `event:registration_result { status: "waitlisted" }`

**Scénario alternatif B — un inscrit se désinscrit :**
1. `DELETE /events/:id/participants/me` → place libérée
2. BullMQ crée un `delayed job` `bull:waitlist-promote` vers le 1er `waitlisted` (FIFO chronologique)
3. Socket.io émet `event:place_available` → email de notification
4. Le 1er waitlisted dispose de **24h** pour confirmer
5. Sans réponse dans le délai → passage au suivant dans la file
6. `event:waitlist_promoted` émis au participant promu

**Post-conditions :** `event_participants` mis à jour, compteur Redis synchronisé, groupe messagerie accessible

### UC-03 — Vote de quartier en temps réel

**Acteur principal :** Habitant (votant)
**Acteurs secondaires :** `neighbourhood_rep` (créateur), Socket.io, Redis
**Pré-conditions :** Sondage en statut actif (`starts_at ≤ now ≤ ends_at`), utilisateur dans le quartier concerné

**Scénario principal — premier vote :**
1. Le `neighbourhood_rep` crée le sondage via `POST /polls` (type `single|multiple|weighted`, `ends_at`)
2. Les habitants du quartier voient le sondage dans leur fil
3. L'habitant sélectionne une option et valide → `POST /polls/:id/vote { option_id, weight? }`
4. NestJS vérifie : pas de vote existant (type `single`), `ends_at` non atteint
5. `INSERT votes(user_id, option_id, weight=1)` dans PostgreSQL
6. Redis incrémente `counter:poll_votes:<poll_id>:<option_id>`
7. NestJS calcule les pourcentages depuis Redis (pas de COUNT PostgreSQL)
8. Socket.io émet `poll:updated { poll_id, results: [{ option_id, count, percentage }] }` à tous les membres du quartier connectés
9. L'UI de tous les votants et observateurs se met à jour en temps réel

**Scénario alternatif A — modification de vote :**
- `PUT /polls/:id/vote { option_id }` → décrement Redis ancien + incrément nouveau + `UPDATE votes`

**Scénario alternatif B — clôture automatique :**
- À `ends_at` → job BullMQ déclenche `POST /polls/:id/close`
- Socket.io émet `poll:closed { poll_id, final_results }`

**Scénario alternatif C — vote anonyme (`is_anonymous=true`) :**
- Le vote est enregistré normalement mais `GET /polls/:id` ne retourne pas le `user_id` dans les résultats

**Post-conditions :** `votes` en PostgreSQL, compteurs Redis à jour, résultats diffusés temps réel

### UC-04 — SSO Java Desktop via QR Code (Device Authorization Flow)

**Acteur principal :** Admin/Modérateur (utilisateur Java Desktop)
**Acteurs secondaires :** App web React, NestJS, Redis, SQLite (local)
**Pré-conditions :** Application Java Desktop lancée, compte actif avec TOTP

**Scénario principal :**
1. L'app Java génère un UUID de session → `POST /auth/sso/qr/generate`
2. NestJS crée `sso:qr:<uuid>` dans Redis (`status: "pending"`, TTL 2 min)
3. NestJS retourne le QR code PNG contenant `{ token_uuid, api_url }`
4. Java affiche le QR code dans une fenêtre JavaFX (`ImageView`)
5. Java démarre un polling : `GET /auth/sso/qr/:uuid/status` toutes les 2s
   *(alternative : écoute `sso:qr_validated` via Socket.io pour éviter le polling)*
6. L'admin ouvre l'app web React sur son navigateur/mobile
7. Il scanne le QR → React envoie `POST /auth/sso/qr/validate { token_uuid }`
8. NestJS vérifie le JWT React, crée une session PostgreSQL pour le device Java
9. Redis met à jour `sso:qr:<uuid>` → `status: "validated"`, stocke `{ access_token, refresh_token }`
10. Java reçoit le statut `validated` → récupère `{ access_token (90j), refresh_token }`
11. Java chiffre le JWT via KeyStore OS et le stocke dans SQLite (`app_settings.java_jwt_token`)
12. Java affiche l'interface principale — session active 90 jours

**Scénario alternatif A — QR expiré (> 2 min) :**
- Redis key TTL expiré → `status: "expired"` → Java affiche bouton « Rafraîchir le QR »

**Scénario alternatif B — JWT proche d'expiration (≤ 7 jours restants) :**
- Au démarrage, Java détecte `exp - now() ≤ 7j`
- Bandeau d'avertissement affiché
- Si `exp - now() ≤ 0` → écran SSO QR obligatoire (retour étape 1)

**Post-conditions :** JWT 90j stocké chiffré en SQLite, session tracée dans `user_sessions` PostgreSQL

### UC-05 — Signalement et modération d'une annonce

**Acteur principal :** Habitant (signaleur)
**Acteurs secondaires :** Modérateur, NestJS, BullMQ (email)
**Pré-conditions :** Annonce en statut `open` ou `in_progress`, utilisateur connecté

**Scénario principal — signalement :**
1. L'habitant consulte une annonce et clique sur « Signaler »
2. Il saisit un motif (obligatoire) → `POST /listings/:id/report { reason }`
3. NestJS insère dans `listing_reports` avec horodatage
4. L'annonce apparaît dans `GET /listings/reported` (panneau modérateur), triée par nombre de signalements décroissant

**Scénario principal — traitement modérateur :**
5. Le modérateur consulte le panneau (web ou Java Desktop offline)
6. Il examine l'annonce et choisit une action :
   - `cancel` : annonce masquée, statut → `cancelled`
   - `warn` : créateur notifié, annonce conservée
   - `restore` : annonce réhabilitée (si précédemment annulée)
7. `POST /listings/:id/moderate { action, reason }` — motif obligatoire
8. NestJS insère dans `listing_moderation_actions` (moderator_id, action, reason, timestamp)
9. BullMQ envoie un email au créateur de l'annonce avec le motif
10. Si action depuis Java Desktop offline : stocké dans SQLite (`listing_moderation_actions.is_dirty=1`) → synchronisé au prochain `POST /java/sync/moderation`

**Scénario alternatif — annonce liée à une transaction en cours :**
- L'annonce est en `in_progress` → le modérateur peut annuler mais doit notifier les deux parties
- La transaction associée passe en `cancelled`, aucun paiement n'est effectué

**Post-conditions :** Action tracée dans `listing_moderation_actions`, email envoyé, panneau modérateur mis à jour

## 1.5 Hors périmètre (v1)

- Chiffrement de bout en bout (E2E) type Signal — identifié comme évolution majeure v2
- Application mobile (iOS / Android)
- Marketplace avec paiement différé ou escrow
- IA de modération automatique
- Géocodage de précision (géré par un conteneur Docker local BAN - Base Adresse Nationale)

---

# 2. Architecture générale

## 2.1 Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                   │
│  ┌──────────────────┐          ┌─────────────────────────────┐  │
│  │  React (Web)     │          │  Java Desktop (JavaFX)      │  │
│  │  - Site habitant │          │  - Admin / Modérateur       │  │
│  │  - Back-office   │          │  - Offline-first (SQLite)   │  │
│  └────────┬─────────┘          └──────────────┬──────────────┘  │
└───────────┼──────────────────────────────────┼──────────────────┘
            │ REST / WebSocket                  │ REST (JWT)
            ▼                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NestJS API (port 3000)                        │
│         REST + Socket.io · Guards JWT · Swagger/OpenAPI          │
└─┬──────┬──────┬──────┬──────┬──────┬───────────────────────────┘
  │      │      │      │      │      │
  ▼      ▼      ▼      ▼      ▼      ▼
 PG   Mongo  Neo4j  Redis  Stripe  DSL FastAPI
```

## 2.2 Stack technique

| Couche | Technologie | Rôle |
|--------|------------|------|
| **Backend** | NestJS (Node.js 20) | API REST + WebSocket Socket.io |
| **Frontend** | React + Vite | Site utilisateur + back-office admin |
| **Client lourd** | Java 21 + JavaFX | Application desktop offline-first |
| **BDD principale** | PostgreSQL 17 | Métadonnées structurées, utilisateurs, transactions |
| **BDD documents** | MongoDB 7 | Contrats, messages, médias, billets |
| **Graphe** | Neo4j 5 + APOC | Réseau social, géographie, recommandations |
| **Cache** | Redis 7 | Sessions, TOTP, présence, queues BullMQ |
| **BDD locale Java** | SQLite (JDBC) | Incidents, modération, paramètres offline |
| **Paiement** | Stripe Connect | Transactions directes entre utilisateurs |
| **Temps réel** | Socket.io + WebRTC | Messagerie, présence, appels |
| **Relay WebRTC** | coturn | TURN/STUN pour NAT traversal |
| **DSL** | Python 3.12 + PLY + FastAPI | Langage de requête custom MongoDB |
| **Conteneurs** | Docker + Docker Compose | Environnements dev/prod |
| **Email dev** | Mailpit | Intercepteur SMTP |
| **Email prod** | Brevo (Nodemailer) | Envoi SMTP externe |
| **Tests backend** | Jest | Unitaires + e2e NestJS |
| **Tests frontend** | Vitest + React Testing Library | Composants React |
| **Tests Java** | JUnit 5 | Tests unitaires |
| **Documentation API** | Swagger / OpenAPI 3 | Auto-générée par NestJS |

## 2.3 Communication inter-services

| De | Vers | Protocole | Méthode |
|----|------|-----------|---------|
| React | NestJS | HTTPS / WSS | REST + Socket.io |
| Java Desktop | NestJS | HTTPS | REST (JWT partagé) |
| NestJS | PostgreSQL | TCP | Driver `pg` natif |
| NestJS | MongoDB | TCP | Mongoose ODM |
| NestJS | Neo4j | Bolt | Driver Neo4j officiel |
| NestJS | Redis | TCP | `ioredis` |
| NestJS | Stripe | HTTPS | SDK Stripe Node.js |
| NestJS | DSL Service | HTTP interne | `POST http://dsl-service:8000/parse` |
| Java (offline) | SQLite | JDBC | Lecture/écriture locale |
| Java (sync) | NestJS | HTTPS | REST batch idempotent |

## 2.4 Séparation des responsabilités par base de données

| Base | Ce qu'elle contient | Ce qu'elle NE contient PAS |
|------|--------------------|-----------------------------|
| **PostgreSQL** | Utilisateurs, rôles, annonces (méta), événements (méta), transactions, messages (méta), votes, incidents | Contenu enrichi, médias, documents PDF |
| **MongoDB** | Contrats PDF, messages chiffrés, médias (avatars, photos, vidéos, audio) via GridFS, billets QR, documents incidents, collection `media_files` (métadonnées) | Données relationnelles structurées |
| **Neo4j** | Graphe social (follows, amis, blocs), géographie (quartiers, adjacences), recommandations | Données transactionnelles |
| **Redis** | Sessions, TOTP, reset password, présence, clés AES groupes, queues BullMQ, rate limits, cache feeds | Données persistantes métier |
| **SQLite** | Sous-ensemble offline Java (incidents, modération, settings) | MongoDB, Neo4j, données bancaires |

## 2.5 APIs & Frameworks extérieurs utilisés

| Outil | Version | Rôle | Pourquoi ce choix |
|-------|---------|------|--------------------|
| Stripe Connect | API v2024 | Paiements directs entre utilisateurs | Pas d'agrément PSP requis, PCI-DSS natif |
| Socket.io | 4.x | WebSocket temps réel | Fallback HTTP long-polling, rooms natives |
| WebRTC (natif) | W3C | Appels audio/vidéo P2P | Flux direct, pas de serveur média |
| coturn | 4.6 | Relay TURN/STUN WebRTC | NAT traversal en environnement hébergé |
| PLY (Python Lex-Yacc) | 3.11 | Parser du DSL custom | Grammaire BNF formelle, thread-safe |
| Mongoose ODM | 8.x | Accès MongoDB depuis NestJS | Schémas typés, middleware hooks |
| Neo4j Driver (Bolt) | 5.x | Graphe social & géo | Protocole Bolt binaire, queries Cypher |
| ioredis | 5.x | Client Redis NestJS | Clustering, pipelining, auto-reconnect |
| Argon2id | — | Hachage mots de passe | OWASP recommandé, résistant GPU |
| sharp | — | Compression images | WebP natif Node.js, sans binaire externe |
| fluent-ffmpeg | — | Compression vidéo & transcodage audio | Wrapper Node.js pour ffmpeg, compression 1080p et Opus 128kbps |
| turf.js | 6.x | Calculs géospatiaux (centroïdes, adjacences) | Pas de PostGIS requis, GeoJSON natif |
| BullMQ | 5.x | Queues de jobs asynchrones | Redis-native, retry exponentiel, idempotence, successeur actif de Bull |
| Leaflet + Leaflet.draw | 1.9 | Dessin des polygones quartiers (admin) | Léger, open-source, GeoJSON export |
| Brevo / Nodemailer | — | Envoi SMTP en production | Anti-blacklist IP, dashboard envoi |
| JUnit 5 | 5.x | Tests unitaires Java | Standard Java, intégration Maven |
| Vitest + RTL | — | Tests composants React | Vite-native, plus rapide que Jest |

---

# 3. Modèles de données

## 3.1 PostgreSQL — Schéma

> UUID v7 natif PostgreSQL 17 via extension `pg_uuidv7` (`uuidv7()`). Convention : `snake_case`. Soft delete via `deleted_at` sur toutes les entités sociales. UUID v7 est ordonné chronologiquement, ce qui améliore les performances des index B-tree et permet un tri naturel par date de création.
 
### Utilisateurs & Authentification
 
```sql
-- ============================================================
-- ENUM TYPES
-- ============================================================
 
CREATE TYPE visibility_enum       AS ENUM ('public', 'friends', 'private');
CREATE TYPE message_policy_enum   AS ENUM ('open', 'filtered', 'closed');
CREATE TYPE user_role_enum        AS ENUM ('resident', 'neighbourhood_rep', 'moderator', 'admin');
 
-- ============================================================
-- users
-- Convention : soft delete RGPD via deleted_at
-- password_hash   : Argon2id, sel embarqué dans le hash
-- totp_secret     : seed TOTP chiffré AES-256 au repos
-- stripe_account_id : Stripe Connect, null tant que non onboardé
-- neighbourhood_id  : référence Neo4j (pas de FK SQL)
-- profile_picture_mongo_id / banner_mongo_id : stockés MongoDB
-- password_changed_at invalide les JWT antérieurs à cette date
-- ============================================================
 
CREATE TABLE users (
    id                       UUID          PRIMARY KEY DEFAULT uuidv7(),
    first_name               VARCHAR       NOT NULL,
    last_name                VARCHAR       NOT NULL,
    email                    VARCHAR       UNIQUE NOT NULL,
    password_hash            VARCHAR       NOT NULL,
    totp_secret              VARCHAR,
    stripe_account_id        VARCHAR       UNIQUE,
    neighbourhood_id         TEXT,
    visibility               visibility_enum       NOT NULL DEFAULT 'public',
    bio                      TEXT,
    message_policy           message_policy_enum   NOT NULL DEFAULT 'open',
    locale                   VARCHAR(5)    NOT NULL DEFAULT 'fr',
    profile_picture_mongo_id TEXT,
    banner_mongo_id          TEXT,
    role                     user_role_enum        NOT NULL DEFAULT 'resident',
    last_login_at            TIMESTAMPTZ,
    password_changed_at      TIMESTAMPTZ,
    created_at               TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ,
    deleted_at               TIMESTAMPTZ
);
 
CREATE INDEX idx_users_neighbourhood ON users (neighbourhood_id);
CREATE INDEX idx_users_role          ON users (role);
CREATE INDEX idx_users_deleted_at    ON users (deleted_at);
 
-- ============================================================
-- user_sessions
-- Access token JWT 15 min + Refresh token rotation 30 j
-- refresh_token_hash : SHA-256 du refresh token brut
-- revoked_at NULL = session active
-- CHECK : expires_at > created_at
-- ============================================================
 
CREATE TABLE user_sessions (
    id                 UUID        PRIMARY KEY DEFAULT uuidv7(),
    user_id            UUID        NOT NULL REFERENCES users (id),
    refresh_token_hash VARCHAR     NOT NULL,
    device_name        VARCHAR,
    ip_address         VARCHAR,
    user_agent         TEXT,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_used_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at         TIMESTAMPTZ NOT NULL,
    revoked_at         TIMESTAMPTZ,
 
    CONSTRAINT chk_session_expiry CHECK (expires_at > created_at)
);
 
CREATE UNIQUE INDEX uq_sessions_token_hash ON user_sessions (refresh_token_hash);
CREATE        INDEX idx_sessions_user      ON user_sessions (user_id);
CREATE        INDEX idx_sessions_expiry    ON user_sessions (expires_at);
CREATE        INDEX idx_sessions_revoked   ON user_sessions (revoked_at);
 
-- ============================================================
-- user_notification_preferences
-- Une ligne par utilisateur, créée à l'inscription
-- ============================================================
 
CREATE TABLE user_notification_preferences (
    user_id            UUID    PRIMARY KEY REFERENCES users (id),
    notif_new_follower BOOLEAN NOT NULL DEFAULT true,
    notif_new_listing  BOOLEAN NOT NULL DEFAULT true,  -- annonce d'un utilisateur suivi
    notif_new_event    BOOLEAN NOT NULL DEFAULT true,  -- événement d'un utilisateur suivi
    notif_new_poll     BOOLEAN NOT NULL DEFAULT true,
    notif_waitlist     BOOLEAN NOT NULL DEFAULT true,  -- libération d'une place
    notif_message      BOOLEAN NOT NULL DEFAULT true,  -- message hors ligne
    updated_at         TIMESTAMPTZ
);
```
 
 
### Réseau Social
 
```sql
CREATE TYPE swipe_direction_enum AS ENUM ('like', 'dislike');
 
-- ============================================================
-- follow
-- Suivi asymétrique : A suit B sans que B suive A
-- Follow mutuel => friendship créée automatiquement par NestJS
-- CHECK : follower_id != followed_id
-- ============================================================
 
CREATE TABLE follow (
    follower_id UUID        NOT NULL REFERENCES users (id),
    followed_id UUID        NOT NULL REFERENCES users (id),
    followed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 
    PRIMARY KEY (follower_id, followed_id),
    CONSTRAINT chk_follow_self CHECK (follower_id != followed_id)
);
 
CREATE INDEX idx_follow_reverse ON follow (followed_id, follower_id);
 
-- ============================================================
-- friendships
-- Amitié = double follow détecté par NestJS
-- Convention : user1_id < user2_id (CHECK SQL)
-- group_id : DM auto-créé (nullable, two-step)
-- ============================================================
 
CREATE TABLE friendships (
    id            UUID        PRIMARY KEY DEFAULT uuidv7(),
    user1_id      UUID        NOT NULL REFERENCES users (id),
    user2_id      UUID        NOT NULL REFERENCES users (id),
    friended_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    unfriended_at TIMESTAMPTZ,
    group_id      UUID        REFERENCES chat_groups (id),  -- voir section messagerie
 
    CONSTRAINT uq_friendships_pair UNIQUE (user1_id, user2_id),
    CONSTRAINT chk_friendships_order CHECK (user1_id < user2_id)
);
 
-- ============================================================
-- user_blocks
-- CHECK : blocker_id != blocked_id
-- ============================================================
 
CREATE TABLE user_blocks (
    blocker_id UUID        NOT NULL REFERENCES users (id),
    blocked_id UUID        NOT NULL REFERENCES users (id),
    blocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 
    PRIMARY KEY (blocker_id, blocked_id),
    CONSTRAINT chk_block_self CHECK (blocker_id != blocked_id)
);
 
CREATE INDEX idx_user_blocks_blocked ON user_blocks (blocked_id);
 
-- ============================================================
-- user_swipes
-- CHECK : swiper_id != swiped_id
-- ============================================================
 
CREATE TABLE user_swipes (
    swiper_id UUID                NOT NULL REFERENCES users (id),
    swiped_id UUID                NOT NULL REFERENCES users (id),
    direction swipe_direction_enum NOT NULL,
    swiped_at TIMESTAMPTZ         NOT NULL DEFAULT now(),
 
    PRIMARY KEY (swiper_id, swiped_id),
    CONSTRAINT chk_swipe_self CHECK (swiper_id != swiped_id)
);
 
CREATE INDEX idx_user_swipes_swiped_dir ON user_swipes (swiped_id, direction);
```
 
 
### Messagerie
 
```sql
CREATE TYPE chat_group_type_enum    AS ENUM ('direct_message', 'group_chat', 'neighbourhood');
CREATE TYPE group_role_enum         AS ENUM ('watch', 'message', 'actions', 'admin');
 
-- ============================================================
-- chat_groups
-- listing_id nullable : groupe lié à une annonce spécifique
-- ============================================================
 
CREATE TABLE chat_groups (
    id          UUID               PRIMARY KEY DEFAULT uuidv7(),
    name        VARCHAR,
    description TEXT,
    created_by  UUID               NOT NULL REFERENCES users (id),
    type        chat_group_type_enum NOT NULL,
    listing_id  UUID               REFERENCES listings (id),  -- voir section annonces
    created_at  TIMESTAMPTZ        NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ,
    deleted_at  TIMESTAMPTZ
);
 
CREATE INDEX idx_chat_groups_type    ON chat_groups (type);
CREATE INDEX idx_chat_groups_listing ON chat_groups (listing_id);
 
-- ============================================================
-- users_in_group
-- CHECK : left_at > joined_at, kicked_at > joined_at
-- ============================================================
 
CREATE TABLE users_in_group (
    user_id       UUID             NOT NULL REFERENCES users (id),
    group_id      UUID             NOT NULL REFERENCES chat_groups (id),
    role_in_group group_role_enum  NOT NULL DEFAULT 'message',
    joined_at     TIMESTAMPTZ      NOT NULL DEFAULT now(),
    left_at       TIMESTAMPTZ,
    kicked_at     TIMESTAMPTZ,
    is_muted      BOOLEAN          NOT NULL DEFAULT false,
    muted_until   TIMESTAMPTZ,
 
    PRIMARY KEY (user_id, group_id),
    CONSTRAINT chk_uig_left   CHECK (left_at   IS NULL OR left_at   > joined_at),
    CONSTRAINT chk_uig_kicked CHECK (kicked_at IS NULL OR kicked_at > joined_at)
);
 
CREATE INDEX idx_uig_group ON users_in_group (group_id);
 
-- ============================================================
-- message_metadata
-- Le contenu réel est stocké dans MongoDB (mongo_message_id)
-- parent_message_id : self-ref pour les réponses (threads)
-- ============================================================
 
CREATE TABLE message_metadata (
    id                UUID        PRIMARY KEY DEFAULT uuidv7(),
    mongo_message_id  TEXT        NOT NULL,
    group_id          UUID        NOT NULL REFERENCES chat_groups (id),
    sender_id         UUID        NOT NULL REFERENCES users (id),
    sent_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    edited_at         TIMESTAMPTZ,
    is_deleted        BOOLEAN     NOT NULL DEFAULT false,
    deleted_at        TIMESTAMPTZ,
    parent_message_id UUID        REFERENCES message_metadata (id)
);
 
CREATE INDEX idx_msg_group_sent ON message_metadata (group_id, sent_at);
CREATE INDEX idx_msg_sender     ON message_metadata (sender_id);
 
-- ============================================================
-- message_read_receipts
-- ============================================================
 
CREATE TABLE message_read_receipts (
    message_id UUID        NOT NULL REFERENCES message_metadata (id),
    user_id    UUID        NOT NULL REFERENCES users (id),
    read_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
 
    PRIMARY KEY (message_id, user_id)
);
```
 

### Annonces & Paiements
 
```sql
CREATE TYPE listing_type_enum        AS ENUM ('offer', 'request');
CREATE TYPE listing_status_enum      AS ENUM ('open', 'pending', 'in_progress', 'closed', 'cancelled');
CREATE TYPE transaction_status_enum  AS ENUM ('pending', 'completed', 'payment_failed', 'cancelled');
CREATE TYPE moderation_action_enum   AS ENUM ('cancelled', 'warned', 'restored');
 
-- ============================================================
-- listing_category
-- Hiérarchique via self-ref parent_category
-- ============================================================
 
CREATE TABLE listing_category (
    id              SERIAL      PRIMARY KEY,
    parent_category INTEGER     REFERENCES listing_category (id),
    category_name   VARCHAR     NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);
 
-- ============================================================
-- listings
-- CHECK : price_cents >= 0
-- neighbourhood_id : référence Neo4j
-- mongo_document_id : contenu enrichi stocké MongoDB
-- ============================================================
 
CREATE TABLE listings (
    id                UUID                 PRIMARY KEY DEFAULT uuidv7(),
    creator_id        UUID                 NOT NULL REFERENCES users (id),
    title             VARCHAR              NOT NULL,
    description       TEXT,
    category_id       INTEGER              REFERENCES listing_category (id),
    listing_type      listing_type_enum    NOT NULL,
    price_cents       INTEGER              NOT NULL DEFAULT 0,
    status            listing_status_enum  NOT NULL DEFAULT 'open',
    neighbourhood_id  TEXT,
    mongo_document_id TEXT,
    created_at        TIMESTAMPTZ          NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ,
    closed_at         TIMESTAMPTZ,
    deleted_at        TIMESTAMPTZ,
 
    CONSTRAINT chk_listing_price CHECK (price_cents >= 0)
);
 
CREATE INDEX idx_listings_feed        ON listings (neighbourhood_id, status, created_at);
CREATE INDEX idx_listings_creator     ON listings (creator_id);
CREATE INDEX idx_listings_soft_delete ON listings (deleted_at);
 
-- ============================================================
-- listing_transactions
-- CHECK : provider_id != requester_id
-- CHECK : amount_cents >= 0, commission_cents >= 0
-- stripe_session_id et stripe_payment_intent sont uniques
-- ============================================================
 
CREATE TABLE listing_transactions (
    id                    UUID                    PRIMARY KEY DEFAULT uuidv7(),
    listing_id            UUID                    NOT NULL REFERENCES listings (id),
    provider_id           UUID                    NOT NULL REFERENCES users (id),
    requester_id          UUID                    NOT NULL REFERENCES users (id),
    amount_cents          INTEGER                 NOT NULL DEFAULT 0,
    commission_cents      INTEGER                 NOT NULL DEFAULT 0,
    stripe_session_id     VARCHAR                 UNIQUE,
    stripe_payment_intent VARCHAR                 UNIQUE,
    contract_mongo_id     TEXT,
    receipt_mongo_id      TEXT,
    payment_failed_reason TEXT,
    status                transaction_status_enum NOT NULL DEFAULT 'pending',
    created_at            TIMESTAMPTZ             NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ,
    paid_at               TIMESTAMPTZ,
    completed_at          TIMESTAMPTZ,
    cancelled_at          TIMESTAMPTZ,
 
    CONSTRAINT chk_ltx_parties      CHECK (provider_id != requester_id),
    CONSTRAINT chk_ltx_amount       CHECK (amount_cents >= 0),
    CONSTRAINT chk_ltx_commission   CHECK (commission_cents >= 0)
);
 
CREATE INDEX idx_ltx_listing_status ON listing_transactions (listing_id, status);
CREATE INDEX idx_ltx_provider       ON listing_transactions (provider_id);
CREATE INDEX idx_ltx_requester      ON listing_transactions (requester_id);
 
-- ============================================================
-- listing_reports
-- ============================================================
 
CREATE TABLE listing_reports (
    id          UUID        PRIMARY KEY DEFAULT uuidv7(),
    listing_id  UUID        NOT NULL REFERENCES listings (id),
    reporter_id UUID        NOT NULL REFERENCES users (id),
    reason      TEXT        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ
);
 
CREATE INDEX idx_lrep_listing  ON listing_reports (listing_id);
CREATE INDEX idx_lrep_resolved ON listing_reports (resolved_at);
 
-- ============================================================
-- listing_moderation_actions
-- ============================================================
 
CREATE TABLE listing_moderation_actions (
    id           UUID                   PRIMARY KEY DEFAULT uuidv7(),
    listing_id   UUID                   NOT NULL REFERENCES listings (id),
    moderator_id UUID                   NOT NULL REFERENCES users (id),
    action       moderation_action_enum NOT NULL,
    reason       TEXT                   NOT NULL,
    created_at   TIMESTAMPTZ            NOT NULL DEFAULT now()
);
 
CREATE INDEX idx_lmod_listing ON listing_moderation_actions (listing_id);
```
 
 
### Événements
 
```sql
CREATE TYPE event_status_enum          AS ENUM ('draft', 'published', 'open', 'cancelled', 'completed');
CREATE TYPE participant_status_enum    AS ENUM ('registered', 'waitlisted', 'cancelled');
CREATE TYPE payment_status_enum        AS ENUM ('free', 'pending', 'completed', 'refunded');
 
-- ============================================================
-- evenements_category
-- ============================================================
 
CREATE TABLE evenements_category (
    id              SERIAL      PRIMARY KEY,
    parent_category INTEGER     REFERENCES evenements_category (id),
    category_name   VARCHAR     NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);
 
-- ============================================================
-- evenements
-- CHECK : ends_at > starts_at
-- CHECK : cost_cents >= 0
-- CHECK : max_participants >= 1 quand non null
-- CHECK : refund_deadline_hours >= 0
-- invite_code NULL = événement public
-- refund_deadline_hours : délai de remboursement (en heures)
--   si annulation par l'organisateur (défaut 48h)
-- neighbourhood_id : référence Neo4j
-- mongo_document_id : contenu enrichi stocké MongoDB
-- ============================================================
 
CREATE TABLE evenements (
    id                    UUID               PRIMARY KEY DEFAULT uuidv7(),
    creator_id            UUID               NOT NULL REFERENCES users (id),
    neighbourhood_id      TEXT,
    category_id           INTEGER            REFERENCES evenements_category (id),
    group_id              UUID               REFERENCES chat_groups (id),
    title                 VARCHAR            NOT NULL,
    status                event_status_enum  NOT NULL DEFAULT 'draft',
    invite_code           VARCHAR,
    cost_cents            INTEGER            NOT NULL DEFAULT 0,
    starts_at             TIMESTAMPTZ,
    ends_at               TIMESTAMPTZ,
    max_participants      INTEGER,
    refund_deadline_hours INTEGER            NOT NULL DEFAULT 48,
    mongo_document_id     TEXT,
    published_at          TIMESTAMPTZ,
    cancelled_at          TIMESTAMPTZ,
    completed_at          TIMESTAMPTZ,
    created_at            TIMESTAMPTZ        NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ,
    deleted_at            TIMESTAMPTZ,
 
    CONSTRAINT chk_event_dates        CHECK (ends_at IS NULL OR ends_at > starts_at),
    CONSTRAINT chk_event_cost         CHECK (cost_cents >= 0),
    CONSTRAINT chk_event_participants CHECK (max_participants IS NULL OR max_participants >= 1),
    CONSTRAINT chk_event_refund       CHECK (refund_deadline_hours >= 0)
);
 
CREATE INDEX idx_events_feed    ON evenements (neighbourhood_id, status, starts_at);
CREATE INDEX idx_events_creator ON evenements (creator_id);
CREATE INDEX idx_events_group   ON evenements (group_id);
 
-- ============================================================
-- event_participants
-- Ordre FIFO via registered_at pour la gestion de liste d'attente
-- Promotion waitlist → registered déclenchée automatiquement
--   par NestJS à chaque annulation ou libération de place
-- DEFAULT 'waitlisted' : valeur par défaut pessimiste — NestJS vérifie
--   la disponibilité et met à jour en 'registered' si une place est libre
-- CHECK : amount_cents >= 0
-- stripe_session_id et stripe_payment_intent sont uniques
-- ============================================================
 
CREATE TABLE event_participants (
    user_id               UUID                     NOT NULL REFERENCES users (id),
    event_id              UUID                     NOT NULL REFERENCES evenements (id),
    status                participant_status_enum  NOT NULL DEFAULT 'waitlisted',
    payment_status        payment_status_enum      NOT NULL DEFAULT 'free',
    stripe_session_id     VARCHAR                  UNIQUE,
    stripe_payment_intent VARCHAR                  UNIQUE,
    amount_cents          INTEGER                  NOT NULL DEFAULT 0,
    registered_at         TIMESTAMPTZ              NOT NULL DEFAULT now(),
    promoted_at           TIMESTAMPTZ,
    paid_at               TIMESTAMPTZ,
    cancelled_at          TIMESTAMPTZ,
    notified_at           TIMESTAMPTZ,
    refunded_at           TIMESTAMPTZ,
    refund_stripe_id      VARCHAR,
 
    PRIMARY KEY (user_id, event_id),
    CONSTRAINT chk_ep_amount CHECK (amount_cents >= 0)
);
 
CREATE INDEX idx_ep_event_status_fifo ON event_participants (event_id, status, registered_at);
CREATE INDEX idx_ep_stripe_session    ON event_participants (stripe_session_id);
 
-- ============================================================
-- event_swipes
-- ============================================================
 
CREATE TABLE event_swipes (
    user_id   UUID                 NOT NULL REFERENCES users (id),
    event_id  UUID                 NOT NULL REFERENCES evenements (id),
    direction swipe_direction_enum NOT NULL,
    swiped_at TIMESTAMPTZ          NOT NULL DEFAULT now(),
 
    PRIMARY KEY (user_id, event_id)
);
 
CREATE INDEX idx_event_swipes_dir ON event_swipes (event_id, direction);
 
-- ============================================================
-- event_reports
-- ============================================================
 
CREATE TABLE event_reports (
    id          UUID        PRIMARY KEY DEFAULT uuidv7(),
    event_id    UUID        NOT NULL REFERENCES evenements (id),
    reporter_id UUID        NOT NULL REFERENCES users (id),
    reason      TEXT        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ
);
 
CREATE INDEX idx_erep_event    ON event_reports (event_id);
CREATE INDEX idx_erep_resolved ON event_reports (resolved_at);
 
-- ============================================================
-- event_moderation_actions
-- ============================================================
 
CREATE TABLE event_moderation_actions (
    id           UUID                   PRIMARY KEY DEFAULT uuidv7(),
    event_id     UUID                   NOT NULL REFERENCES evenements (id),
    moderator_id UUID                   NOT NULL REFERENCES users (id),
    action       moderation_action_enum NOT NULL,
    reason       TEXT                   NOT NULL,
    created_at   TIMESTAMPTZ            NOT NULL DEFAULT now()
);
 
CREATE INDEX idx_emod_event ON event_moderation_actions (event_id);
```
 
 
### Votes & Sondages
 
```sql
CREATE TYPE poll_type_enum AS ENUM ('single', 'multiple', 'weighted');
 
-- ============================================================
-- polls
-- ends_at NULL = pas de clôture automatique
-- closed_at : clôture manuelle par le créateur
-- closed_by NULL = clôture automatique (ends_at dépassé)
-- CHECK : ends_at > starts_at
-- Pour poll_type 'single' : unicité (user_id, poll_id)
--   enforced applicativement par NestJS + transaction
-- neighbourhood_id : référence Neo4j
-- ============================================================
 
CREATE TABLE polls (
    id               UUID           PRIMARY KEY DEFAULT uuidv7(),
    title            VARCHAR        NOT NULL,
    description      TEXT,
    creator_id       UUID           NOT NULL REFERENCES users (id),
    neighbourhood_id TEXT,
    poll_type        poll_type_enum NOT NULL DEFAULT 'single',
    starts_at        TIMESTAMPTZ,
    ends_at          TIMESTAMPTZ,
    is_anonymous     BOOLEAN        NOT NULL DEFAULT false,
    closed_at        TIMESTAMPTZ,
    closed_by        UUID           REFERENCES users (id),
    created_at       TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ,
    deleted_at       TIMESTAMPTZ,
 
    CONSTRAINT chk_poll_dates CHECK (ends_at IS NULL OR ends_at > starts_at)
);
 
CREATE INDEX idx_polls_active  ON polls (neighbourhood_id, ends_at);
CREATE INDEX idx_polls_creator ON polls (creator_id);
 
-- ============================================================
-- poll_options
-- ============================================================
 
CREATE TABLE poll_options (
    id         UUID        PRIMARY KEY DEFAULT uuidv7(),
    poll_id    UUID        NOT NULL REFERENCES polls (id),
    label      VARCHAR     NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
 
CREATE INDEX idx_poll_options_poll ON poll_options (poll_id);
 
-- ============================================================
-- votes
-- CHECK : weight >= 1
-- updated_at : permet la modification du vote (weighted)
-- ============================================================
 
CREATE TABLE votes (
    user_id    UUID        NOT NULL REFERENCES users (id),
    option_id  UUID        NOT NULL REFERENCES poll_options (id),
    weight     INTEGER     NOT NULL DEFAULT 1,
    voted_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
 
    PRIMARY KEY (user_id, option_id),
    CONSTRAINT chk_vote_weight CHECK (weight >= 1)
);
```
 
 
### Incidents
 
```sql
CREATE TYPE incident_severity_enum AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE incident_status_enum   AS ENUM ('open', 'in_progress', 'resolved');
 
-- ============================================================
-- incidents
-- Application : Java Desktop
-- neighbourhood_id : référence Neo4j
-- mongo_document_id : pièces jointes / détails stockés MongoDB
-- ============================================================
 
CREATE TABLE incidents (
    id                UUID                    PRIMARY KEY DEFAULT uuidv7(),
    reporter_id       UUID                    NOT NULL REFERENCES users (id),
    assigned_to       UUID                    REFERENCES users (id),
    neighbourhood_id  TEXT,
    mongo_document_id TEXT,
    title             VARCHAR                 NOT NULL,
    description       TEXT,
    severity          incident_severity_enum  NOT NULL DEFAULT 'medium',
    status            incident_status_enum    NOT NULL DEFAULT 'open',
    assigned_at       TIMESTAMPTZ,
    created_at        TIMESTAMPTZ             NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ,
    resolved_at       TIMESTAMPTZ
);
 
CREATE INDEX idx_incidents_feed     ON incidents (neighbourhood_id, status);
CREATE INDEX idx_incidents_severity ON incidents (severity);
CREATE INDEX idx_incidents_assigned ON incidents (assigned_to);
```
 
 
### Notes d'implémentation
 
| Aspect | Détail |
|---|---|
| UUID | `uuidv7()` via extension `pg_uuidv7` — UUID v7 ordonné chronologiquement, compatible index B-tree |
| Hachage mots de passe | Argon2id — sel embarqué dans le hash |
| TOTP | Seed chiffré AES-256-GCM au repos (IV unique par utilisateur, auth_tag vérifié au déchiffrement) |
| Tokens de session | SHA-256 du refresh token brut — stocké en cookie HttpOnly Secure SameSite=Strict |
| Contenu média | Images compressées via sharp → WebP (qualité 80). Vidéos compressées via ffmpeg → 1080p max. Audio transcodé via ffmpeg → Opus 128kbps. Stockage GridFS (avatar max 2 MB, bannière max 4 MB, images max 5 MB, vidéo/PDF/audio max 50 MB) |
| Données géographiques | `neighbourhood_id` est une référence Neo4j — pas de FK SQL |
| Données enrichies | `mongo_document_id` sur `listings`, `evenements`, `incidents` |
| Stripe | `stripe_account_id` sur `users` (Connect) — `stripe_session_id` + `stripe_payment_intent` sur transactions et participations |
| Soft delete | Colonnes `deleted_at` sur `users`, `chat_groups`, `listings`, `evenements`, `polls` |
| Promotion waitlist | Déclenchée automatiquement par NestJS (FIFO via `registered_at`) à chaque annulation |
| Default `event_participants.status` | `'waitlisted'` — valeur pessimiste par défaut. Le worker BullMQ vérifie la disponibilité et insère avec `'registered'` si une place est libre. Le default sert de filet de sécurité en cas de race condition. |
| Unicité vote single | `(user_id, poll_id)` enforced applicativement par NestJS + transaction PostgreSQL |
| Convention amitié | `user1_id < user2_id` enforced par CHECK SQL sur `friendships` |
 

## 3.2 MongoDB — Collections 
 
### `user_media` — Avatars & bannières
 
Référencé par : `users.profile_picture_mongo_id`, `users.banner_mongo_id`
 
```js
{
  _id:          ObjectId,
  pg_user_id:   "uuid",
  type:         "avatar" | "banner",
  data:         BinData,
  mimetype:     "image/webp",
  size_bytes:   Number,
  width_px:     Number,
  height_px:    Number,
  uploaded_at:  ISODate,
  replaced_at:  ISODate | null   // null = jamais remplacé
}
```
 
**Limites :** avatar 2 MB, bannière 4 MB — compressés via sharp (WebP)
 
**Index :**
```js
{ pg_user_id: 1, type: 1 }  // unique
{ uploaded_at: -1 }
```
 
---
 
### `listing_documents` — Contenu enrichi annonces
 
Référencé par : `listings.mongo_document_id`
 
```js
{
  _id:            ObjectId,
  pg_listing_id:  "uuid",
  body_html:      String,
  photos: [
    {
      data:         BinData,
      mimetype:     "image/webp",
      caption:      String | null,
      size_bytes:   Number,
      order:        Number,
      uploaded_at:  ISODate
    }
  ],
  tags:           [String],
  created_at:     ISODate,
  updated_at:     ISODate,
  anonymised_at:  ISODate | null
}
```
 
**Limites :** max 8 photos, 5 MB chacune
 
**Index :**
```js
{ pg_listing_id: 1 }  // unique
{ tags: 1 }           // multikey
{ updated_at: -1 }
```
 
 
### `contracts` — Contrats & reçus
 
Référencé par : `listing_transactions.contract_mongo_id`, `listing_transactions.receipt_mongo_id`
 
> ⚠️ **Jamais supprimés** — anonymisés à la demande RGPD uniquement  
> Anonymisation : `full_name` → `"[SUPPRIMÉ]"`, `email` → SHA-256,  
> `canvas_b64` / `signed_ip` / `user_agent` → `null`  
> `sha256_hash` + `pdf.data` conservés comme preuve légale eIDAS
 
```js
{
  _id:                ObjectId,
  pg_transaction_id:  "uuid",
  type:               "contract" | "receipt",
  sha256_hash:        String,
  pdf: {
    data:             BinData,
    mimetype:         "application/pdf",
    size_bytes:       Number
  },
  parties: {
    provider: {
      pg_user_id:     "uuid",
      full_name:      String,
      email:          String
    },
    requester: {
      pg_user_id:     "uuid",
      full_name:      String,
      email:          String
    }
  },
  listing_snapshot: {
    title:              String,
    price_cents:        Number,
    listing_type:       "offer" | "request",
    neighbourhood_name: String   // nom lisible du quartier au moment de la signature
  },
  signature: {
    canvas_b64:       String | null,
    totp_verified_at: ISODate,
    signed_ip:        String | null,
    user_agent:       String | null
  },
  signed_at:          ISODate | null,   // null = en attente de signature (statut "pending_signature" inféré)
  created_at:         ISODate,
  anonymised_at:      ISODate | null
}
```
 
**Index :**
```js
{ pg_transaction_id: 1 }  // unique
{ sha256_hash: 1 }        // unique
{ signed_at: -1 }
{ anonymised_at: 1 }
```
 
 
### `messages` — Messages chiffrés
 
Référencé par : `message_metadata.mongo_message_id`
 
> Clé AES du groupe dans Redis : `group_key:<pg_group_id>` → clé chiffrée avec master key serveur  
> ⚠️ Toutes les pièces jointes sont en BinData inline, limite 8 MB par fichier
 
```js
{
  _id:                ObjectId,
  pg_message_id:      "uuid",
  pg_group_id:        "uuid",      // dénormalisé — évite jointure cross-DB
  pg_sender_id:       "uuid",      // dénormalisé — évite jointure cross-DB
  content_encrypted:  String,      // base64 — AES-256-GCM ciphertext
  iv:                 String,      // base64 — 96 bits, unique par message
  auth_tag:           String,      // base64 — GCM auth tag 16 bytes (intégrité)
  type:               "text" | "image" | "file" | "voice",
  attachments: [
    {
      data:           BinData,
      mimetype:       String,
      filename:       String,
      size_bytes:     Number,
      uploaded_at:    ISODate
    }
  ],
  reactions: [
    {
      pg_user_id:     "uuid",
      emoji:          String,
      reacted_at:     ISODate
    }
  ],
  sent_at:            ISODate,
  edited_at:          ISODate | null,
  deleted_at:         ISODate | null
}
```
 
**Limites :** max 3 pièces jointes, 8 MB chacune
 
**Index :**
```js
{ pg_message_id: 1 }              // unique
{ pg_group_id: 1, sent_at: -1 }  // compound — critique pour la pagination de l'historique
{ pg_sender_id: 1 }
{ deleted_at: 1 }
```
 
 
### `event_documents` — Contenu enrichi événements
 
Référencé par : `evenements.mongo_document_id`
 
```js
{
  _id:          ObjectId,
  pg_event_id:  "uuid",
  body_html:    String,
  cover: {
    data:       BinData | null,
    mimetype:   "image/webp",
    size_bytes: Number
  } | null,
  programme: [
    {
      time:     String,    // ex : "14h00"
      label:    String
    }
  ],
  location: {
    address:    String | null,   // adresse textuelle libre
    geocode:    String | null    // résultat BAN (Base Adresse Nationale) - affichage uniquement, non indexé
  },
  attachments: [
    {
      data:         BinData,
      name:         String,
      mimetype:     String,
      size_bytes:   Number,
      uploaded_at:  ISODate
    }
  ],
  created_at:   ISODate,
  updated_at:   ISODate,
  anonymised_at: ISODate | null
}
```
 
**Index :**
```js
{ pg_event_id: 1 }  // unique
{ updated_at: -1 }
```
 
 
### `event_tickets` — Billets QR
 
QR codes générés pour tous les participants (événements payants ET gratuits)  
Référencé implicitement via `pg_event_id` + `pg_user_id`
 
> HMAC-SHA256 signé côté NestJS pour éviter la falsification
 
```js
{
  _id:          ObjectId,
  pg_event_id:  "uuid",
  pg_user_id:   "uuid",
  qr_payload: {
    event_id:     "uuid",
    user_id:      "uuid",
    first_name:   String,
    custom_value: String | null,  // code salle, mot de passe entrée...
    hmac_sha256:  String          // HMAC-SHA256 signé serveur
  },
  qr_png:       BinData,          // image PNG du QR code
  issued_at:    ISODate,
  scanned_at:   ISODate | null    // null = pas encore scanné
}
```
 
**Index :**
```js
{ pg_event_id: 1, pg_user_id: 1 }      // unique
{ "qr_payload.hmac_sha256": 1 }        // unique — vérification rapide à la porte
{ issued_at: -1 }
```
 
---
 
### `incident_documents` — Documents incidents
 
Référencé par : `incidents.mongo_document_id`  
Alimenté par le client Java en mode offline-first (synchronisation différée)
 
```js
{
  _id:              ObjectId,
  pg_incident_id:   "uuid",
  body:             String,
  photos: [
    {
      data:         BinData,
      mimetype:     "image/jpeg" | "image/webp",
      size_bytes:   Number,
      taken_at:     ISODate,
      synced_at:    ISODate
    }
  ],
  location_hint:    String | null,
  created_at:       ISODate,
  updated_at:       ISODate,
  synced_at:        ISODate
}
```
 
**Index :**
```js
{ pg_incident_id: 1 }  // unique
{ synced_at: -1 }
{ updated_at: -1 }
```
 
 
### Notes d'implémentation
 
| Aspect | Détail |
|---|---|
| Stockage binaire | GridFS (chunks 255 KB) — chaque fichier a un document de métadonnées indépendant dans `media_files` + données binaires dans `fs.files`/`fs.chunks`. Supprime la limite BSON 16 MB, permet le streaming HTTP avec Range headers |
| Chiffrement messages | AES-256-GCM — clé par groupe dans Redis (`group_key:<pg_group_id>`) chiffrée avec master key serveur |
| IV | 96 bits, unique par message — ne jamais réutiliser |
| Auth tag | 16 bytes GCM — vérification d'intégrité obligatoire au déchiffrement |
| Images | Compressées en WebP via sharp avant stockage |
| Anonymisation RGPD | `full_name` → `[SUPPRIMÉ]`, `email` → SHA-256, données de signature → `null` — `contracts` jamais supprimés |
| Preuve légale | `sha256_hash` + `pdf.data` conservés conformément eIDAS même après anonymisation |
| QR codes | HMAC-SHA256 signé NestJS — vérification via index sur `qr_payload.hmac_sha256` |
| Offline-first | `incident_documents` synchronisé en différé depuis le client Java — `synced_at` tracé par document et par photo |
| Dénormalisation | `pg_group_id` et `pg_sender_id` dans `messages` pour éviter les jointures cross-base |
 

## 3.3 Neo4j — Graphe social & géographique

⚠️ **Neo4j est SOURCE DE VÉRITÉ pour les quartiers.**  
PostgreSQL stocke uniquement `neighbourhood_id` (text) comme référence opaque.  
Aucune table `neighbourhoods` dans PostgreSQL.  
Toute donnée géographique (géométrie, centroïde, nom, ville) vit exclusivement dans Neo4j.
 
### Nœuds

#### `(:User)`
 
Propriétés minimales — les détails complets restent dans PostgreSQL.
 
```cypher
{
  pg_id:            "uuid",                                          // FK → users.id
  neighbourhood_id: "string",                                        // FK → (:Neighbourhood).pg_id
  visibility:       "public" | "friends" | "private",
  role:             "resident" | "neighbourhood_rep" | "moderator" | "admin",
  deleted_at:       null                                             // soft delete — synchronisé depuis PostgreSQL
}
```
 
#### `(:Neighbourhood)`
 
Source de vérité complète — aucune donnée dupliquée dans PostgreSQL.
 
```cypher
{
  pg_id:    "string",       // slug identifiant métier ex: "paris-11-folie-mericourt"
  name:     "Folie Méricourt",
  city:     "Paris",
  zip_code: "75011",
  country:  "FR",
 
  // Centroïde — type natif Neo4j Point (WGS-84)
  // Utilisé pour les calculs de distance via point.distance()
  centroid: point({ latitude: 48.8633, longitude: 2.3715, crs: "WGS-84" }),
 
  // Géométrie complète du polygone — GeoJSON string
  // Produit par Leaflet.draw côté admin React, envoyé tel quel via NestJS
  // Format : { "type": "Polygon", "coordinates": [[[lng, lat], ...]] }
  geometry: '{"type":"Polygon","coordinates":[[[2.36,48.85],[2.38,48.85],[2.38,48.87],[2.36,48.87],[2.36,48.85]]]}',
 
  area_m2:    1250000,      // surface calculée par NestJS (turf.js) à la création
  created_at: datetime(),
  updated_at: datetime()
}
```
 
#### `(:Listing)`
 
```cypher
{
  pg_id:            "uuid",
  listing_type:     "offer" | "request",
  status:           "open" | "pending" | "in_progress" | "closed" | "cancelled",
  neighbourhood_id: "string",
  created_at:       datetime()
}
```
 
#### `(:Event)`
 
```cypher
{
  pg_id:            "uuid",
  status:           "published" | "open" | "cancelled" | "completed",
  neighbourhood_id: "string",
  starts_at:        datetime(),
  cost_cents:       0
}
```
 
#### `(:Category)`
 
Partagé listings ET événements — signal d'affinité utilisateur.
 
```cypher
{
  pg_id:  Number,           // FK → listing_category.id ou evenements_category.id
  name:   "Jardinage",
  domain: "listing" | "event"
}
```
 
 
### Relations
 
| Relation | Direction | Propriétés | Notes |
|---|---|---|---|
| `LIVES_IN` | User → Neighbourhood | — | |
| `ADJACENT_TO` | Neighbourhood ↔ Neighbourhood | — | Non-dirigée — créée manuellement ou auto via `turf.js booleanIntersects` |
| `FOLLOWS` | User → User | `since: datetime()` | Pas de self-follow (NestJS) |
| `FRIENDS_WITH` | User ↔ User | `since: datetime()` | Non-dirigée — créée automatiquement au double follow |
| `BLOCKS` | User → User | — | Dirigée — `blocker → blocked`, synchronisée depuis PostgreSQL `user_blocks` |
| `POSTED_IN` | Listing → Neighbourhood | — | |
| `HOSTED_IN` | Event → Neighbourhood | — | |
| `LIKED_LISTING` | User → Listing | `at: datetime()` | |
| `VIEWED_LISTING` | User → Listing | `at: datetime()` | Utilisé pour filtrer les annonces déjà vues |
| `LIKED_EVENT` | User → Event | `at: datetime()` | |
| `ATTENDED_EVENT` | User → Event | `at: datetime()` | |
| `INTERESTED_IN` | User → Category | `weight: Number` | Incrémenté à chaque interaction (`MERGE ON MATCH SET weight = weight + 1`) |
| `BELONGS_TO` | Category → Neighbourhood | — | |
 
 
### Index
 
```cypher
// Index par pg_id (lookups depuis PostgreSQL)
CREATE INDEX user_pg_id         FOR (u:User)         ON (u.pg_id);
CREATE INDEX listing_pg_id      FOR (l:Listing)       ON (l.pg_id);
CREATE INDEX event_pg_id        FOR (e:Event)         ON (e.pg_id);
CREATE INDEX neighbourhood_id   FOR (n:Neighbourhood) ON (n.pg_id);
CREATE INDEX neighbourhood_city FOR (n:Neighbourhood) ON (n.city);
CREATE INDEX category_pg_id     FOR (c:Category)      ON (c.pg_id);
 
// Index composites (requêtes de feed)
CREATE INDEX listing_status_date FOR (l:Listing) ON (l.status, l.created_at);
CREATE INDEX event_status_date   FOR (e:Event)   ON (e.status, e.starts_at);
CREATE INDEX user_visibility     FOR (u:User)    ON (u.visibility);
 
// Index spatial sur le centroïde (requêtes de proximité GPS)
CREATE POINT INDEX neighbourhood_centroid FOR (n:Neighbourhood) ON (n.centroid);
```
 
 
### Requêtes Cypher
 
#### 1 — Fil d'annonces
 
Annonces du quartier de l'utilisateur et des quartiers adjacents, en excluant les annonces déjà vues ou likées, et les annonces de comptes bloqués.
 
```cypher
MATCH (me:User {pg_id: $userId})-[:LIVES_IN]->(n:Neighbourhood)
OPTIONAL MATCH (n)-[:ADJACENT_TO]-(adjacent:Neighbourhood)
WITH me, n, collect(DISTINCT n) + collect(DISTINCT adjacent) AS zones
UNWIND zones AS zone
MATCH (l:Listing)-[:POSTED_IN]->(zone)
WHERE l.status = "open"
  AND NOT (me)-[:LIKED_LISTING]->(l)
  AND NOT (me)-[:VIEWED_LISTING]->(l)
  AND NOT (me)-[:BLOCKS]->(:User)-[:POSTED_IN]->(l)
  AND NOT (me)<-[:BLOCKS]-(:User)-[:POSTED_IN]->(l)
RETURN DISTINCT l.pg_id
ORDER BY l.created_at DESC
LIMIT 20
```
 
#### 2 — Découverte de profils avec score de pertinence
 
Trois signaux combinés pour scorer les profils à suggérer.
 
```cypher
MATCH (me:User {pg_id: $userId})-[:LIVES_IN]->(n:Neighbourhood)
MATCH (other:User)-[:LIVES_IN]->(on:Neighbourhood)
WHERE other.pg_id <> $userId
  AND other.visibility = "public"
  AND other.deleted_at IS NULL
  AND NOT (me)-[:FOLLOWS]->(other)
  AND NOT (me)-[:BLOCKS]->(other)
  AND NOT (me)<-[:BLOCKS]-(other)
 
WITH me, n, other, on,
  CASE
    WHEN on.pg_id = n.pg_id        THEN 3
    WHEN (n)-[:ADJACENT_TO*1]-(on) THEN 2
    WHEN (n)-[:ADJACENT_TO*2]-(on) THEN 1
    ELSE 0
  END AS geoScore
 
WHERE geoScore > 0
 
OPTIONAL MATCH (me)-[:INTERESTED_IN]->(c:Category)<-[:INTERESTED_IN]-(other)
WITH me, other, geoScore, count(DISTINCT c) AS commonInterests
 
OPTIONAL MATCH (me)-[:FOLLOWS]->(friend:User)-[:FOLLOWS]->(other)
WITH other, geoScore, commonInterests, count(DISTINCT friend) AS networkScore
 
RETURN other.pg_id                                          AS userId,
       geoScore,
       commonInterests,
       networkScore,
       (geoScore * 3 + commonInterests * 2 + networkScore) AS score
ORDER BY score DESC
SKIP $offset LIMIT 20
```
 
**Formule de score :**
 
| Signal | Poids | Source Neo4j |
|---|---|---|
| Proximité géographique (`geoScore`) | ×3 | `ADJACENT_TO*0..2` |
| Intérêts communs (`commonInterests`) | ×2 | `INTERESTED_IN → Category` |
| Réseau social partagé (`networkScore`) | ×1 | `FOLLOWS → User → FOLLOWS` |
 
> Résultat mis en cache Redis `cache:feed:discovery:<user_id>` (TTL 10 min), invalidé à chaque like/swipe/follow.
 
#### 3 — Recommandation d'événements
 
Affinités catégories + réseau amical + popularité.
 
```cypher
MATCH (me:User {pg_id: $userId})-[:LIVES_IN]->(n:Neighbourhood)
OPTIONAL MATCH (n)-[:ADJACENT_TO]-(adjacent:Neighbourhood)
WITH me, collect(DISTINCT n) + collect(DISTINCT adjacent) AS zones
 
UNWIND zones AS zone
MATCH (e:Event)-[:HOSTED_IN]->(zone)
WHERE e.status IN ["published","open"]
  AND e.starts_at > datetime()
  AND NOT (me)-[:ATTENDED_EVENT]->(e)
  AND NOT (me)-[:LIKED_EVENT]->(e)
  AND NOT (me)-[:BLOCKS]->(:User)-[:HOSTED_IN]->(e)
  AND NOT (me)<-[:BLOCKS]-(:User)-[:HOSTED_IN]->(e)
 
OPTIONAL MATCH (me)-[:INTERESTED_IN]->(c:Category)-[:BELONGS_TO]->(zone)
              <-[:HOSTED_IN]-(e)
WITH me, e, count(DISTINCT c) AS categoryScore
 
OPTIONAL MATCH (me)-[:FRIENDS_WITH]-(friend:User)-[:ATTENDED_EVENT]->(e)
WITH me, e, categoryScore, count(DISTINCT friend) AS networkScore
 
OPTIONAL MATCH (participant:User)-[:ATTENDED_EVENT]->(e)
WITH e, categoryScore, networkScore, count(DISTINCT participant) AS popularity
 
RETURN e.pg_id,
       categoryScore,
       networkScore,
       popularity,
       (categoryScore * 2 + networkScore * 3 + log(popularity + 1)) AS score
ORDER BY score DESC
LIMIT 10
```
 
**Formule de score :**
 
| Signal | Poids | Source Neo4j |
|---|---|---|
| Affinités catégories (`categoryScore`) | ×2 | `INTERESTED_IN → Category → BELONGS_TO` |
| Réseau amical présent (`networkScore`) | ×3 | `FRIENDS_WITH → User → ATTENDED_EVENT` |
| Popularité brute (`popularity`) | log(n+1) | `ATTENDED_EVENT` |
 
#### 4 — Vérifier si deux utilisateurs sont amis
 
```cypher
MATCH (a:User {pg_id: $userId1})-[:FRIENDS_WITH]-(b:User {pg_id: $userId2})
RETURN count(*) > 0 AS are_friends
```
 
#### 5 — Membres d'un quartier
 
```cypher
MATCH (u:User)-[:LIVES_IN]->(n:Neighbourhood {pg_id: $neighbourhoodId})
WHERE u.deleted_at IS NULL
RETURN u.pg_id, u.visibility
ORDER BY u.pg_id
```
 
### 6 — Détail complet d'un quartier
 
Remplace toute requête SQL — Neo4j est source de vérité.
 
```cypher
MATCH (n:Neighbourhood {pg_id: $neighbourhoodId})
OPTIONAL MATCH (n)-[:ADJACENT_TO]-(adj:Neighbourhood)
RETURN n.pg_id    AS id,
       n.name     AS name,
       n.city     AS city,
       n.zip_code AS zip_code,
       n.country  AS country,
       n.centroid AS centroid,
       n.geometry AS geometry,
       n.area_m2  AS area_m2,
       collect(DISTINCT adj.pg_id) AS adjacent_ids
```
 
#### 7 — Quartiers proches d'un point GPS
 
Utilisé à l'inscription pour suggérer le bon quartier à l'utilisateur.
 
```cypher
MATCH (n:Neighbourhood)
WHERE point.distance(n.centroid, point({latitude: $lat, longitude: $lng})) < $radiusMeters
RETURN n.pg_id, n.name, n.city,
       point.distance(n.centroid, point({latitude: $lat, longitude: $lng})) AS distanceMeters
ORDER BY distanceMeters ASC
LIMIT 5
```
 
#### 8 — Créer ou mettre à jour un quartier
 
Appelé par l'admin API NestJS. `area_m2` calculé par NestJS via `turf.js` avant l'appel.
 
```cypher
MERGE (n:Neighbourhood {pg_id: $pgId})
SET n.name      = $name,
    n.city      = $city,
    n.zip_code  = $zipCode,
    n.country   = $country,
    n.centroid  = point({ latitude: $lat, longitude: $lng, crs: "WGS-84" }),
    n.geometry  = $geometryJson,
    n.area_m2   = $areaM2,
    n.updated_at = datetime()
ON CREATE SET n.created_at = datetime()
```
 
#### 9 — Recréer les adjacences après modification d'un polygone
 
Les anciennes adjacences sont supprimées, puis recréées à partir de la liste fournie par NestJS (détection via `turf.js booleanIntersects`).
 
```cypher
// Étape 1 — supprimer les adjacences existantes
MATCH (n:Neighbourhood {pg_id: $pgId})-[r:ADJACENT_TO]-()
DELETE r
 
// Étape 2 — recréer pour chaque $adjId fourni par NestJS
MATCH (n:Neighbourhood {pg_id: $pgId})
MATCH (adj:Neighbourhood {pg_id: $adjId})
MERGE (n)-[:ADJACENT_TO]-(adj)
```
 
---
 
### Synchronisation PostgreSQL → Neo4j
 
> ⚠️ Tous les writes Neo4j transitent par la queue BullMQ `neo4j-sync` avec retry exponentiel.  
> Les quartiers ne sont **plus** synchronisés depuis PostgreSQL — ils sont créés et modifiés directement via l'admin API NestJS.
 
| Événement NestJS / PostgreSQL | Action Neo4j |
|---|---|
| `POST /admin/neighbourhoods` | `MERGE (:Neighbourhood)` + `SET geometry, centroid, area_m2…` |
| `PATCH /admin/neighbourhoods/:id` | `SET n.*` + `DELETE` / `RECREATE [:ADJACENT_TO]` |
| `users` INSERT | `CREATE (:User)` + `[:LIVES_IN]` |
| `users.deleted_at` SET | `SET u.deleted_at = …` |
| `users.neighbourhood_id` UPDATE | `DELETE [:LIVES_IN]`, `CREATE [:LIVES_IN]` |
| `follow` INSERT | `CREATE [:FOLLOWS]` |
| `friendships` INSERT | `CREATE [:FRIENDS_WITH]` |
| `friendships.unfriended_at` SET | `DELETE [:FRIENDS_WITH]` |
| `user_blocks` INSERT | `CREATE [:BLOCKS]` (dirigée : blocker → blocked) |
| `listings` INSERT | `CREATE (:Listing)` + `[:POSTED_IN]` |
| `listings.status` UPDATE | `SET l.status = …` |
| `listings.deleted_at` SET | `DETACH DELETE (:Listing)` |
| `evenements.published_at` SET | `CREATE (:Event)` + `[:HOSTED_IN]` |
| `evenements.status` UPDATE | `SET e.status = …` |
| `user_swipes direction=like` | `CREATE [:LIKED_LISTING]` |
| `event_swipes direction=like` | `CREATE [:LIKED_EVENT]` |
| `event_participants` registered | `CREATE [:ATTENDED_EVENT]` + `MERGE [:INTERESTED_IN] ON MATCH SET weight += 1` |
| `listing_transactions` completed | `MERGE [:INTERESTED_IN] ON MATCH SET weight += 1` |


### CQRS implicite
 
L'architecture repose sur une séparation lecture/écriture entre les bases :
 
- **PostgreSQL** est la **source de vérité transactionnelle** pour toutes les entités métier. C'est la seule base qui reçoit les writes applicatifs directs. Elle garantit l'intégrité référentielle, l'audit RGPD et la cohérence forte via les contraintes SQL.
- **Neo4j** est le **read model optimisé** pour les traversées de graphe. Il ne reçoit jamais de write direct depuis le frontend — uniquement des projections synchronisées depuis PostgreSQL via la queue BullMQ `neo4j-sync`.
- **MongoDB** stocke les **données non structurées et les binaires** (contenu enrichi, messages chiffrés, médias). Il est la source de vérité pour ces données mais n'a aucun rôle transactionnel.
 
En conséquence, Neo4j et MongoDB sont **éventuellement cohérents** avec PostgreSQL. Un délai existe entre tout write PostgreSQL et sa projection dans les autres bases.
 
#### Responsabilités par base de données
 
| Donnée | Source de vérité | Projection |
|---|---|---|
| Identité utilisateur | PostgreSQL `users` | Neo4j `(:User)` — propriétés minimales uniquement |
| Sessions & tokens | PostgreSQL `user_sessions` | — |
| Préférences notifications | PostgreSQL `user_notification_preferences` | — |
| Relations `follow` | PostgreSQL `follow` | Neo4j `[:FOLLOWS]` |
| Relations `friendship` | PostgreSQL `friendships` | Neo4j `[:FRIENDS_WITH]` |
| Blocages | PostgreSQL `user_blocks` | Neo4j `[:BLOCKS]` |
| Swipes profil | PostgreSQL `user_swipes` | Neo4j `[:LIKED_LISTING]` (si like) |
| Quartiers | **Neo4j `(:Neighbourhood)`** | PostgreSQL stocke uniquement `neighbourhood_id` (référence opaque) |
| Adjacences quartiers | **Neo4j `[:ADJACENT_TO]`** | — |
| Annonces | PostgreSQL `listings` | Neo4j `(:Listing)` — propriétés minimales |
| Contenu enrichi annonces | MongoDB `listing_documents` | — |
| Événements | PostgreSQL `evenements` | Neo4j `(:Event)` — propriétés minimales |
| Contenu enrichi événements | MongoDB `event_documents` | — |
| Tickets QR | MongoDB `event_tickets` | — |
| Messages | MongoDB `messages` | PostgreSQL `message_metadata` (métadonnées uniquement) |
| Contrats & reçus | MongoDB `contracts` | PostgreSQL `listing_transactions.contract_mongo_id` (référence) |
| Incidents | PostgreSQL `incidents` | MongoDB `incident_documents` (contenu enrichi) |
| Affinités catégories | Neo4j `[:INTERESTED_IN]` | — |
 
 
#### Relations sociales — double représentation
 
Les trois relations sociales suivantes existent dans les deux bases avec des rôles distincts :
 
##### `follow` / `[:FOLLOWS]`
 
| | PostgreSQL | Neo4j |
|---|---|---|
| Table / Label | `follow` | `(:User)-[:FOLLOWS]->(:User)` |
| Rôle | Source de vérité, audit, notifications | Traversées de graphe, calcul `networkScore` |
| Propriété temporelle | `followed_at` | `since` |
| Suppression | Suppression physique de la ligne | `DELETE [:FOLLOWS]` |
 
##### `friendships` / `[:FRIENDS_WITH]`
 
| | PostgreSQL | Neo4j |
|---|---|---|
| Table / Label | `friendships` | `(:User)-[:FRIENDS_WITH]-(:User)` |
| Rôle | Source de vérité, lien vers le groupe DM (`group_id`) | Traversées de graphe, calcul `networkScore` événements |
| Propriété temporelle | `friended_at` | `since` |
| Fin d'amitié | Soft : `unfriended_at` SET | Hard : `DELETE [:FRIENDS_WITH]` |
| Données exclusives | `group_id` (DM auto-créé) | — |
 
> ⚠️ Les historiques ne sont pas symétriques : PostgreSQL conserve une trace de toutes les amitiés passées via `unfriended_at`, Neo4j ne conserve que l'état courant. Toute consultation de l'historique social doit passer par PostgreSQL.
 
##### `user_blocks` / `[:BLOCKS]`
 
| | PostgreSQL | Neo4j |
|---|---|---|
| Table / Label | `user_blocks` | `(:User)-[:BLOCKS]->(:User)` |
| Rôle | Source de vérité, contrôle d'accès applicatif | Filtrage dans les requêtes de feed et découverte |
| Direction | Dirigée (`blocker_id → blocked_id`) | Dirigée (`blocker → blocked`) |
| Suppression | Suppression physique de la ligne | `DELETE [:BLOCKS]` |
 
> ⚠️ **Risque de sécurité :** le filtrage des utilisateurs bloqués dans les feeds Neo4j est éventuellement cohérent. Entre le moment où un blocage est enregistré dans PostgreSQL et sa propagation dans Neo4j, un contenu de l'utilisateur bloqué peut apparaître dans les résultats. Le contrôle d'accès final (ex. : accès à une conversation, affichage d'un profil) doit toujours être vérifié en PostgreSQL, jamais uniquement en Neo4j.
 
 
### Pipeline de synchronisation PostgreSQL → Neo4j
 
Tous les writes Neo4j transitent exclusivement par la queue BullMQ `neo4j-sync`.
 
```
PostgreSQL write
      │
      ▼
NestJS service
      │
      ▼
BullMQ queue : neo4j-sync
      │  retry exponentiel (3 tentatives, backoff 1s / 5s / 30s)
      ▼
Neo4j write
```
 
### Garanties
 
| Propriété | Valeur |
|---|---|
| Cohérence | **Éventuelle** — délai variable selon charge de la queue |
| Durabilité des jobs | Oui — BullMQ persiste les jobs dans Redis |
| Retry en cas d'échec | Oui — 3 tentatives avec backoff exponentiel |
| Ordre des événements | Garanti par job dans la queue (FIFO par type d'événement) |
| Write direct Neo4j sans queue | **Interdit** sauf `POST/PATCH /admin/neighbourhoods` |
 
### Cas de panne
 
En cas de panne prolongée de la queue BullMQ ou de Redis :
 
1. PostgreSQL continue de recevoir les writes normalement — aucune dégradation fonctionnelle côté transactionnel.
2. Neo4j dérive progressivement de PostgreSQL — les feeds de découverte et recommandations deviennent partiellement obsolètes.
3. À la reprise, les jobs non traités sont rejoués dans l'ordre — la cohérence est restaurée automatiquement sans intervention manuelle.
4. Si Redis est perdu sans persistance, les jobs en attente sont perdus. Une procédure de **resync complète** Neo4j depuis PostgreSQL doit être disponible (script NestJS `neo4j:resync`).
 
 
## Données exclusivement dans Neo4j
 
Les quartiers (`Neighbourhood`) et leurs adjacences (`ADJACENT_TO`) n'ont **aucun équivalent dans PostgreSQL**. Ce sont les seules données dont Neo4j est source de vérité sans projection inverse.
 
Conséquences :
- Toute lecture d'information géographique (nom du quartier, ville, géométrie, voisins) passe obligatoirement par Neo4j.
- PostgreSQL ne stocke que `neighbourhood_id` (string opaque) sur les tables `users`, `listings`, `evenements`, `polls`, `incidents` — sans contrainte FK.
- En cas d'indisponibilité de Neo4j, les fonctionnalités suivantes sont dégradées : affichage du nom du quartier, fil d'annonces géolocalisé, recommandation d'événements, découverte de profils, inscription avec suggestion de quartier.
 
 
## Données exclusivement dans MongoDB
 
Les données suivantes n'ont aucun équivalent structurel dans PostgreSQL ou Neo4j :
 
| Collection | Référence dans PostgreSQL |
|---|---|
| `user_media` | `users.profile_picture_mongo_id`, `users.banner_mongo_id` |
| `listing_documents` | `listings.mongo_document_id` |
| `contracts` | `listing_transactions.contract_mongo_id`, `.receipt_mongo_id` |
| `messages` | `message_metadata.mongo_message_id` |
| `event_documents` | `evenements.mongo_document_id` |
| `event_tickets` | Référence implicite via `pg_event_id` + `pg_user_id` |
| `incident_documents` | `incidents.mongo_document_id` |
 
PostgreSQL ne stocke que l'identifiant MongoDB (`ObjectId` sérialisé en string). En cas d'indisponibilité de MongoDB, les fonctionnalités dégradées sont : affichage des photos et descriptions enrichies, envoi et réception de messages, téléchargement de contrats, accès aux billets QR.
 
 
### Matrice de risque opérationnel
 
| Scénario | Impact | Mitigation |
|---|---|---|
| Délai queue `neo4j-sync` | Contenu d'un utilisateur bloqué visible dans le feed | Contrôle d'accès final toujours vérifié côté PostgreSQL |
| Perte de Redis sans persistance | Jobs `neo4j-sync` perdus, Neo4j diverge | Script `neo4j:resync` + Redis AOF activé en production |
| Indisponibilité Neo4j | Feeds et recommandations hors service | Fallback : feed chronologique simple depuis PostgreSQL |
| Indisponibilité MongoDB | Messages, médias et contrats inaccessibles | Dégradation partielle — fonctionnalités transactionnelles (paiements, listings de base) restent disponibles |
| Désynchronisation `unfriended_at` | Historique social incomplet dans Neo4j | Toute consultation d'historique social passe par PostgreSQL |
 

## 3.4 Redis — Clés & TTL
Rôle : sessions, TOTP, présence, clés AES groupes, queues BullMQ, rate limiting, cache  
Convention clés : `<domaine>:<identifiant>`
 
⚠️ AOF activé en production pour persister `group_key` et les jobs BullMQ :
```
redis-server --appendonly yes --appendfsync everysec
```
 
### Auth — Refresh tokens
 
Rotation à chaque `/auth/refresh` (ancien token supprimé). Révocation immédiate au logout via `DEL`.
 
| Clé | Contenu | TTL |
|---|---|---|
| `refresh:<token_hash>` | `{ user_id, session_id, expires_at }` | 30 jours (2 592 000s) |
 
```
SET refresh:<token_hash> '{"user_id":"...","session_id":"...","expires_at":"..."}' EX 2592000
```
 
 
### Auth — TOTP (2FA)
 
Utilisé pour : connexion, signature de contrat, modification de profil sensible.  
Supprimé immédiatement après vérification réussie.  
Blocage automatique après 3 échecs consécutifs.

Le `challenge_token` est un UUID opaque généré à chaque challenge TOTP. Le client ne reçoit jamais le `user_id` avant authentification complète — protection contre l'énumération de comptes.
 
| Clé | Contenu | TTL |
|---|---|---|
| `totp:pending:<challenge_token>` | `{ user_id, context, attempts, created_at }` | 5 min (300s) |
| `totp:blocked:<user_id>` | `"1"` | 15 min (900s) |
 
**Valeurs de `context` :** `"login"` \| `"signature"` \| `"profile_update"`  
**`attempts` :** max 3 tentatives — au-delà, `totp:blocked` est posé et `totp:pending` supprimé.
 
 
### Auth — Rate limiting
 
Protection brute-force sur les endpoints sensibles.  
Deux clés distinctes pour `login` : par IP et par compte, cumulables.
 
| Clé | Contenu | TTL | Limite |
|---|---|---|---|
| `ratelimit:login:<ip>` | Number | 15 min (900s) | 10 tentatives |
| `ratelimit:login:<user_id>` | Number | 15 min (900s) | 10 tentatives |
| `ratelimit:totp:<user_id>` | Number | 5 min (300s) | 3 tentatives |
| `ratelimit:refresh:<user_id>` | Number | 1 min (60s) | 10 refreshs/min — protection replay |
 
 
### Présence Socket.io
 
Indique si un utilisateur est connecté — utilisé pour décider d'envoyer une notification email ou non.  
Mis à jour à chaque connexion/déconnexion WebSocket.  
Le TTL de 24h est **renouvelé toutes les 25s** par un heartbeat Socket.io (`EXPIRE presence:<user_id> 86400`).
 
| Clé | Contenu | TTL |
|---|---|---|
| `presence:<user_id>` | `{ socket_id, connected_at, device }` | 24h (86400s) — renouvelé heartbeat |
 
**Valeurs de `device` :** `"web"` \| `"java"`
 
```
EXISTS presence:<user_id>  →  1 (en ligne) | 0 (hors ligne)
```
 
 
### Présence — Sourdine temporaire
 
Cache chaud de `users_in_group.muted_until` (PostgreSQL) pour éviter une requête SQL à chaque message entrant.
 
| Clé | Contenu | TTL |
|---|---|---|
| `mute:<user_id>:<group_id>` | `"1"` | Dynamique : `muted_until - now()` |
 
---
 
### Messagerie — Typing indicator
 
Socket.io émet un refresh toutes les 2s tant que l'utilisateur tape.  
Expiration automatique — aucun événement `"stop typing"` nécessaire.
 
| Clé | Contenu | TTL |
|---|---|---|
| `typing:<group_id>:<user_id>` | `"1"` | 4s |
 
 
### Chiffrement — Clés AES-256 des groupes
 
Clé AES de groupe chiffrée avec la master key serveur (variable d'environnement).  
Déchiffrée à la volée par NestJS — jamais exposée au client.  
La clé brute ne vit qu'en RAM Node.js le temps de l'opération.
 
| Clé | Contenu | TTL |
|---|---|---|
| `group_key:<pg_group_id>` | Clé AES-256 chiffrée en base64 | Persistant — supprimé uniquement si groupe soft-deleted |
 
**Procédure de rotation de clé :**
1. Générer une nouvelle clé AES-256
2. Re-chiffrer tous les messages du groupe (batch via queue `bull:crypto-rotation`)
3. `SET group_key:<id>` avec la nouvelle clé chiffrée
4. Incrémenter `key_version` dans PostgreSQL (optionnel, pour audit)
 
 
### Cache — Résultats Neo4j (feeds & recommandations)
 
Évite de recalculer le scoring à chaque requête de feed.
 
| Clé | Contenu | TTL |
|---|---|---|
| `cache:feed:listings:<user_id>` | `["uuid1", "uuid2", ...]` | 5 min (300s) |
| `cache:feed:events:<user_id>` | `["uuid1", "uuid2", ...]` | 5 min (300s) |
| `cache:feed:discovery:<user_id>` | `["uuid1", "uuid2", ...]` | 10 min (600s) |
 
**Invalidation :** `DEL cache:feed:*:<user_id>` déclenché à chaque like, swipe ou follow de cet utilisateur.
 
 
### Cache — Compteurs temps réel
 
Évite des `COUNT(*)` PostgreSQL à chaque affichage.  
Mis à jour par les workers BullMQ après chaque transaction.
 
| Clé | Contenu | TTL |
|---|---|---|
| `counter:poll_votes:<poll_id>:<option_id>` | Number | Dynamique — jusqu'à `ends_at` du sondage |
| `counter:event_participants:<event_id>` | Number — inscrits confirmés | Dynamique — jusqu'à `ends_at` de l'événement |
| `counter:event_waitlist:<event_id>` | Number — en liste d'attente | Dynamique — jusqu'à `ends_at` de l'événement |
 
 
### SSO QR code — Java Desktop
 
Permet la connexion du client Java via scan d'un QR code depuis l'application React.
 
| Clé | Contenu | TTL |
|---|---|---|
| `sso:qr:<token_uuid>` | `{ status, user_id, ip_address, created_at }` | 2 min (120s) |
 
**Valeurs de `status` :** `"pending"` \| `"validated"` \| `"expired"`

**Protection DoS :** avant de créer un nouveau QR, NestJS compte les clés `sso:qr:*` actives pour l'IP demandeur. Si ≥ 3 clés actives → `429 Too Many Requests`. Le TTL court (2 min) garantit un nettoyage automatique.
 
**Flux complet :**
1. Java génère un UUID → affiche un QR code contenant un JWT signé
2. L'utilisateur scanne avec React (mobile ou webcam)
3. React valide le JWT → crée la session dans PostgreSQL → notifie Java via Socket.io
4. Java reçoit les tokens et est connecté
 
 
## Queues BullMQ
 
BullMQ utilise Redis nativement (Sorted Sets + Lists). Les workers se réveillent via `BRPOP` à l'arrivée d'un job — zéro polling, zéro overhead à vide.
 
| Queue | Rôle | Notes |
|---|---|---|
| `bull:neo4j-sync` | Synchronisation PostgreSQL → Neo4j | Retry exponentiel (3 tentatives, backoff 1s / 5s / 30s) |
| `bull:email` | Envoi d'emails | Nodemailer / Brevo |
| `bull:pdf-generation` | Génération contrats et reçus PDF | — |
| `bull:stripe-webhook` | Traitement webhooks Stripe | Idempotent |
| `bull:waitlist-promote` | Promotion liste d'attente événements | Delayed job 24h |
| `bull:rgpd-anonymise` | Batch anonymisation RGPD | Basse priorité |
| `bull:crypto-rotation` | Re-chiffrement messages lors d'une rotation de clé AES | Batch |
| `bull:event-register` | Inscriptions événements | `concurrency: 1` par `eventId` — voir ci-dessous |
 
 
### Architecture `bull:event-register` — Inscriptions concurrentes
 
> ⚠️ Le lock Redis (`SET NX`) **n'est pas utilisé** pour les inscriptions.
>
> Raisons :
> - Un lock rejetterait les utilisateurs simultanés au lieu de les mettre en file d'attente
> - Job perdu si NestJS crashe entre acquisition et libération du lock
> - Mauvaise UX : erreur 409 → réessai manuel
>
> **Architecture retenue : BullMQ sérialiseur + `SELECT FOR UPDATE` PostgreSQL**
 
**Flux :**
1. L'utilisateur clique "Participer"
2. NestJS répond immédiatement `202 Accepted`
3. Job ajouté dans `bull:event-register` avec `jobId: "<event_id>:<user_id>"` — idempotent : un double-clic ne crée pas de doublon
4. Worker (`concurrency: 1`) traite les jobs séquentiellement par `eventId`
5. Transaction PostgreSQL avec `SELECT FOR UPDATE` sur l'événement — source de vérité finale, cohérente même en multi-instances NestJS
6. `INSERT event_participants` avec `status: "registered"` ou `"waitlisted"` selon la disponibilité
7. Socket.io notifie le client du résultat
 
**Structure d'un job :**
```json
{
  "jobId":    "<event_id>:<user_id>",
  "data":     { "event_id": "uuid", "user_id": "uuid" },
  "attempts": 3,
  "backoff":  { "type": "exponential", "delay": 500 }
}
```
 
**Résultat émis via Socket.io :**
```json
{
  "event": "registration_result",
  "data":  { "event_id": "uuid", "status": "registered" | "waitlisted" }
}
```

### Appels WebRTC — Sessions éphémères

`call_id` UUID généré par NestJS à l'initiation de chaque appel. Stocké uniquement
en Redis — aucune persistance PostgreSQL (les appels ne sont pas archivés).

| Clé | Contenu | TTL |
|---|---|---|
| `call:<call_id>` | `{ group_id, caller_id, type, status, created_at }` | 5 min (300s) |

**Valeurs de `status` :** `"pending"` \| `"active"` \| `"ended"` \| `"rejected"` \| `"missed"`

Le TTL de 5 min sert de filet de sécurité : si NestJS crashe pendant un appel,
la clé expire automatiquement sans laisser de session fantôme.
À ajouter au récapitulatif TTL : `call:<call_id>` → 5 min (300s). 

---
 
## Récapitulatif des TTL
 
| Clé                                       | TTL                                               |
|-------------------------------------------|---------------------------------------------------|
| `refresh:<token_hash>`                    | 30 jours (2 592 000s)                             |
| `totp:pending:<challenge_token>`          | 5 min (300s)                                      |
| `totp:blocked:<user_id>`                  | 15 min (900s)                                     |
| `ratelimit:login:<ip>`                    | 15 min (900s)                                     |
| `ratelimit:login:<user_id>`               | 15 min (900s)                                     |
| `ratelimit:totp:<user_id>`                | 5 min (300s)                                      |
| `ratelimit:refresh:<user_id>`             | 1 min (60s)                                       |
| `presence:<user_id>`                      | 24h (86400s) — renouvelé heartbeat toutes les 25s |
| `mute:<user_id>:<group_id>`               | Dynamique (`muted_until - now()`)                 |
| `typing:<group_id>:<user_id>`             | 4s                                                |
| `group_key:<group_id>`                    | Persistant (pas de TTL)                           |
| `cache:feed:listings:<user_id>`           | 5 min (300s)                                      |
| `cache:feed:events:<user_id>`             | 5 min (300s)                                      |
| `cache:feed:discovery:<user_id>`          | 10 min (600s)                                     |
| `counter:poll_votes:<poll_id>:<option_id>` | Dynamique (jusqu'à `ends_at`)                     |
| `counter:event_participants:<event_id>`   | Dynamique (jusqu'à `ends_at`)                     |
| `counter:event_waitlist:<event_id>`       | Dynamique (jusqu'à `ends_at`)                     |
| `sso:qr:<token_uuid>`                     | 2 min (120s)                                      |
| `call:<call_id>`                          | 5 min (300s)                                      |


## 3.5 SQLite — Application Java Desktop

### Rôle
 
La base SQLite embarquée dans l'application Java est un **sous-ensemble offline-first**
de PostgreSQL. Elle ne contient que les données nécessaires au fonctionnement sans connexion
(incidents, modération, statistiques pré-calculées, paramètres locaux).
 
MongoDB et Neo4j ne sont **pas** répliqués en local.
 
> Les noms de colonnes suivent exactement ceux de PostgreSQL pour simplifier
> la désérialisation des réponses NestJS sans transformation.
 
 
### Tables synchronisées depuis PostgreSQL
 
#### `users` — annuaire local (lecture seule)
 
Sous-ensemble minimal pour afficher les noms et rôles dans l'UI Java.
 
```sql
CREATE TABLE users (
    id               TEXT NOT NULL PRIMARY KEY,  -- UUID PostgreSQL (users.id)
    first_name       TEXT NOT NULL,              -- aligné sur PostgreSQL : first_name
    last_name        TEXT NOT NULL,              -- aligné sur PostgreSQL : last_name
    role             TEXT NOT NULL,              -- resident | neighbourhood_rep | moderator | admin
    neighbourhood_id TEXT,
    deleted_at       TEXT                        -- ISO 8601, NULL si actif
);
```
 
 
#### `listing_categories` — catégories d'annonces (lecture seule)

```sql
CREATE TABLE listing_categories (
    id              INTEGER NOT NULL PRIMARY KEY,
    parent_category INTEGER,
    category_name   TEXT NOT NULL,
    created_at      TEXT NOT NULL,              -- ISO 8601
    updated_at      TEXT                        -- ISO 8601
);
```


#### `event_categories` — catégories d'événements (lecture seule)

```sql
CREATE TABLE event_categories (
    id              INTEGER NOT NULL PRIMARY KEY,
    parent_category INTEGER,
    category_name   TEXT NOT NULL,
    created_at      TEXT NOT NULL,              -- ISO 8601
    updated_at      TEXT                        -- ISO 8601
);
```


#### `poll_options` — options de sondage (lecture seule)

```sql
CREATE TABLE poll_options (
    id         TEXT NOT NULL PRIMARY KEY,      -- UUID
    poll_id    TEXT NOT NULL,                  -- FK → polls.id
    label      TEXT NOT NULL,
    created_at TEXT NOT NULL                   -- ISO 8601
);
```


#### `event_participants` — participants aux événements (lecture seule)

```sql
CREATE TABLE event_participants (
    user_id               TEXT NOT NULL,       -- FK → users.id
    event_id              TEXT NOT NULL,       -- FK → evenements.id
    status                TEXT NOT NULL,       -- registered | waitlisted | cancelled
    payment_status        TEXT NOT NULL,       -- free | pending | completed | refunded
    stripe_session_id     TEXT,
    stripe_payment_intent TEXT,
    amount_cents          INTEGER NOT NULL,
    registered_at         TEXT NOT NULL,       -- ISO 8601
    promoted_at           TEXT,                -- ISO 8601
    paid_at               TEXT,                -- ISO 8601
    cancelled_at          TEXT,                -- ISO 8601
    notified_at           TEXT,                -- ISO 8601
    refunded_at           TEXT,                -- ISO 8601
    refund_stripe_id      TEXT,
    PRIMARY KEY (user_id, event_id)
);
```


#### `users_in_group` — membres des groupes de chat (lecture seule)

```sql
CREATE TABLE users_in_group (
    user_id       TEXT NOT NULL,               -- FK → users.id
    group_id      TEXT NOT NULL,               -- FK → chat_groups.id
    role_in_group TEXT NOT NULL,               -- watch | message | actions | admin
    joined_at     TEXT NOT NULL,               -- ISO 8601
    left_at       TEXT,                        -- ISO 8601
    kicked_at     TEXT,                        -- ISO 8601
    is_muted      INTEGER NOT NULL DEFAULT 0,  -- 0 = non, 1 = oui
    muted_until   TEXT,                        -- ISO 8601
    PRIMARY KEY (user_id, group_id)
);
```


#### `follows` — suivis asymétriques (lecture seule)

```sql
CREATE TABLE follows (
    follower_id TEXT NOT NULL,                  -- FK → users.id
    followed_id TEXT NOT NULL,                  -- FK → users.id
    followed_at TEXT NOT NULL,                  -- ISO 8601
    PRIMARY KEY (follower_id, followed_id)
);
```


#### `friendships` — amitiés (lecture seule)

```sql
CREATE TABLE friendships (
    id            TEXT NOT NULL PRIMARY KEY,   -- UUID
    user1_id      TEXT NOT NULL,               -- FK → users.id
    user2_id      TEXT NOT NULL,               -- FK → users.id
    friended_at   TEXT NOT NULL,               -- ISO 8601
    unfriended_at TEXT,                        -- ISO 8601
    group_id      TEXT                         -- FK → chat_groups.id
);
```
 
 
#### `incidents` — gestion offline principale
 
Table de travail centrale de l'app Java. Modifiable offline.
 
```sql
CREATE TABLE incidents (
    id                TEXT NOT NULL PRIMARY KEY,  -- UUID (incidents.id PostgreSQL)
    reporter_id       TEXT NOT NULL,              -- FK → users.id
    assigned_to       TEXT,                       -- FK → users.id, nullable
    neighbourhood_id  TEXT,
    mongo_document_id TEXT,                       -- référence MongoDB incident_documents
    title             TEXT NOT NULL,
    description       TEXT,
    severity          TEXT NOT NULL DEFAULT 'medium',  -- low | medium | high | critical
    status            TEXT NOT NULL DEFAULT 'open',    -- open | in_progress | resolved
    assigned_at       TEXT,                       -- ISO 8601
    created_at        TEXT NOT NULL,              -- ISO 8601
    updated_at        TEXT,                       -- ISO 8601
    resolved_at       TEXT,                       -- ISO 8601
    synced_at         TEXT,                       -- ISO 8601, NULL si modifié offline
    is_dirty          INTEGER NOT NULL DEFAULT 0  -- 1 = modifié offline, à re-synchroniser
);
```
 
> `is_dirty = 1` signale les lignes à envoyer lors de la prochaine reconnexion.
> La sync utilise `POST /sync/updates` avec `entity_type: 'incident'` (batch idempotent, `job_id` inclus).
> **Note (v1.0.1) :** L'endpoint dédié `POST /incidents/sync` référencé précédemment a été
> consolidé dans l'endpoint générique `POST /sync/updates`. Le chemin générique fournit
> une détection de conflits unifiée et des garanties d'idempotence pour tous les types
> d'entités (users, listings, events, incidents, etc.). Un `IncidentSyncService` dédié
> encapsule la logique spécifique aux incidents (validation `entity_type`, synchronisation
> des documents MongoDB).
 
 
#### `listing_moderation_actions` — modération annonces offline
 
```sql
CREATE TABLE listing_moderation_actions (
    id           TEXT NOT NULL PRIMARY KEY,  -- UUID (listing_moderation_actions.id PostgreSQL)
    listing_id   TEXT NOT NULL,              -- FK → listings.id
    moderator_id TEXT NOT NULL,              -- FK → users.id
    action       TEXT NOT NULL,              -- cancelled | warned | restored
    reason       TEXT NOT NULL,
    created_at   TEXT NOT NULL,              -- ISO 8601
    synced_at    TEXT,                       -- ISO 8601, NULL si créé offline
    is_dirty     INTEGER NOT NULL DEFAULT 0
);
```
 
 
#### `event_moderation_actions` — modération événements offline
 
```sql
CREATE TABLE event_moderation_actions (
    id           TEXT NOT NULL PRIMARY KEY,  -- UUID (event_moderation_actions.id PostgreSQL)
    event_id     TEXT NOT NULL,              -- FK → evenements.id
    moderator_id TEXT NOT NULL,              -- FK → users.id
    action       TEXT NOT NULL,              -- cancelled | warned | restored
    reason       TEXT NOT NULL,
    created_at   TEXT NOT NULL,              -- ISO 8601
    synced_at    TEXT,                       -- ISO 8601, NULL si créé offline
    is_dirty     INTEGER NOT NULL DEFAULT 0
);
```
 
 
### Tables locales uniquement (non synchronisées)
 
Ces tables ne sont jamais envoyées vers NestJS.
 
#### `app_settings` — paramètres applicatifs
 
```sql
CREATE TABLE app_settings (
    key        TEXT NOT NULL PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at TEXT NOT NULL  -- ISO 8601
);
```
 
| Clé | Valeurs possibles | Notes |
|---|---|---|
| `active_theme` | `"default"` \| `"dark"` | Thème UI Java |
| `locale` | `"fr"` \| `"en"` | Langue de l'UI — aligné sur `users.locale` PostgreSQL |
| `last_sync_at` | ISO 8601 | Horodatage de la dernière synchronisation réussie |
| `java_jwt_token` | Token chiffré | Chiffré via AES + KeyStore OS — jamais en clair |
| `app_version` | ex : `"1.3.0"` | Version de l'application Java |
| `user_id` | UUID | Utilisateur connecté — aligné sur `users.id` PostgreSQL |
 
 
### `sync_conflicts` — journal d'audit des conflits (résolution côté client)
 
```sql
CREATE TABLE sync_conflicts (
    id           TEXT NOT NULL PRIMARY KEY,
    table_name   TEXT NOT NULL,   -- incidents | listing_moderation_actions | event_moderation_actions | user | listing | event
    record_id    TEXT NOT NULL,   -- UUID de la ligne en conflit
    field_name   TEXT,            -- champ en conflit (NULL = enregistrement entier)
    local_value  JSONB,           -- version envoyée par le client
    remote_value JSONB,           -- version actuelle en base PostgreSQL
    detected_at  TEXT NOT NULL,   -- ISO 8601, moment de la détection (horloge serveur)
    resolved_at  TEXT,            -- ISO 8601, rempli quand le client re-push une version résolue
    resolution   TEXT             -- "local" (le client a gardé sa version) | "remote" (le client a adopté la version serveur)
);
```

> ⚠️ **Cette table est un journal d'audit, pas une file de résolution.** La résolution des conflits
> se fait **côté client** (JavaFX) : l'utilisateur choisit quelle version garder, puis re-push
> la version résolue via `POST /sync/updates`. Le serveur ne fournit pas d'endpoint de résolution
> — il se contente de logger les conflits détectés pour traçabilité et debugging.
>
> `field_name` est NULL quand plusieurs champs sont en conflit simultanément sur la même ligne.
> `resolution` et `resolved_at` sont renseignés lorsque le client re-push une version résolue
> sans conflit (le `base_updated_at` correspond alors à la version serveur, donc le push est accepté).
 
Un conflit est déclaré quand une donnée a été modifiée **à la fois** en local (offline)
et sur le serveur depuis la dernière sync (`updated_at` local ET serveur > `last_sync_at`).
La résolution est manuelle et obligatoire avant toute nouvelle synchronisation de la ligne concernée.
 
 
#### `plugin_settings` — configuration des plugins
 
```sql
CREATE TABLE plugin_settings (
    plugin_id TEXT NOT NULL,
    key       TEXT NOT NULL,
    value     TEXT,
    PRIMARY KEY (plugin_id, key)
);
```
 
 
## Stratégie de synchronisation
 
### Flux de reconnexion
 
```
Java détecte reconnexion réseau
        │
        ├── 1. GET /sync/snapshot?since=<last_sync_at - 30s>&limit=500
        │       → Mise à jour users, categories, options, relationships
        │       ⚠️ Overlap 30s : rattrape les transactions PostgreSQL en cours
        │         lors du snapshot précédent. Idempotent → re-recevoir est sans risque.
        │       ⚠️ Pagination : si `has_more = true`, boucler avec `cursor` jusqu'à épuisement.
        │         Le curseur encode le timestamp max des entités retournées ; la page suivante
        │         reprend à partir de ce timestamp.
        │       ⚠️ Soft-deletes inclus : les entités avec `deleted_at > since` sont retournées
        │         pour que le client marque les lignes correspondantes comme supprimées localement.
        │
        ├── 2. Scan local : entités modifiées localement (users, listings, events, incidents,
        │       listing_moderation_actions, event_moderation_actions) WHERE is_dirty = 1
        │       → POST /sync/updates (endpoint unifié, batch idempotent, job_id, max 100 par requête)
        │       → Le body inclut `base_updated_at` : le champ `updated_at` de l'entité tel que reçu
        │         dans le dernier snapshot serveur — PAS l'horloge locale du client.
        │
        ├── 3. Le serveur traite chaque update du batch :
        │       → Si `server.updated_at > base_updated_at` : CONFLIT
        │         - La modification n'est PAS appliquée en base
        │         - Le conflit est sauvegardé dans `sync_conflicts` pour audit
        │         - Le serveur renvoie `status: "conflict"` avec les données client/serveur
        │       → Sinon : APPLIQUÉ directement
        │         - Le serveur renvoie `status: "applied"`
        │       → Réponse : `{ success, has_conflicts, applied_count, conflict_count, results[] }`
        │
        ├── 4. Le client traite la réponse :
        │       → Pour chaque `status: "applied"` : marque `is_dirty = 0`, `synced_at = now()`
        │       → Pour chaque `status: "conflict"` : garde `is_dirty = 1`, l'utilisateur résout
        │         manuellement dans l'UI JavaFX. La résolution est locale — le client re-push
        │         la version résolue au prochain cycle.
        │       ⚠️ `sync_conflicts` côté serveur est un journal d'audit, pas une file de résolution.
        │         La résolution se fait côté client uniquement.
        │
        └── 5. UPDATE app_settings SET value = <sync_at du serveur> WHERE key = 'last_sync_at'
            ⚠️ Utiliser le `sync_at` retourné par le serveur, jamais l'horloge locale.
```
 
### Détection de conflit
 
La détection de conflit repose sur le flag `is_dirty` côté client et sur la
comparaison `server.updated_at > base_updated_at` côté serveur. Le client envoie
`base_updated_at` — la valeur `updated_at` de l'entité telle que reçue dans le dernier
snapshot (un horodatage serveur PostgreSQL, pas l'horloge locale). **Aucune dépendance
à l'horloge locale du client Java** — immunisé contre le clock skew.

| Situation | `is_dirty` | `server.updated_at > base_updated_at` | Action |
|-----------|-----------|--------------------------------------|--------|
| Modifié localement, inchangé serveur | 1 | Non | Push direct |
| Modifié localement ET côté serveur | 1 | Oui | **Conflit** → `sync_conflicts` |
| Inchangé localement, modifié serveur | 0 | Oui | Pull direct |
| Inchangé des deux côtés | 0 | Non | Rien à faire |

La résolution est manuelle et obligatoire avant toute nouvelle synchronisation de la ligne concernée.
 
 
## Interface plugin Java — `NaborPlugin`
 
En Java, une `interface` est un contrat de code. Tout plugin JAR déposé dans le dossier
`plugins/` doit contenir une classe qui implémente cette interface. L'application Java la
découvre automatiquement via `URLClassLoader` au démarrage, sans modification du code principal.
 
### Définition de l'interface (version actuelle)
 
```java
package tech.nabor.api;

/** Interface implémentée par chaque plugin. Chargée via ServiceLoader (dev) ou URLClassLoader (prod). */
public interface NaborPlugin {
    String getId();                              // ex: "sync", "resolver", "viewer"
    String getDisplayName();
    void initialize(PluginContext ctx);
    Optional<javafx.scene.Node> getView();       // Optional.empty() si headless
    void shutdown();
}

/** Contexte injecté à l'initialisation du plugin. */
public interface PluginContext {
    NaborHttpClient getHttpClient();    // client HTTP avec token Bearer
    SqliteRepository getDb();           // accès complet SQLite locale
    ConnectedUser getConnectedUser();   // userId, email, role
    I18n getI18n();                     // i18n de l'application hôte
    EventBus getEventBus();             // communication inter-plugins
    NaborReporter getReporter();        // notifications UI (info, warning, erreur)
}

/** Bus de publication/souscription pour communication inter-plugins. */
public interface EventBus {
    void publish(String event, Object payload);
    void subscribe(String event, java.util.function.Consumer<Object> handler);
    void unsubscribe(String event, java.util.function.Consumer<Object> handler);
}
```
 
### Plugins implémentés
 
| Module Gradle | ID | Rôle |
|---------------|---|------|
| `plugins/sync` | `sync` | Pull (curseur composite), Push (outbox sync_changelog), warning écrasement |
| `plugins/resolver` | `resolver` | Résolution conflits — TableView JavaFX "Keep Local" / "Keep Remote" |
| `plugins/viewer` | `viewer` | Explorateur 6 onglets, édition champs whitelistés, rollback modifications |
| `plugins/test-plugin` | `test-plugin` | Validation connectivité EventBus et DB (headless) |

### Plugins planifiés (JAR externe)

| JAR | `getId()` | Fonctionnalité |
|-----|-----------|----------------|
| `plugin-export.jar` | `plugin-export` | Export CSV/PDF des statistiques avec filtres |
| `plugin-social.jar` | `plugin-social` | Analyse graphe social du quartier (données locales) |
| `plugin-calendar.jar` | `plugin-calendar` | Calendrier local des événements et incidents |

Chaque plugin possède son propre bundle i18n (`i18n/<plugin>/messages_fr.properties` + `messages_en.properties`).
 
### Chargement
 
- **Dev** : `ServiceLoader` depuis le classpath Gradle
- **Production** : `URLClassLoader` scanne `plugins/*.jar` → `ServiceLoader` depuis chaque JAR
- Activation/désactivation persistée dans `plugin_state` par utilisateur
- Navigation mise à jour dynamiquement via `plugins.changed`

---

# 4. API REST — Référence complète
 
> **Conventions :** `snake_case` URLs · UUID v7 (`uuidv7()` via `pg_uuidv7`) · Auth : `Authorization: Bearer <access_token>` (15 min)  
> Préfixe global : `/v1/` (ex: `POST /v1/auth/login`) — permet la coexistence de versions futures  
> Pagination : `?offset=0&limit=20` (max 100) sur toutes les routes GET list  
> 🔓 Public · 🔒 Auth JWT · 🛡️ Modérateur ou admin · 👑 Admin uniquement · 👑🛡️ Modérateur + admin

### Middleware d'upload de fichiers (Multer) & Pipeline de traitement média

Configuration globale NestJS pour les routes multipart :

| Route | Limite taille (images) | Limite taille (vidéo/PDF/audio) | Types MIME autorisés | Max fichiers |
|-------|----------------------|-------------------------------|---------------------|--------------|
| `POST /users/me/avatar` | 2 MB | — | `image/jpeg`, `image/png`, `image/webp`, `image/gif` | 1 |
| `POST /users/me/banner` | 4 MB | — | `image/jpeg`, `image/png`, `image/webp`, `image/gif` | 1 |
| `POST /listings/:id/media` | 5 MB | 50 MB | `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `video/mp4`, `video/webm`, `video/quicktime` | 8 |
| `POST /events/:id/media` | 5 MB | 50 MB | `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `application/pdf`, `video/mp4`, `video/webm`, `video/quicktime` | 5 |
| `POST /chat/.../attachments` | 5 MB | 50 MB | `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `application/pdf`, `audio/mpeg`, `audio/ogg`, `audio/wav`, `video/mp4`, `video/webm`, `video/quicktime` | 3 |

> **Limites de taille par type :**
> - Images : 5 MB max (avant compression WebP)
> - Vidéos, PDFs, audio : 50 MB max (limite GridFS applicative)
> - Avatars : 2 MB · Bannières : 4 MB (exceptions spécifiques)

**Stockage : MongoDB GridFS**

Les fichiers binaires sont stockés via GridFS (chunks de 255 KB) au lieu de BinData inline. Chaque fichier possède :
- Un document de métadonnées indépendant dans la collection `media_files` (ObjectId propre)
- Une référence `gridfs_file_id` vers le fichier dans `fs.files` / `fs.chunks`
- Les champs : `owner_type`, `owner_id`, `mimetype`, `size_bytes`, `original_filename`, `uploaded_at`
- Pour les images : `width_px`, `height_px`
- Pour les photos d'annonces : `order`, `caption`
- Pour les contrats : `sha256_hash`, `type` (contract/receipt)

**Pipeline de traitement :**
1. Multer intercepte le fichier (validation taille + MIME type selon le contexte)
2. Traitement selon le type :
   - **Images** (JPEG, PNG, GIF) → `sharp` compresse en WebP (qualité 80, max 1920px largeur)
   - **Images WebP** → stockées sans re-encodage
   - **Vidéos** (MP4, WebM, QuickTime) → `ffmpeg` compresse à 1080p max (pas d'upscaling)
   - **Audio** (MPEG, OGG, WAV) → `ffmpeg` transcode en Opus 128kbps
   - **PDFs** → stockés sans modification
3. Stockage dans MongoDB GridFS via `GridFSBucket`
4. Création du document de métadonnées dans `media_files`
5. Retour de l'`ObjectId` du document de métadonnées au client

**Streaming & téléchargement :**
- `GET /media/:media_id` → stream depuis GridFS avec support Range headers (206 Partial Content)
- Cache-Control : `max-age=31536000, immutable` (fichiers immuables après stockage)
- Content-Disposition : `attachment` pour les PDFs, `inline` pour les images/vidéos

**Rejet :** fichier trop gros → `413 Payload Too Large` · MIME non autorisé → `415 Unsupported Media Type` · Traitement échoué → `400 Bad Request`
 
 
## 4.0 Santé & monitoring

```
GET    /health                           🔓  Liveness (toujours 200 si NestJS répond)
GET    /health/ready                     🔓  Readiness (statut global + par service)
```

**GET /health/ready** — niveaux de statut :

| Statut | Condition | HTTP |
|--------|-----------|------|
| `ok` | Tous les services up | 200 |
| `degraded` | Seuls les soft deps down (MongoDB, Neo4j) | 200 |
| `critical` | Au moins un hard dep down (PostgreSQL, Redis) | 503 |

> PostgreSQL et Redis = `hard`. MongoDB et Neo4j = `soft`.  
> `/health` pour Docker healthcheck. `/health/ready` pour load balancers et orchestrateurs.

 
## 4.1 Authentification & SSO
 
```
POST   /auth/register                    🔓  Inscription (email, password, prénom, nom — tous obligatoires)
POST   /auth/login                       🔓  Connexion → challenge TOTP
POST   /auth/totp/confirm-setup          🔓  Initialisation du TOTP → access + refresh token (cookie HttpOnly) 
POST   /auth/totp/verify                 🔓  Vérification TOTP → access + refresh token (cookie HttpOnly)

-- Gestion TOTP --
POST   /auth/totp/setup                  🔒  Initialiser TOTP (QR seed)
POST   /auth/totp/confirm                🔒  Confirmer activation TOTP
POST   /auth/totp/disable                🔒  Désactiver son TOTP (vérification code requis)

POST   /auth/refresh                     🔓  Rotation refresh token
POST   /auth/logout                      🔒  Révoquer session courante
POST   /auth/logout/all                  🔒  Révoquer toutes les sessions
GET    /auth/sessions                    🔒  Liste des sessions actives
DELETE /auth/sessions/:session_id        🔒  Révoquer une session spécifique
POST   /auth/forgot-password             🔓  Demande de réinitialisation de mot de passe (retourne toujours 200)
POST   /auth/reset-password              🔓  Réinitialiser le mot de passe avec le jeton opaque de Redis
 
-- SSO Java Desktop (Device Authorization Flow) --
POST   /auth/sso/qr/generate             🔓  Java génère un QR (token_uuid + QR PNG)
       ⚠️  Rate limiting : 5 req/min par IP (ThrottlerGuard NestJS)
       ⚠️  Protection DoS : max 3 QR codes actifs simultanément par IP (vérification Redis SCAN `sso:qr:*` par IP)
POST   /auth/sso/qr/validate             🔒  App web scanne → session Java créée
GET    /auth/sso/qr/:token_uuid/status   🔓  Java poll le statut → JWT retourné si validé
⚡     sso:qr_validated                  -- Alternative Socket.io (évite le polling)
```
 
 
## 4.2 Utilisateurs & profils
 
```
GET    /users/me                         🔒  Profil complet
PATCH  /users/me                         🔒  Modifier profil + TOTP si sensible
DELETE /users/me                         🔒  Soft delete RGPD + TOTP obligatoire
GET    /users/me/export                  🔒  Export RGPD JSON complet
GET    /users/me/export/csv              🔒  Export RGPD CSV
 
-- Médias profil --
POST   /users/me/avatar                  🔒  Upload avatar (multipart, max 2 MB WebP)
DELETE /users/me/avatar                  🔒
POST   /users/me/banner                  🔒  Upload bannière (multipart, max 4 MB WebP)
DELETE /users/me/banner                  🔒
 
-- Sécurité --
PATCH  /users/me/password                🔒  + TOTP obligatoire
PATCH  /users/me/email                   🔒  + TOTP obligatoire
 
-- Préférences --
GET    /users/me/locale                  🔒  Lire langue active
PATCH  /users/me/locale                  🔒  Modifier langue { locale: "fr"|"en" }
GET    /users/me/notifications/preferences       🔒
PATCH  /users/me/notifications/preferences       🔒
 
-- RGPD --
PATCH  /users/me/personal-data           🔒  Rectification RGPD + TOTP
POST   /users/me/data-processing/opt-out 🔒  Opposition traitement { processing_type }
GET    /users/me/data-processing/opt-out 🔒
DELETE /users/me/data-processing/opt-out 🔒  Retirer une opposition
POST   /users/me/data-processing/restrict 🔒 Limitation du traitement
DELETE /users/me/data-processing/restrict 🔒
 
-- Découverte & réseau social --
GET    /users/:user_id                   🔒  Profil tiers (selon visibilité)
GET    /users/search?q=&neighbourhood=   🔒  Recherche fuzzy (pg_trgm)
GET    /users/discover                   🔒  Fil découverte paginé (score Neo4j)
POST   /users/:user_id/swipe             🔒  Like/dislike profil
GET    /users/me/swipes                  🔒  Historique swipes de l'utilisateur connecté
 
POST   /users/:user_id/follow            🔒
DELETE /users/:user_id/follow            🔒
GET    /users/:user_id/followers         🔒
GET    /users/:user_id/following         🔒
GET    /users/:user_id/friends           🔒  Follow mutuel uniquement
 
POST   /users/:user_id/block             🔒
DELETE /users/:user_id/block             🔒
GET    /users/me/blocks                  🔒
 
POST   /users/:user_id/report            🔒  Signaler un utilisateur (motif obligatoire)
```
 
 
## 4.3 Annonces & services
 
```
GET    /listings                         🔒  Fil paginé et filtrable
POST   /listings                         🔒  Créer une annonce
GET    /listings/:listing_id             🔒  Détail (méta PostgreSQL)
PATCH  /listings/:listing_id             🔒  Modifier (créateur, status=open)
DELETE /listings/:listing_id             🔒  Soft delete
 
-- Contenu MongoDB --
GET    /listings/:listing_id/content     🔒  Contenu MongoDB (description, médias)
PATCH  /listings/:listing_id/content     🔒
POST   /listings/:listing_id/media       🔒  Upload médias (max 8 fichiers, 5 MB chacun WebP)
DELETE /listings/:listing_id/media/:media_id 🔒
 
-- Cycle de vie --
POST   /listings/:listing_id/interest    🔒  open → pending
POST   /listings/:listing_id/accept      🔒  pending → in_progress
POST   /listings/:listing_id/confirm     🔒  Les deux parties confirment → completed
POST   /listings/:listing_id/cancel      🔒  Annuler (motif obligatoire)
⚡     listing:status_changed            { listing_id, status, updated_at }
 
-- Messagerie liée --
GET    /listings/:listing_id/chat        🔒  Groupe de messagerie lié à cette annonce
                                             (chat_groups.listing_id → group)
 
-- Contrats & documents --
GET    /listings/:listing_id/contract    🔒  PDF contrat (parties concernées)
GET    /listings/:listing_id/receipt     🔒  PDF reçu (parties concernées)
POST   /listings/:listing_id/sign        🔒  Signer (canvas + TOTP)
⚠️  Documents immuables après signature — aucun PATCH (eIDAS + SHA-256)
 
-- Modération --
POST   /listings/:listing_id/report      🔒  Signaler (motif obligatoire)
GET    /listings/reported                🛡️  Annonces signalées (triées par nb signalements)
POST   /listings/:listing_id/moderate    🛡️  Action modérateur (cancelled|warned|restored + motif)
GET    /listings/:listing_id/moderation  🛡️  Historique modération d'une annonce
GET    /listings/moderated_actions       🛡️  Toutes les actions de modération
```
 
 
## 4.4 Paiements Stripe Connect
 
```
POST   /payments/listings/:listing_id/checkout    🔒  Session Stripe Checkout annonce
POST   /payments/events/:event_id/checkout        🔒  Session Stripe Checkout événement
POST   /payments/stripe/webhook                   🔓  Webhook (Stripe-Signature vérifié)
 
GET    /payments/transactions/:transaction_id      🔒  Détail transaction
GET    /payments/me/history                        🔒  Historique paiements
 
POST   /payments/connect/onboard                  🔒  Onboarding Stripe Connect (prestataire)
GET    /payments/connect/status                   🔒  Statut compte Stripe Connect
DELETE /payments/connect                          🔒  Déconnecter compte Stripe Connect
                                                       (supprime users.stripe_account_id)
```
 
 
## 4.5 Événements
 
```
GET    /events                           🔒  Fil Neo4j paginé et filtrable
POST   /events                           🔒  Créer (status: draft)
GET    /events/:event_id                 🔒  Détail
PATCH  /events/:event_id                 🔒  Modifier (organisateur, status draft|published)
DELETE /events/:event_id                 🔒  Soft delete
 
-- Contenu MongoDB --
GET    /events/:event_id/content         🔒  Contenu MongoDB (description, cover, programme)
PATCH  /events/:event_id/content         🔒
POST   /events/:event_id/media           🔒  Upload médias
DELETE /events/:event_id/media/:media_id 🔒
 
-- Cycle de vie --
POST   /events/:event_id/publish         🔒  draft → published → crée groupe messagerie automatiquement
POST   /events/:event_id/open            🔒  published → open (inscriptions ouvertes)
POST   /events/:event_id/complete        🔒  open → completed
POST   /events/:event_id/cancel          🔒  Motif obligatoire → déclenche remboursements (refund_deadline_hours)
⚡     event:cancelled                   { event_id, reason, cancelled_at }
 
-- Messagerie liée --
GET    /events/:event_id/chat            🔒  Groupe de messagerie créé à la publication
                                             (evenements.group_id → chat_groups)
 
-- Inscriptions & billetterie --
POST   /events/:event_id/register        🔒  202 Accepted — traité via bull:event-register
⚡     event:registration_result         { event_id, status: "registered"|"waitlisted" }
DELETE /events/:event_id/participants/me  🔒  Libère une place → waitlist notifiée automatiquement
GET    /events/:event_id/participants    🔒  Organisateur uniquement
GET    /events/:event_id/waitlist        🔒  Organisateur uniquement
GET    /events/:event_id/ticket          🔒  Billet PDF + QR code (event_tickets MongoDB)
POST   /events/:event_id/scan-ticket     🛡️  Scanner un QR code à l'entrée
                                             Body : { hmac_sha256 }
                                             → met à jour event_tickets.scanned_at
 
-- Swipes & modération --
POST   /events/:event_id/swipe           🔒  Like/dislike (signal Neo4j + event_swipes PostgreSQL)
POST   /events/:event_id/report          🔒  Signaler (motif obligatoire)
GET    /events/reported                  🛡️  Événements signalés
POST   /events/:event_id/moderate        🛡️  Action modérateur (cancelled|warned|restored + motif)
GET    /events/:event_id/moderation      🛡️  Historique modération d'un événement
GET    /events/moderated_actions         🛡️  Toutes les actions de modération événements
```
 
 
## 4.6 Messagerie
 
```
GET    /chat/groups                      🔒  Groupes de l'utilisateur
POST   /chat/groups                      🔒  Créer groupe manuel
GET    /chat/groups/:group_id            🔒  Détail (membres, rôles)
PATCH  /chat/groups/:group_id            🔒  Modifier nom/description (rôle actions ou admin)
DELETE /chat/groups/:group_id            🔒  Soft delete
 
GET    /chat/groups/:group_id/members    🔒
POST   /chat/groups/:group_id/members    🔒  Inviter un membre
DELETE /chat/groups/:group_id/members/:user_id  🔒  Retirer un membre ou quitter le groupe
PATCH  /chat/groups/:group_id/members/:user_id  🔒  Modifier rôle (admin groupe uniquement)
 
POST   /chat/groups/:group_id/mute       🔒  Sourdine (durée ou permanent → mute Redis + PostgreSQL)
DELETE /chat/groups/:group_id/mute       🔒  Désactiver sourdine
 
GET    /chat/groups/:group_id/messages   🔒  Historique paginé (cursor-based, déchiffré par NestJS)
GET    /chat/messages/:message_id        🔒
DELETE /chat/messages/:message_id        🔒  Soft delete ⚡ message:deleted
 
⚡ Envoi, édition, accusés de lecture → Socket.io uniquement (voir section 5)
```
 
 
## 4.7 Appels vidéo & vocaux
 
```
POST   /calls/initiate                   🔒  { group_id, type: "video"|"audio" }
                                              → { call_id, turn_credentials }
                                              ⚡ Émet call:incoming aux membres du groupe
POST   /calls/:call_id/end               🔒  ⚡ call:ended
POST   /calls/:call_id/reject            🔒  ⚡ call:rejected
GET    /calls/:call_id                   🔒  Statut (participants, durée, type)
GET    /calls/turn-credentials           🔒  Credentials TURN/STUN temporaires
                                              { urls, username: "<ts:userId>", credential: "<hmac>", ttl: 300 }
 
⚠️  call_id est un identifiant éphémère (UUID généré par NestJS, stocké en Redis uniquement).
    Aucune persistance PostgreSQL — les appels ne sont pas archivés.
⚠️  Credentials TURN/STUN générés dynamiquement (HMAC-SHA1) — NE PAS stocker dans .env.frontend.
    TTL : 300 secondes.
```
 
 
## 4.8 Documents archivés
 
```
GET    /documents/:document_id           🔒  Contrat ou reçu archivé (signataires uniquement)
GET    /admin/documents/:document_id     👑  Accès admin à tout document
⚠️  Lecture seule — documents immuables après signature (eIDAS + SHA-256)
```
 
 
## 4.9 Votes & sondages
 
```
GET    /polls                            🔒  Sondages actifs du quartier
POST   /polls                            🔒  Créer (rôle ≥ neighbourhood_rep : rep, moderator, admin)
GET    /polls/:poll_id                   🔒  Détail + snapshot résultats ⚡ poll:updated
PATCH  /polls/:poll_id                   🔒  Modifier (créateur, avant 1er vote)
DELETE /polls/:poll_id                   🔒  Soft delete
POST   /polls/:poll_id/close             🔒  Clôturer manuellement (closed_at + closed_by)
 
POST   /polls/:poll_id/options           🔒  Ajouter option (avant 1er vote) ⚡ poll:option_added
DELETE /polls/:poll_id/options/:option_id 🔒
 
GET    /polls/:poll_id/vote              🔒  Consulter son vote courant
POST   /polls/:poll_id/vote              🔒  Voter { option_id, weight? }
PUT    /polls/:poll_id/vote              🔒  Modifier son vote
DELETE /polls/:poll_id/vote              🔒  Retirer tous les votes (ou `{ option_id }` pour un vote spécifique)
```
 
 
## 4.10 Synchronisation & Incidents

```
GET    /sync/snapshot                    👑🛡️  Obtenir un delta snapshot des données (Offline Sync)
       Query: ?since=<timestamp>&limit=<number>&cursor=<string>
       ⚠️ `since` est obligatoire. Pour un pull initial complet, utiliser une date
         arbitrairement ancienne (ex: `1970-01-01T00:00:00.000Z`).
       Response: {
         sync_at: Date,
         has_more: boolean,
         cursor: string,          // toujours pr�sent : composite base64(ISO + "|" + entityType + "|" + entityId)
         incidents: [],
         listing_moderation_actions: [],
         event_moderation_actions: [],
         listing_reports: [],
         event_reports: [],
         users_raw: [],
         listings: [],
         events: [],
         chat_groups: [],
         votes: [],
         polls: [],
         listing_transactions: [],
         listing_categories: [],
         event_categories: [],
         poll_options: [],
         event_participants: [],
         users_in_group: [],
         follows: [],
         friendships: []
       }
       ⚠️ Pour le pull initial, utiliser `since=1970-01-01T00:00:00.000Z`.
         Les pulls suivants utilisent le curseur composite (`latest_sync_cursor`
         ou `resume_cursor` en cas de reprise après crash) — le `-30s` n'est
         plus nécessaire grâce à la pagination par curseur.
       ⚠️ Limite : max 500 entités par page. Si `has_more = true`,
         boucler avec `cursor` jusqu'à `has_more = false`.
       ⚠️ Curseur composite — format : `base64(ISO + "|" + entityType + "|" + entityId)`.
         Le curseur encode la position exacte (timestamp, type d'entité, ID) de la dernière
         entité incluse. À la page suivante, le serveur utilise un WHERE composite pour le
         type d'entité du curseur :
           `(timeCol = cursorDate AND id > cursorId) OR (timeCol > cursorDate)`
         Ce mécanisme prévient la perte de données lorsque plusieurs entités partagent le même
         `updatedAt` (ex: INSERT en batch dans une transaction unique PostgreSQL).

POST   /sync/updates                     👑🛡️  Batch d'éditions génériques offline (idempotent, job_id)
       Body : { jobId, updates: [{ entity_type, entity_id, changes: { ... }, base_updated_at }] }
       Response : {
         success: boolean,           // true si aucun conflit
         has_conflicts: boolean,     // true si au moins un conflit détecté
         applied_count: number,      // nombre de modifications appliquées
         conflict_count: number,     // nombre de conflits détectés
         results: [{
           entity_type: string,
           entity_id: string,
           status: "applied" | "conflict" | "skipped",
           conflict?: {             // présent uniquement si status = "conflict"
             field_name: string | null,
             client_data: object,
             server_data: object
           }
         }]
       }
       ⚠️ Max 100 entités par requête. Endpoint unifié pour tous les types d'entités
         (users, listings, events, incidents, listing_moderation_actions, event_moderation_actions).
       ⚠️ Whitelist des champs par type d'entité — tout champ hors whitelist est ignoré :
         `user`: firstName, lastName, bio, phoneNumber
         `listing`: title, description, price, status, locationName
         `event`: title, description, date, locationName, status, maxParticipants
         `incident`: title, description, status, severity
         Les champs sensibles (passwordHash, totpSecret, stripeAccountId, role, email)
         ne sont jamais modifiables via sync.
       ⚠️ Partial success : chaque entité du batch est traitée indépendamment. Une entité
         en conflit n'empêche pas les autres d'être appliquées. `applied_count` reflète
         le nombre d'entités effectivement persistées, `conflict_count` celles loggées
         dans `sync_conflicts` pour résolution manuelle côté client.
       ⚠️ Idempotence : le `jobId` (UUID v4 généré par le client) est stocké dans Redis
         (`sync:job:<jobId>`, TTL 24h). Si le même `jobId` est rejoué (ex: réseau coupé
         avant réception de la réponse), le serveur retourne le résultat caché sans
         ré-appliquer les modifications.
       ⚠️ `base_updated_at` : le champ `updated_at` de l'entité tel que reçu dans le dernier
         snapshot serveur, PAS l'horloge locale du client. Utilisé pour la détection de conflit.
       ⚠️ Les conflits sont stockés dans `sync_conflicts` pour **audit uniquement**. La résolution
         se fait côté client (JavaFX) — l'utilisateur choisit la version à garder, le client
         re-push la version résolue au prochain cycle de synchronisation.
 
GET    /updates/latest                   🔓  { version, sha256, changelog_url }
GET    /updates/download                 🔓  JAR stream (Content-Type: application/java-archive)
```
 
 
## 4.12 DSL
 
```
POST   /dsl/query                        👑🛡️  Exécuter requête DSL
GET    /dsl/audit                        👑   Historique requêtes exécutées
```
 
 
## 4.13 Administration
 
```
-- Utilisateurs --
GET    /admin/users                      👑  Liste paginée et filtrable
GET    /admin/users/:user_id             👑  Profil complet (toutes données, même private)
PATCH  /admin/users/:user_id/role        👑  Modifier rôle
DELETE /admin/users/:user_id/totp        👑  Désactiver TOTP d'un utilisateur
POST   /admin/users/:user_id/suspend     👑  Suspendre
POST   /admin/users/:user_id/restore     👑  Restaurer
DELETE /admin/users/:user_id             👑  Soft delete définitif RGPD
 
-- Configuration --
GET    /admin/config                     👑  Configuration globale (commission, délais...)
PATCH  /admin/config                     👑
 
-- Statistiques --
GET    /admin/stats/overview             👑  Dashboard général
GET    /admin/stats/listings             👑
GET    /admin/stats/events               👑
GET    /admin/stats/payments             👑
GET    /admin/stats/users                👑
GET    /admin/stats/incidents            👑
 
-- RGPD --
GET    /admin/rgpd/requests              👑  Demandes RGPD en attente
POST   /admin/rgpd/requests/:user_id/anonymize  👑  Anonymisation manuelle → bull:rgpd-anonymise
GET    /admin/rgpd/requests/:user_id/status     👑
```
 
 
## 4.14 Quartiers & géographie
 
```
GET    /neighbourhoods                                      🔓  Liste (id, name, city, zip_code)
GET    /neighbourhoods/nearby?lat=&lng=&radius=             🔓  Quartiers proches GPS (défaut 2000m)
GET    /geo/autocomplete?q=&limit=                          🔓  Autocomplete BAN (adresses + coords)
GET    /geo/resolve-neighbourhood?q=                        🔓  Résolution quartier (polygone ou centroïde)
GET    /neighbourhoods/:neighbourhood_id                    🔒  Détail complet Neo4j
GET    /neighbourhoods/:neighbourhood_id/members            🔒  Habitants (selon visibilité)
GET    /neighbourhoods/:neighbourhood_id/adjacent           🔒  Quartiers adjacents niveau 1

GET    /admin/neighbourhoods                                👑  Liste complète admin (GeoJSON)
POST   /admin/neighbourhoods                                👑  Créer quartier
                                                                Body : { pg_id, name, city, zip_code, country, geometry: GeoJSON }
                                                                NestJS calcule : centroïde (turf.js), aire (turf.js), adjacences auto (booleanIntersects)
GET    /admin/neighbourhoods/overlap-check                  👑  { geometry } → { overlapping[], adjacent[] }
PATCH  /admin/neighbourhoods/:neighbourhood_id              👑  Recalcul centroïde + adjacences si geometry fournie
DELETE /admin/neighbourhoods/:neighbourhood_id              👑  ⚠️ Bloqué si des utilisateurs y résident (LIVES_IN Neo4j)
```
 
 
## 4.15 Catégories & i18n
 
```
GET    /categories/listings              🔓  Arbre catégories annonces (listing_category)
GET    /categories/events                🔓  Arbre catégories événements (evenements_category)
POST   /categories/listings              👑
POST   /categories/events                👑
PATCH  /categories/listings/:id          👑
DELETE /categories/listings/:id          👑  Cascade sur sous-catégories
PATCH  /categories/events/:id            👑
DELETE /categories/events/:id            👑  Cascade sur sous-catégories
 
GET    /i18n/languages                   🔓  Langues supportées [{ code, name, flag }]
GET    /users/me/locale                  🔒  (voir aussi section 4.2)
PATCH  /users/me/locale                  🔒  { locale: "fr"|"en" }
```
 
 
# 5. Socket.io — Événements temps réel
 
> Connexion : `io('ws://api', { auth: { token: accessToken } })`  
> ⚡ émis par NestJS | 📤 émis par le client | 🔒 JWT requis
 
 
## 5.1 Messagerie
 
```
📤  message:send         { group_id, content, type, attachments? }
⚡  message:received     { message_id, group_id, sender_id, content, type, attachments?, sent_at }
📤  message:read         { message_id, group_id }
⚡  message:read_ack     { message_id, user_id, read_at }
📤  message:edit         { message_id, new_content }
⚡  message:edited       { message_id, new_content, edited_at }
📤  message:delete       { message_id }
⚡  message:deleted      { message_id, deleted_at }
📤  typing:start         { group_id }
📤  typing:stop          { group_id }
⚡  typing               { group_id, user_id }   (cesse automatiquement — TTL Redis 4s)
```
 
 
## 5.2 Présence
 
```
⚡  presence:online      { user_id }              (broadcast aux contacts à la connexion)
⚡  presence:offline     { user_id }              (broadcast aux contacts à la déconnexion)
📤  presence:query       { user_ids[] }  →  { user_id, online: bool }[]
```
 
 
## 5.3 Événements & inscriptions
 
```
⚡  event:registration_result   { event_id, status: "registered"|"waitlisted" }
⚡  event:place_available        { event_id }          (notifié au 1er waitlisted lors d'une annulation)
⚡  event:waitlist_promoted      { event_id, user_id }
⚡  event:cancelled              { event_id, reason, cancelled_at }
```
 
 
## 5.4 Annonces
 
```
⚡  listing:status_changed   { listing_id, status, updated_at }
                              (émis à chaque transition : interest / accept / confirm / cancel)
```
 
 
## 5.5 Votes & sondages
 
```
⚡  poll:updated       { poll_id, results: { option_id, count, percentage }[] }
⚡  poll:closed        { poll_id, final_results }
⚡  poll:option_added  { poll_id, option: { id, label } }
```
 
 
## 5.6 Notifications système
 
```
⚡  notification:new    { id, type, payload, read: false, created_at }
    types : new_message | new_event | new_listing_interest | listing_accepted |
            contract_pending | contract_signed | payment_confirmed |
            waitlist_place | new_follower | new_poll | incident_resolved |
            event_cancelled
 
📤  notification:read   { notification_id }    (marquer une notification comme lue)
⚡  notification:read_ack { notification_id }
```
 
 
## 5.7 Appels WebRTC (signaling)
 
```
📤  call:offer           { call_id, target_user_id, sdp }
⚡  call:incoming        { call_id, caller_id, type: "video"|"audio" }
📤  call:answer          { call_id, sdp }
📤  call:ice_candidate   { call_id, candidate }
⚡  call:ice_candidate   { call_id, candidate }
📤  call:end             { call_id }
⚡  call:ended           { call_id, reason }
📤  call:reject          { call_id }
⚡  call:rejected        { call_id }
 
⚠️  Le signaling WebRTC transit entièrement via Socket.io.
    NestJS ne traite pas la media — il relaie les SDP et ICE candidates entre pairs.
    Les flux médias (audio/vidéo) passent directement en peer-to-peer via TURN/STUN.
```
 
 
## 5.8 SSO Java Desktop
 
```
⚡  sso:qr_validated     { access_token, refresh_token }   (Java Desktop uniquement)
```
 
---

# 6. Modules fonctionnels

## 6.1 Authentification & MFA TOTP

**Flux de connexion :**
1. `POST /auth/login` → `{ challenge: "totp_required", challenge_token: "<opaque_uuid>" }`
   ⚠️ `challenge_token` est un UUID opaque stocké dans Redis (`totp:pending:<challenge_token>` → `{ user_id, context: "login", attempts: 0 }`, TTL 5 min). Le `user_id` n'est jamais exposé au client avant authentification complète.
2. `POST /auth/totp/verify { challenge_token, code }` → NestJS résout le `user_id` depuis Redis → retourne `access_token` (15 min) + `refresh_token` cookie HttpOnly (30 j)
3. Après 3 échecs → `totp:blocked:<user_id>` (15 min), accès bloqué

**Reset de mot de passe par email :**
1. `POST /auth/forgot-password { email }` → Génère un jeton opaque (`reset_token`, UUID v4), le stocke dans Redis (`auth:reset:<token>` → `{ email }`, TTL 15 min). Retourne toujours un message de succès générique pour éviter la divulgation d'emails. En développement, le lien est loggé dans la console ; en production, le job est envoyé via la file `bull:email` de BullMQ pour envoi de l'email avec le lien.
2. `POST /auth/reset-password { token, password }` → Résout l'email associé au token dans Redis, met à jour le mot de passe de l'utilisateur avec le même algorithme Argon2id (64 MiB, 3 itérations, sel 16 octets), met à jour `password_changed_at` avec l'horodatage actuel (ce qui invalide tous les JWT émis précédemment), supprime le jeton de Redis, et révoque toutes les sessions actives (dans Redis et PostgreSQL `user_sessions`) pour forcer la reconnexion.

**TOTP obligatoire pour :** connexion · signature de contrat · modification email/mot de passe · suppression de compte

**Rate limiting :** 10 tentatives login / 15 min par IP ET par compte · 10 refreshs / min par utilisateur · 5 requêtes forgot-password / 15 min par IP

## 6.2 Profils & réseau social

- **Suivi asymétrique** : A suit B sans que B suive A. Double follow = amitié (détecté applicativement, `FRIENDS_WITH` créé dans Neo4j, DM automatiquement créé)
- **Visibilité** : `public` / `friends` / `private` — contrôle l'accès au profil complet ET la présence dans le fil de découverte
- **Découverte** : score Neo4j combinant proximité géographique (×3), affinités catégories (×2), réseau social commun (×1)
- **Blocage** : masque le contenu dans tous les fils — non réciproque, non supprimant

## 6.3 Annonces & services

**Cycle de vie :** `open → pending → in_progress → closed | cancelled`  

Le passage `in_progress → closed` déclenche la génération du contrat PDF (via queue `bull:pdf-generation` BullMQ) puis la session Stripe Checkout si le service est payant. La clôture définitive (`closed`) requiert la signature du reçu de bonne exécution par les deux parties.

## 6.4 Paiements Stripe Connect

- **Principe** : aucun fond stocké sur la plateforme (pas d'agrément établissement de paiement)
- **Flux** : création session Checkout → redirection Stripe → webhook `payment_intent.succeeded` → NestJS enregistre et génère le contrat
- **Commission** : configurable via `/admin/config` (`commission_percent`, défaut 5%) — appliquée via `application_fee_amount` Stripe Connect
- **Prix** : toujours en centimes en base (pas d'arrondi flottant)
- **Idempotence** : `stripe_payment_intent` stocké — les webhooks sont rejoués sans doublon

## 6.5 Documents & signatures eIDAS niveau simple

**Deux documents générés par transaction de service :**

| Document | Déclencheur | Contenu clé |
|----------|-------------|-------------|
| **Contrat de promesse** | Acceptation `in_progress` | Identité des parties, description, montant, date, signatures |
| **Reçu de bonne exécution** | Confirmation post-service | Référence contrat, montant réglé, date effective, signatures |

**Flux de signature :**
1. NestJS génère le PDF (template NestJS + données PostgreSQL)
2. Hash SHA-256 calculé et stocké avec le document dans MongoDB
3. Chaque signataire dessine sa signature (canvas HTML5) et confirme avec TOTP
4. `signature: { canvas_b64, totp_verified_at, signed_ip, user_agent }` archivé
5. Non-répudiation : l'ensemble est immuable après validation

⚠️ Les documents contractuels ne sont **jamais supprimés** — seules les données personnelles sont anonymisées (RGPD) en cas de suppression de compte.

## 6.6 Événements communautaires

- **Groupe de messagerie** : créé automatiquement à la transition `draft → published`
- **Liste d'attente** : FIFO stricte — place libérée → notification → délai 24h pour accepter → passage au suivant via `bull:waitlist-promote` (delayed job)
- **Anti-race condition** : inscriptions via `bull:event-register` (concurrency:1) + `SELECT FOR UPDATE` PostgreSQL (BullMQ)
- **QR codes** : payload JSON signé HMAC-SHA256 côté serveur, envoyé par email en PNG, vérifiable par l'organisateur en temps réel


### FIFO liste d'attente événements — BullMQ delayed job

**Objectif :** Garantir qu'une place libérée est proposée au 1er inscrit en attente (ordre d'inscription strict), sans course condition, même si NestJS tourne en plusieurs instances.

**Algorithme détaillé :**

    1. DELETE /events/:id/participants/me (participant inscrit se désinscrit)
    ↓

    2 Transaction PostgreSQL :
    UPDATE event_participants SET status='cancelled' WHERE user_id=X AND event_id=Y
    ↓

    3. BullMQ crée job dans bull:waitlist-promote :
    { eventId, maxAttempts: 3, attempts: 0 }
    ↓

    4. Worker (concurrency=1 par eventId) :
    a. SELECT user_id FROM event_participants
    WHERE event_id=Y AND status='waitlisted'
    ORDER BY registered_at ASC LIMIT 1
    FOR UPDATE SKIP LOCKED
    b. Si aucun → fin
    c. Sinon → UPDATE event_participants SET status='registered', promoted_at=NOW()
    d. Socket.io émet event:waitlist_promoted { event_id, user_id }
    e. Bull crée un delayed job (TTL 24h) : bull:waitlist-confirm { eventId, userId }
    ↓

    5. Delayed job bull:waitlist-confirm après 24h :
    a. SELECT status FROM event_participants WHERE user_id=Z AND event_id=Y
    b. Si status ≠ 'confirmed' → UPDATE status='waitlisted' (réintégré en fin de file)
    c. Retour à l'étape 3 pour le prochain waitlisted

**Garanties :**
- `SELECT FOR UPDATE SKIP LOCKED` : 0 doublons même en multi-instances NestJS
- `concurrency=1 par eventId` (via Bull) : sérialisation des inscriptions
- `job_id = eventId:userId` : idempotent, double-clic ignoré


## 6.7 Messagerie unifiée

**Modèle `chat_group` unifié (3 types) :**

| Type | Créé par | Exemples |
|------|----------|---------|
| `direct_message` | Automatiquement (match mutuel) | DM entre deux utilisateurs |
| `group_chat` | Habitant | Groupe de voisins |
| `neighbourhood` | Automatiquement (publication événement) | Groupe de l'événement |

**Cycle d'un message :**
1. Client émet `message:send` → Socket.io
2. NestJS vérifie permissions (rôle dans `users_in_group`)
3. Contenu chiffré AES-256-GCM → MongoDB
4. Métadonnées → `message_metadata` PostgreSQL
5. Broadcast Socket.io aux membres connectés
6. Si destinataire hors ligne (Redis `presence`) → `bull:email`

**Pièces jointes** : stockées dans MongoDB · Fichiers stockés en BinData
**Types supportés** : JPEG, PNG, GIF, MP3, OGG, MP4, PDF (Validation du mimetype côté NestJS à l'upload — le schéma MongoDB stocke le binaire sans contrainte de type)

## 6.8 Appels vidéo & vocaux (WebRTC)

### Architecture générale

Les appels audio/vidéo sont des communications **peer-to-peer** entre deux clients.
NestJS joue uniquement le rôle de **serveur de signaling** — il relaie les SDP et
ICE candidates entre les pairs mais ne traite jamais les flux médias eux-mêmes.
Les flux audio/vidéo transitent directement entre clients via TURN/STUN (coturn).
```
Appelant ──── SDP offer ────► NestJS ──── SDP offer ─────► Destinataire
        ◄─── SDP answer ────         ◄─── SDP answer ─────
        ─── ICE candidate ─►         ──── ICE candidate ─►
        ◄───── flux audio/vidéo P2P (coturn si NAT) ─────►
```

### États d'un appel

| État | Description |
|---|---|
| `pending` | Offer émis, destinataire pas encore répondu |
| `active` | Connexion P2P établie, flux en cours |
| `ended` | Appel terminé normalement (`call:end`) |
| `rejected` | Destinataire a refusé (`call:reject`) |
| `missed` | Destinataire hors ligne ou sans réponse (timeout) |

### Flux nominal

1. L'appelant émet `POST /calls/initiate { group_id, type }` → NestJS génère un `call_id`
   UUID éphémère (Redis, TTL 5 min), récupère les credentials TURN et retourne
   `{ call_id, turn_credentials }`
2. NestJS émet `call:incoming { call_id, caller_id, type }` aux membres du groupe
3. Le destinataire répond `call:answer { call_id, sdp }` → NestJS relaie à l'appelant
4. Échange des ICE candidates via Socket.io → WebRTC P2P s'établit
5. En fin d'appel : l'un des deux émet `call:end` → NestJS émet `call:ended` à l'autre
   et supprime le `call_id` de Redis

### Cas particuliers

**Destinataire hors ligne :**
`call:incoming` est émis via Socket.io. Si le destinataire n'est pas connecté
(`EXISTS presence:<user_id>` → 0), NestJS répond immédiatement `404` à l'appelant
avec `{ reason: "user_offline" }` — aucun appel n'est initié.

**Pas de réponse (timeout) :**
Si le destinataire est en ligne mais ne répond pas dans **30 secondes**, NestJS émet
`call:ended { call_id, reason: "timeout" }` à l'appelant et supprime le `call_id` Redis.
Le TTL Redis de 5 min sert de filet de sécurité si NestJS crashe avant d'émettre le timeout.

**coturn indisponible :**
Si coturn est inaccessible, les credentials TURN retournés sont invalides et la négociation
ICE échoue côté client. WebRTC tente alors uniquement STUN (IP publique directe) — fonctionne
si les deux pairs sont derrière des NAT simples (cas résidentiel fréquent), échoue sur les
réseaux d'entreprise avec firewall strict. En v1 il n'y a pas de fallback applicatif —
l'erreur est silencieuse côté WebRTC (connexion qui n'aboutit pas). À surveiller en monitoring.

**Appel dans un DM vs groupe :**
`POST /calls/initiate` prend un `group_id` — fonctionne pour les DM (`direct_message`)
comme pour les groupes (`group_chat`). En groupe, `call:incoming` est émis à **tous** les
membres — chacun peut rejoindre ou refuser indépendamment. NestJS ne gère pas la conférence
multi-flux (SFU) — les flux restent P2P pair-à-pair, ce qui limite les appels de groupe à
2-3 participants en pratique (surcharge CPU/réseau client au-delà).

### Stockage

`call_id` est un UUID éphémère stocké **uniquement dans Redis** (pas de table PostgreSQL).
Les appels ne sont pas archivés — pas d'historique, pas de durée enregistrée.
Cette décision est cohérente avec le chiffrement E2E prévu en v2 (les métadonnées
d'appel seraient elles aussi sensibles).
## 6.9 Votes & sondages

| Type | Comportement |
|------|-------------|
| `single` | Un seul choix par utilisateur |
| `multiple` | Plusieurs choix, `weight = 1` chacun |
| `weighted` | Un seul choix, `weight` défini par l'utilisateur |

Les résultats sont mis à jour en temps réel via `⚡ poll:updated` (Socket.io) après chaque vote. Le cache Redis (`counter:poll_votes`) évite les `COUNT(*)` PostgreSQL répétés.

## 6.10 Incidents

Les incidents sont saisis depuis l'app Java Desktop (offline possible) ou depuis l'API REST. Le champ `is_dirty = 1` signale les lignes modifiées hors ligne, synchronisées en batch à la reconnexion via `POST /sync/updates` (endpoint unifié, idempotent, `job_id`, accès réservé aux modérateurs et admins).

## 6.11 DSL (Data Query Language custom)

Le DSL permet aux admins/modérateurs d'interroger MongoDB via un langage de requête dédié, sans exposer la syntaxe d'aggregation MongoDB ni risquer d'injection.

**Pipeline complet :** `DSL string → Lexer (PLY lex) → Tokens → Parser (PLY yacc) → AST → QueryBuilder → MongoDB filter`


### Collections autorisées (whitelist stricte)

| Collection | Accès |
|------------|-------|
| `messages` | admin, moderator |
| `contracts` | admin, moderator |
| `listing_documents` | admin, moderator |
| `event_documents` | admin, moderator |
| `event_tickets` | admin, moderator |
| `incident_documents` | admin, moderator |

Toute collection absente de cette whitelist retourne `403 Forbidden` avant tout parsing.

### Étape 1 — Analyse lexicale (`lexer.py`)

**Table des tokens :**

| Token | Regex PLY | Exemple |
|-------|-----------|---------|
| `FIND` | `FIND` | `FIND` |
| `IN` | `IN` | `IN` |
| `WHERE` | `WHERE` | `WHERE` |
| `AND` | `AND` | `AND` |
| `OR` | `OR` | `OR` |
| `NOT` | `NOT` | `NOT` |
| `ORDER` | `ORDER` | `ORDER` |
| `BY` | `BY` | `BY` |
| `ASC` | `ASC` | `ASC` |
| `DESC` | `DESC` | `DESC` |
| `LIMIT` | `LIMIT` | `LIMIT` |
| `CONTAINS` | `CONTAINS` | `CONTAINS` |
| `IS` | `IS` | `IS` |
| `NULL` | `NULL` | `NULL` |
| `EQ` | `=` | `=` |
| `NEQ` | `!=` | `!=` |
| `LTE` | `<=` | `<=` ⚠️ déclaré avant `<` |
| `GTE` | `>=` | `>=` ⚠️ déclaré avant `>` |
| `LT` | `<` | `<` |
| `GT` | `>` | `>` |
| `LPAREN` | `\(` | `(` |
| `RPAREN` | `\)` | `)` |
| `STRING` | `"[^"]*"` | `"pending"` (guillemets retirés) |
| `NUMBER` | `\d+(\.\d+)?` | `42`, `3.14` |
| `IDENTIFIER` | `[a-zA-Z_][a-zA-Z0-9_.]*` | `sender_id`, `meta.type` |

⚠️ `<=` et `>=` **doivent être déclarés avant** `<` et `>` dans `lexer.py` — PLY applique la règle du plus long match en priorité déclarative.

**Caractères ignorés :** espaces, tabulations, sauts de ligne.

**Thread-safety :** `lexer.clone()` utilisé par chaque requête — le lexer global n'est jamais muté.

---

### Étape 2 — Analyse syntaxique (`parser.py`)

#### Grammaire formelle BNF

```bnf
query      ::= FIND IN IDENTIFIER
             | FIND IN IDENTIFIER WHERE condition
             | FIND IN IDENTIFIER WHERE condition ORDER BY IDENTIFIER direction
             | FIND IN IDENTIFIER WHERE condition ORDER BY IDENTIFIER direction LIMIT NUMBER
             | FIND IN IDENTIFIER ORDER BY IDENTIFIER direction LIMIT NUMBER
             | FIND IN IDENTIFIER LIMIT NUMBER

condition  ::= condition AND condition
             | condition OR condition
             | NOT condition
             | LPAREN condition RPAREN
             | compare
             | contains
             | isnull
             | isnotnull

compare    ::= IDENTIFIER EQ value
             | IDENTIFIER NEQ value
             | IDENTIFIER LT value
             | IDENTIFIER GT value
             | IDENTIFIER LTE value
             | IDENTIFIER GTE value

contains   ::= IDENTIFIER CONTAINS value
isnull     ::= IDENTIFIER IS NULL
isnotnull  ::= IDENTIFIER IS NOT NULL

value      ::= STRING | NUMBER
direction  ::= ASC | DESC
```

#### Précédence des opérateurs booléens

Définie explicitement dans PLY pour résoudre les ambiguïtés shift/reduce :

```python
precedence = (
    ('left',  'OR'),   # priorité la plus basse
    ('left',  'AND'),
    ('right', 'NOT'),  # priorité la plus haute
)
```

**Conséquence :** `A AND B OR C` est parsé comme `(A AND B) OR C`.

#### AST produit (exemple)

```python
# FIND IN messages WHERE sender_id = "uuid-123" AND type = "text" ORDER BY sent_at DESC LIMIT 50
{
  "type": "query",
  "collection": "messages",
  "condition": {
    "type": "and",
    "left":  { "type": "compare", "field": "sender_id", "op": "=",  "value": "uuid-123" },
    "right": { "type": "compare", "field": "type",      "op": "=",  "value": "text" }
  },
  "order": { "type": "order", "field": "sent_at", "direction": "DESC" },
  "limit": 50
}
```

#### Types de nœuds AST

| Type | Champs | Description |
|------|--------|-------------|
| `query` | `collection`, `condition?`, `order?`, `limit?` | Racine |
| `and` | `left`, `right` | Conjonction |
| `or` | `left`, `right` | Disjonction |
| `not` | `expr` | Négation |
| `compare` | `field`, `op`, `value` | Comparaison simple |
| `contains` | `field`, `value` | Appartenance à un tableau |
| `isnull` | `field` | Champ null |
| `isnotnull` | `field` | Champ non null |

---

### Étape 3 — Construction MongoDB (`querybuilder.py`)

#### Mapping opérateurs DSL → MongoDB

| Op DSL | Op MongoDB | Exemple DSL | Filtre MongoDB |
|--------|-----------|-------------|----------------|
| `=` | égalité directe | `status = "open"` | `{ "status": "open" }` |
| `!=` | `$ne` | `type != "system"` | `{ "type": { "$ne": "system" } }` |
| `<` | `$lt` | `price < 100` | `{ "price": { "$lt": 100 } }` |
| `>` | `$gt` | `price > 0` | `{ "price": { "$gt": 0 } }` |
| `<=` | `$lte` | `created_at <= "2025-01-01"` | `{ "created_at": { "$lte": "2025-01-01" } }` |
| `>=` | `$gte` | `weight >= 3` | `{ "weight": { "$gte": 3 } }` |
| `CONTAINS` | `$elemMatch: { $eq }` | `tags CONTAINS "urgent"` | `{ "tags": { "$elemMatch": { "$eq": "urgent" } } }` |
| `IS NULL` | `{ field: null }` | `location_hint IS NULL` | `{ "location_hint": null }` |
| `IS NOT NULL` | `{ $ne: null }` | `signed_at IS NOT NULL` | `{ "signed_at": { "$ne": null } }` |

#### Plafond LIMIT

Le `LIMIT` est plafonné à **500 résultats maximum**, appliqué en double défense :
1. Dans `querybuilder.py` : `min(ast.limit, MAX_LIMIT)` où `MAX_LIMIT = 500`
2. Dans `main.py` : validation avant transmission à NestJS

#### Projection de sécurité systématique

Ces champs sont **toujours exclus** de tous les résultats, quelle que soit la requête :

| Champ exclu | Raison |
|-------------|--------|
| `content_encrypted` | Contenu AES-256-GCM |
| `iv` | Vecteur d'initialisation AES |
| `auth_tag` | Tag d'authentification GCM |
| `data` | BinData (médias, avatars, photos) |
| `pdf.data` | PDFs contractuels bruts |
| `qr_png` | QR codes PNG binaires |
| `signature.canvas_b64` | Signature manuscrite |
| `signature.signed_ip` | IP du signataire |

---

### Étape 4 — API FastAPI (`main.py`)

```python
POST /parse
Body  : { "query": "FIND IN contracts WHERE ...", "user_role": "admin" }
Retour: { "collection": "contracts", "filter": {...}, "order": {...}, "limit": 20 }
```

| Code | Cas |
|------|-----|
| `200` | Parsing réussi, retourne le filtre MongoDB |
| `400` | Erreur de syntaxe, requête vide, ou dépassement 1000 chars |
| `403` | Collection non autorisée |

---

### Exemples de requêtes DSL complets

```sql
-- 1. Messages récents d'un groupe
FIND IN messages
WHERE group_id = "uuid-groupe-456"
ORDER BY sent_at DESC LIMIT 50

-- MongoDB généré :
-- { "filter": { "group_id": "uuid-groupe-456" }, "order": { "sent_at": -1 }, "limit": 50 }

-- 2. Contrats en attente de signature d'un prestataire (signed_at IS NULL = pending_signature)
FIND IN contracts
WHERE "parties.provider.pg_user_id" = "uuid-user-123" AND signed_at IS NULL
LIMIT 20

-- 3. Billets émis mais non scannés
FIND IN event_tickets
WHERE scanned_at IS NULL
ORDER BY issued_at ASC LIMIT 100

-- 4. Incidents avec localisation renseignée
FIND IN incident_documents
WHERE location_hint IS NOT NULL
ORDER BY created_at DESC LIMIT 50

-- 5. Messages hors système avec NOT et parenthèses
FIND IN messages
WHERE NOT (type = "system" OR type = "deleted") AND group_id = "uuid-xyz"
LIMIT 30

-- 6. Scan complet plafonné (sans WHERE)
FIND IN event_tickets LIMIT 200
```

---

### Gestion des erreurs DSL

| Erreur | Message retourné |
|--------|-----------------|
| Caractère non reconnu | `Caractère illégal position 12` |
| Token inattendu | `Erreur de syntaxe near LIMIT` |
| Requête tronquée | `Fin de requête inattendue — requête incomplète` |
| Collection non autorisée | `Collection 'users' non autorisée` |
| Requête vide | `La requête ne peut pas être vide` |
| Requête > 1000 chars | `Requête trop longue, max 1000 caractères` |

## 6.12 Quartiers & géographie

Les polygones de quartiers sont dessinés via l'outil admin Leaflet.draw. À chaque enregistrement, NestJS calcule automatiquement :
- **Centroïde** (`turf.centroid`) → stocké dans Neo4j
- **Aire** (`turf.area`) → affiché dans le back-office
- **Adjacences** (`turf.intersect` avec tolérance 0.001°) → relations `ADJACENT_TO` Neo4j

La géolocalisation des quartiers sert exclusivement à :
1. Filtrer les annonces/événements visibles (quartier + adjacents niveau 1)
2. Scorer la pertinence dans le fil de découverte Neo4j
3. Outil admin `GET /admin/neighbourhoods/overlap-check` pour détecter les chevauchements

---

# 7. Application Java Desktop

## 7.1 Architecture générale

```
src/
├── main/java/com/naborservices/desktop/
│   ├── NaborApp.java             // Entrypoint JavaFX (launch)
│   ├── ui/                       // Contrôleurs JavaFX + FXML
│   │   ├── MainController.java
│   │   ├── LoginController.java
│   │   ├── IncidentController.java
│   │   ├── ModerationController.java
│   │   └── PluginHostController.java
│   ├── service/
│   │   ├── AuthService.java      // SSO QR, refresh JWT
│   │   ├── SyncService.java      // Sync offline → NestJS
│   │   ├── IncidentService.java  // CRUD incidents SQLite
│   │   ├── ModerationService.java
│   │   └── UpdateService.java    // Auto-update JAR
│   ├── db/
│   │   ├── SQLiteManager.java    // Connexion SQLite, migrations
│   │   └── dao/                  // DAO par entité
│   ├── plugin/
│   │   ├── NaborPlugin.java      // Interface contrat plugin
│   │   ├── PluginContext.java
│   │   └── PluginLoader.java     // URLClassLoader dynamique
│   └── util/
│       ├── CryptoUtil.java       // AES KeyStore OS
│       └── QRCodeUtil.java       // Affichage QR SSO
└── resources/
    ├── fxml/                     // Vues JavaFX
    ├── i18n/                     // messages_fr.properties, messages_en.properties
    └── plugins/                  // JARs plugins au runtime
```

## 7.2 SSO via QR Code (Device Authorization Flow)

```
1. Java génère UUID → POST /auth/sso/qr/generate → QR PNG
2. Java affiche le QR (JavaFX ImageView) + démarre polling GET /auth/sso/qr/:token_uuid/status
3. Utilisateur scanne avec l'app web React (via webcam ou mobile)
4. React POST /auth/sso/qr/validate → session PostgreSQL créée, Redis sso:qr:<uuid> → "validated"
5. Java reçoit { access_token, refresh_token } → chiffré AES KeyStore OS dans app_settings
6. Java est connecté (JWT 90 jours pour le client lourd)
⚠️  QR expire en 2 min → rotation automatique si non scanné (UX : bouton "Rafraîchir")
```

## 7.3 Offline-first & synchronisation

### Architecture : Pull / Push séparés

La synchronisation est divisée en deux opérations distinctes, déclenchées manuellement :

| Opération | Événement | Direction | Description |
|-----------|-----------|-----------|-------------|
| **Pull** | `sync.start` / `sync.full` | Serveur → Client | Récupère le snapshot delta depuis le serveur |
| **Push** | `sync.push` | Client → Serveur | Envoie les modifications locales (outbox) au serveur |

### Modèle Outbox — `sync_changelog`

Le pattern Outbox centralise toutes les modifications locales dans une table unique. Les tables métier (incidents, users, listings…) restent pures, sans colonnes sync (`is_dirty`, `synced_at`, `base_updated_at`).

```sql
CREATE TABLE sync_changelog (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name      TEXT    NOT NULL,          -- 'incidents', 'users', 'listings', etc.
    row_id          TEXT    NOT NULL,          -- UUID de l'entité
    operation       TEXT    NOT NULL CHECK (operation IN ('INSERT','UPDATE','DELETE')),
    changed_fields  TEXT,                      -- JSON: ["title", "severity"]
    previous_values TEXT,                      -- JSON: {"title": "Ancien", ...}
    new_values      TEXT,                      -- JSON: {"title": "Nouveau", ...}
    base_updated_at TEXT,                      -- updatedAt serveur AVANT l'édition locale
    changed_at      INTEGER NOT NULL           -- epoch millis
);
```

**Flux d'édition :**
1. L'utilisateur modifie un champ whitelisté dans le Viewer
2. Le plugin appelle `sync_changelog.track(event)` avec `previous_values`, `new_values`, et copie `entity.updatedAt` → `base_updated_at`
3. L'entité est sauvegardée avec les nouvelles valeurs

### Pull (lecture) — curseur composite

```
GET /v1/sync/snapshot?since=1970-01-01T00:00:00.000Z&limit=500
GET /v1/sync/snapshot?cursor=<base64>              ← pages suivantes
```

**Mécanisme client :**
1. Première page : `since=<ISO>` (obligatoire). Pour un pull complet : `1970-01-01T00:00:00.000Z`.
2. Pages suivantes : `cursor=<base64>` fourni par le serveur dans la page précédente.
3. Après chaque page réussie : `sync_state.resume_cursor` mis à jour (reprise sur crash).
4. Dernière page (`has_more: false`) : `sync_state.latest_sync_cursor` = dernier curseur, `resume_cursor` vidé.
5. `sync.completed` publié sur l'EventBus.

**Safe upsert :** avant d'écraser une ligne locale, le pull vérifie `sync_changelog` : si l'entité a des modifications locales en attente (`hasPendingChanges`), elle est **sautée** (protège les éditions offline).

**Entités synchronisées en pull :** incidents, users_raw, listings, events, chat_groups, polls, poll_options, votes, event_participants, users_in_group, follows, friendships, listing_transactions, listing_categories, event_categories, listing_reports, event_reports, listing_moderation_actions, event_moderation_actions, neighbourhoods (mapping_id → nom).

### Push (écriture) — partial success

```
POST /v1/sync/updates  { jobId, updates: [{ entity_type, entity_id, changes, base_updated_at }] }
```

**Mécanisme client :**
1. Lecture de toutes les entrées de `sync_changelog` (l'outbox)
2. Mapping `table_name` → `entity_type` API (ex: `incidents` → `incident`)
3. Envoi batch au serveur avec `jobId` UUID v4 (idempotence)
4. Traitement par entité dans la réponse :
   - **`applied`** : suppression de la ligne dans `sync_changelog` (l'entité est propre)
   - **`conflict`** : conservation dans `sync_changelog` + insertion dans `pending_conflicts` pour résolution UI
   - **`skipped`** : aucune action
5. Si `has_conflicts: false` → pull automatique pour récupérer les données fraîches du serveur

### Conflits

- **Détection serveur** : `server.updatedAt > client.base_updated_at` → CONFLIT
- **Stockage client** : table `pending_conflicts` (champ nullable `field_name` pour conflit mono-champ ou enregistrement complet)
- **Résolution** : plugin Resolver (`plugins/resolver`) — TableView JavaFX avec boutons "Keep Local" / "Keep Remote"
- **Nettoyage** : les conflits sont effacés au début d'un pull réussi (le serveur est source de vérité)

### État de synchronisation

```sql
CREATE TABLE sync_state (
    id                 INTEGER PRIMARY KEY CHECK (id = 1),
    latest_sync_cursor TEXT,    -- curseur du dernier pull complété
    resume_cursor      TEXT,    -- curseur de reprise (non-null = pull interrompu)
    is_rolling_back    INTEGER NOT NULL DEFAULT 0
);
```

Une seule ligne (id=1). `resume_cursor` permet la reprise après crash en milieu de pagination.

## 7.4 Système de plugins

### Interface `NaborPlugin`

```java
package tech.nabor.api;

public interface NaborPlugin {
    String getId();                              // ex: "sync", "resolver", "viewer"
    String getDisplayName();                     // nom affiché dans la navigation
    void initialize(PluginContext ctx);          // appelé au chargement — reçoit le contexte
    Optional<javafx.scene.Node> getView();       // Optional.empty() si headless
    void shutdown();                             // appelé au déchargement
}
```

### `PluginContext` — contexte injecté

```java
public interface PluginContext {
    NaborHttpClient getHttpClient();    // client HTTP configuré avec le token
    SqliteRepository getDb();           // accès complet à la DB SQLite locale
    ConnectedUser getConnectedUser();   // utilisateur connecté (userId, email, role)
    I18n getI18n();                     // internationalisation de l'app hôte
    EventBus getEventBus();             // communication inter-plugins
    NaborReporter getReporter();        // notifications UI (info, warning, erreur)
}
```

### Chargement

- **Dev** : `ServiceLoader` (depuis le classpath Gradle)
- **Production** : `URLClassLoader` scanne `plugins/*.jar` → `ServiceLoader` depuis le JAR
- Activation/désactivation persistée dans `plugin_state` (par utilisateur)
- Navigation mise à jour dynamiquement via l'événement `plugins.changed`

### EventBus — communication inter-plugins

| Événement | Émetteur | Consommateurs | Payload |
|-----------|----------|---------------|---------|
| `sync.start` | SyncPlugin UI / externe | SyncPlugin | `null` → pull incrémental |
| `sync.full` | SyncPlugin UI | SyncPlugin | `null` → pull depuis epoch |
| `sync.push` | SyncPlugin UI / ViewerPlugin | SyncPlugin | `null` → push outbox |
| `sync.completed` | SyncPlugin | ViewerPlugin, ResolverPlugin, SyncPlugin UI | `null` |
| `sync.push.failed` | SyncPlugin | ResolverPlugin | message d'erreur |
| `network.error` | AppNaborHttpClient | MainController | message HTTP |
| `plugins.changed` | SettingsController | MainController | `null` |

### Plugins fournis

| Module | ID | Description |
|--------|----|-------------|
| `plugins/sync` | `sync` | Pull (curseur), Push (outbox), état de sync, warning écrasement |
| `plugins/resolver` | `resolver` | Résolution manuelle des conflits : TableView "Keep Local" / "Keep Remote" |
| `plugins/viewer` | `viewer` | Explorateur de données : 6 onglets (Incidents, Users, Listings, Events, Neighbourhoods, History), édition inline des champs whitelistés, rollback des modifications |
| `plugins/test-plugin` | `test-plugin` | Plugin de test — ping/pong EventBus, vérification connectivité DB |

**Plugins internes** (compilés avec l'application) :
- Chaque plugin a son propre bundle i18n (`i18n/<plugin>/messages_fr.properties`)
- Les vues sont construites paresseusement (`getView()` peut être appelé en mode headless/test)
- La configuration utilisateur est stockée dans `plugin_config` par `(user_id, plugin_id, key)`

## 7.5 Auto-update

1. `GET /updates/latest` → `{ version, sha256, changelog_url }`
2. Comparaison `app_version` vs `latest.version` (semver)
3. Si supérieure → prompt utilisateur avec changelog
4. `GET /updates/download` → stream JAR
5. Vérification intégrité SHA-256 (rejet si hash ne correspond pas)
6. Remplacement JAR + redémarrage (`ProcessBuilder`)

## 7.6 Thèmes & i18n

- **Thèmes** : `default` (clair) et `dark` — appliqués via CSS JavaFX
  (`scene.getStylesheets()`) — persisté dans `app_settings` (clé `active_theme`)
- **Langues** : `fr` et `en` — `ResourceBundle.getBundle("i18n/messages_" + locale)`
  — persisté dans `app_settings` (clé `locale`)
- **Couleurs** : `#0F2A5E` (navy primary) · `#F7931E` (orange accent)
  — cohérentes avec l'identité visuelle de l'app web (section 12)

---

# 8. Sécurité & RGPD

## 8.1 Authentification & tokens

| Mécanisme | Détail                                                                                                                                                  |
|-----------|---------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Mots de passe** | Argon2id (mémoire 64 MB, itérations 3)                                                                                                                  |
| **JWT access** | HS256, 15 min, `{ sub, role, locale }`                                                                                                                  |
| **JWT refresh** | Hash SHA-256 stocké Redis (fast-path lookup à chaque requête, TTL 30j) ET PostgreSQL `user_sessions.refresh_token_hash` (source de vérité pour révocation et audit). Si Redis est indisponible, fallback sur PostgreSQL. |
| **JWT desktop** | Même algorithme, 90 j, révocable                                                                                                                        |
| **TOTP secrets** | Chiffrés AES-256-GCM en PostgreSQL avant stockage (IV unique par utilisateur, auth_tag vérifié au déchiffrement) |
| **Clés AES groupes** | Chiffrées via `AES_MASTER_KEY` (env var), jamais exposées au client                                                                                     |

## 8.2 TOTP (MFA)

TOTP obligatoire pour toutes les actions sensibles. Fenêtre de vérification : 5 min (Redis). Max 3 tentatives → blocage 15 min. Blocage stocké dans Redis pour une réponse instantanée sans requête PostgreSQL.

## 8.3 Rate limiting

| Endpoint | Limite | Fenêtre |
|----------|--------|---------|
| `POST /auth/login` | 10 req | 15 min / IP + user |
| `POST /auth/totp/verify` | 3 tentatives | 5 min / user |
| `POST /auth/refresh` | 10 req | 1 min / user |
| `POST /auth/sso/qr/generate` | 5 req | 1 min / IP |
| `POST /dsl/query` | 20 req | 1 min / user |
| Tous autres endpoints | 100 req | 1 min / IP (ThrottlerGuard NestJS) |

## 8.4 RGPD — Droits des utilisateurs

| Droit | Implémentation |
|-------|---------------|
| **Accès** | `GET /users/me/export` → JSON complet (profil, annonces, messages envoyés, participations) |
| **Portabilité** | `GET /users/me/export/csv` → CSV machine-readable |
| **Rectification** | `PATCH /users/me/personal-data` + TOTP |
| **Suppression** | `DELETE /users/me` → soft delete + anonymisation différée via `bull:rgpd-anonymise` |
| **Opposition** | `POST /users/me/data-processing/opt-out` |
| **Limitation** | `POST /users/me/data-processing/restrict` |

**Anonymisation :** prénom/nom → SHA-256 hash, email → SHA-256, photo supprimée de MongoDB, signature canvas supprimée. Les documents contractuels et leurs hash SHA-256 sont **conservés** (obligation légale eIDAS).

## 8.5 Chiffrement au repos

| Données | Algorithme | Où |
|---------|-----------|-----|
| Messages MongoDB | AES-256-GCM (IV unique par message) | MongoDB |
| Contrats PDF | AES-256-GCM | MongoDB |
| Secrets TOTP | AES-256-GCM (IV unique par utilisateur, master key env var) | PostgreSQL |
| Clés AES groupes | AES-256 (master key env var) | Redis |
| JWT Java Desktop | AES via KeyStore OS | SQLite |

## 8.6 Sécurité applicative

- **Injection SQL** : requêtes paramétrées TypeORM / `$1` placeholders
- **Validation des entrées** : `ValidationPipe` global NestJS (`class-validator` + `class-transformer`) — whitelist activée, propriétés inconnues rejetées automatiquement (`whitelist: true, forbidNonWhitelisted: true`)
- **Injection NoSQL** : DSL interdit les opérateurs MongoDB directs (`$where`, `$expr`, sous-requêtes)
- **XSS** : sanitisation HTML serveur (DOMPurify côté client, `class-validator` NestJS côté serveur)
- **CORS** : whitelist `FRONTEND_URL` uniquement. Configuration NestJS :
  - `origin`: `[process.env.FRONTEND_URL]` (ex: `http://localhost:5173` en dev, `https://nabor.tech` en prod)
  - `methods`: `GET, POST, PATCH, PUT, DELETE, OPTIONS`
  - `allowedHeaders`: `Content-Type, Authorization, Accept-Language`
  - `credentials`: `true` (nécessaire pour les cookies HttpOnly refresh token)
  - `maxAge`: `86400` (preflight cache 24h)
- **CSRF** : cookies `HttpOnly + SameSite=Strict` pour les refresh tokens
- **Stripe PCI-DSS** : aucune donnée bancaire ne transite par les serveurs Nabor
- **WebRTC credentials TURN** : HMAC-SHA1 dynamique, TTL 300s — jamais dans `.env.frontend`

## 8.7 Politique de mots de passe & Argon2id

**Argon2id** est l'algorithme de hachage recommandé par OWASP (OWASP Password Storage Cheat Sheet)
pour les mots de passe. Il est intentionnellement lent et résistant aux attaques GPU et aux
attaques par canal latéral.

**Paramètres configurés :**

| Paramètre | Valeur | Justification |
|-----------|--------|---------------|
| Mémoire | 64 MiB | OWASP recommandation minimum pour Argon2id |
| Itérations (`t`) | 3 | Équilibre sécurité/latence (<100 ms sur serveur moyen) |
| Parallélisme (`p`) | 1 | Serveur single-thread, pas de gain à paralléliser |
| Longueur hash | 32 bytes (256 bits) | Résistance collision suffisante |
| Salt | 16 bytes random | Auto-généré par la librairie, unique par hachage |

**Politique mot de passe (NIST SP 800-63B) :**
- Longueur minimum : **8 caractères**
- Pas de contrainte de complexité forcée (majuscule/chiffre/symbole) — contre-productif selon NIST
- Vérification contre [Have I Been Pwned](https://haveibeenpwned.com/API/v3) lors de l'inscription (API k-anonymity)
- **Invalidation JWT** : si `users.password_changed_at > JWT.iat` → `401 UNAUTHORIZED` (tous les tokens émis avant le changement sont révoqués)

⚠️ Le secret Argon2id (pepper optionnel) n'est pas utilisé en v1 — identifié comme amélioration v2.

## 8.8 Flux JWT — Renouvellement Web et Desktop

### Flux Web (access token 15 min)

1. Access token expiré (HTTP 401) → React détecte l'erreur

2. React → POST /auth/refresh (cookie HttpOnly refresh_token envoyé automatiquement)

3. NestJS :
    a. Hash SHA-256 du refresh_token reçu
    b. Lookup Redis : refresh:<hash> → { user_id, session_id, expires_at }
    c. Si absent ou expiré → 401 → redirection /login
    d. Si valide → nouveau access_token (15 min) + rotation refresh_token (nouveau hash, 30 j)
    e. Ancien hash supprimé de Redis, nouveau inséré

4. React stocke le nouvel access_token (mémoire uniquement, jamais localStorage)


**Invalidation automatique :**

| Condition | Action |
|-----------|--------|
| `users.password_changed_at > JWT.iat` | `401 UNAUTHORIZED` |
| `users.deleted_at IS NOT NULL` | `401 UNAUTHORIZED` |
| Session révoquée (`/auth/logout`) | Hash supprimé de Redis → `401` |

### Flux Desktop Java (JWT 90 jours)

1. JWT chiffré AES KeyStore OS, stocké dans SQLite (app_settings.java_jwt_token)

2. Au démarrage de l'app :
    a. Déchiffrement JWT depuis SQLite
    b. Vérification locale : exp - now()

        - Si > 7 jours restants → utilisation normale

        - Si ≤ 7 jours restants → bandeau "Renouvellement recommandé dans X jours"

        - Si expiré → écran SSO QR obligatoire

3. Sur requête NestJS avec JWT expiré → 401 → redirection écran SSO QR

4. Après renouvellement QR → nouveau JWT 90 j → re-chiffrement AES + update SQLite

⚠️ Le JWT Desktop n'utilise **pas** de refresh token — la longue durée (90 j) compense l'absence de rotation. La révocation se fait via `DELETE /auth/sessions/:session_id` depuis l'app web.

---

# 9. Infrastructure & déploiement

## 9.1 Services Docker

| Service | Image | Port dev            | Rôle |
|---------|-------|---------------------|------|
| `postgres` | `postgres:17-alpine` | 5432                | Base principale |
| `mongodb` | `mongo:7` | 27017               | Documents, messages |
| `neo4j` | `neo4j:5` | 7474, 7687          | Graphe social |
| `redis` | `redis:7-alpine` | 6379                | Sessions, cache, queues |
| `nestjs` | build local | 3000                | API REST + WebSocket (ffmpeg installé dans l'image pour traitement vidéo/audio) |
| `react` | build local | 5173                | Frontend (Vite dev) |
| `dsl-service` | build local | 8000                | Micro-service DSL |
| `coturn` | `coturn/coturn` | 3478, 5349, 49152, 65535 | TURN/STUN WebRTC |
| `mailpit` | `axllent/mailpit` | 8025, 1025          | SMTP dev uniquement |
| `caddy` | `caddy:2-alpine` | 80, 443             | Reverse proxy TLS (prod) |

## 9.2 Démarrage rapide (dev)

Docker-compose.yaml
```yaml
# ============================================================
# Nabor Services — docker-compose.yml
# Environnement : développement
# Usage : docker compose up -d
# ============================================================

services:

  # ──────────────────────────────────────────────────────────
  # PostgreSQL 17
  # ──────────────────────────────────────────────────────────
  postgres:
    image: postgres:17-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER:     ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB:       ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s

  # ──────────────────────────────────────────────────────────
  # MongoDB 7
  # L'init script crée l'utilisateur applicatif "nabor"
  # ──────────────────────────────────────────────────────────
  mongodb:
    image: mongo:7
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
      MONGO_INITDB_DATABASE:      nabor
    volumes:
      - mongo_data:/data/db
      - ./docker/mongo-init.js:/docker-entrypoint-initdb.d/init.js:ro
    ports:
      - "27017:27017"
    healthcheck:
      test: ["CMD", "mongosh", "--quiet", "--eval", "db.adminCommand('ping').ok"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 15s

  # ──────────────────────────────────────────────────────────
  # Neo4j 5 + APOC
  # Browser : http://localhost:7474
  # Bolt    : bolt://localhost:7687
  # ──────────────────────────────────────────────────────────
  neo4j:
    image: neo4j:5
    restart: unless-stopped
    environment:
      NEO4J_AUTH:                                        neo4j/${NEO4J_PASSWORD}
      NEO4J_PLUGINS:                                     '["apoc"]'
      NEO4J_dbms_security_procedures_unrestricted:       apoc.*
      NEO4J_dbms_security_procedures_allowlist:          apoc.*
      NEO4J_server_memory_heap_initial__size:            512m
      NEO4J_server_memory_heap_max__size:                1g
      NEO4J_server_memory_pagecache_size:                512m
    volumes:
      - neo4j_data:/data
      - neo4j_logs:/logs
    ports:
      - "7474:7474"   # Browser HTTP
      - "7687:7687"   # Bolt
    healthcheck:
      test: ["CMD-SHELL", "wget -q --spider http://localhost:7474 || exit 1"]
      interval: 15s
      timeout: 10s
      retries: 10
      start_period: 30s

  # ──────────────────────────────────────────────────────────
  # Redis 7
  # AOF activé pour persister group_key et jobs Bull
  # ──────────────────────────────────────────────────────────
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: >
      redis-server
      --appendonly yes
      --appendfsync everysec
      --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ──────────────────────────────────────────────────────────
  # coturn — TURN/STUN relay WebRTC
  # network_mode: host obligatoire — le bridge Docker casse
  # la négociation ICE (coturn doit exposer les vrais ports UDP)
  # Ports utilisés :
  #   3478     TCP/UDP — STUN + TURN signaling
  #   5349     TCP/UDP — TURN over TLS
  #   49152-65535 UDP  — relay media (WebRTC)
  # ──────────────────────────────────────────────────────────
  coturn:
    image: coturn/coturn:4.6
    restart: unless-stopped
    network_mode: host
    volumes:
      - ./docker/turnserver.conf:/etc/coturn/turnserver.conf:ro

  # ──────────────────────────────────────────────────────────
  # NestJS API
  # ──────────────────────────────────────────────────────────
  nestjs:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: unless-stopped
    depends_on:
      postgres:  { condition: service_healthy }
      mongodb:   { condition: service_healthy }
      neo4j:     { condition: service_healthy }
      redis:     { condition: service_healthy }
    env_file: .env
    environment:
      NODE_ENV:          development
      PORT:              3000
      REDIS_URL:         redis://:${REDIS_PASSWORD}@redis:6379
    ports:
      - "3000:3000"
    volumes:
      - ./backend:/app
      - /app/node_modules
    command: npm run start:dev

  # ──────────────────────────────────────────────────────────
  # React frontend (Vite dev server)
  # ──────────────────────────────────────────────────────────
  react:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    restart: unless-stopped
    depends_on:
      - nestjs
    env_file: .env.frontend
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm run dev -- --host 0.0.0.0

  # ──────────────────────────────────────────────────────────
  # DSL micro-service (FastAPI + PLY)
  # ──────────────────────────────────────────────────────────
  dsl-service:
    build:
      context: ./dsl-service
      dockerfile: Dockerfile
    restart: unless-stopped
    environment:
      PYTHONUNBUFFERED: "1"
    ports:
      - "8000:8000"
    volumes:
      - ./dsl-service:/app
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --reload

  # ──────────────────────────────────────────────────────────
  # Mailpit — SMTP intercepteur dev uniquement
  # UI : http://localhost:8025
  # ──────────────────────────────────────────────────────────
  mailpit:
    image: axllent/mailpit:latest
    restart: unless-stopped
    profiles:
      - dev-only
    ports:
      - "8025:8025"   # UI web
      - "1025:1025"   # SMTP

volumes:
  postgres_data:
  mongo_data:
  neo4j_data:
  neo4j_logs:
  redis_data:
```

turnserver.conf
```conf
# ============================================================
# coturn — turnserver.conf (développement)
# Monté dans le conteneur : /etc/coturn/turnserver.conf
# ============================================================

# ── Identité du serveur ─────────────────────────────────────
realm=nabor.local
server-name=nabor.local

# ── Réseau ──────────────────────────────────────────────────
# En dev avec network_mode: host, coturn écoute directement
# sur l'interface de la machine hôte.
listening-port=3478
tls-listening-port=5349

# Plage de ports UDP pour le relay media WebRTC
# À ouvrir dans le firewall si nécessaire
min-port=49152
max-port=65535

# external-ip : adresse IP que coturn annonce aux clients WebRTC
# En dev local : 127.0.0.1 suffit (appelant et destinataire sur la même machine)
# Sur un serveur distant : remplacer par l'IP publique du serveur
external-ip=127.0.0.1

# ── Authentification ────────────────────────────────────────
# lt-cred-mech : Long-Term Credential Mechanism
# NestJS génère des credentials éphémères via HMAC-SHA1 (TTL 300s)
# en utilisant COTURN_SECRET comme clé de signature
lt-cred-mech

# Shared secret pour la génération HMAC côté NestJS
# Doit correspondre à COTURN_SECRET dans .env
use-auth-secret
static-auth-secret=nabor-dev-turn-secret-change-in-prod

# ── Sécurité ────────────────────────────────────────────────
# Interdit l'utilisation du relay pour atteindre des IPs privées
# (évite que coturn serve de proxy vers le réseau interne)
no-multicast-peers
denied-peer-ip=0.0.0.0-0.255.255.255
denied-peer-ip=10.0.0.0-10.255.255.255
denied-peer-ip=100.64.0.0-100.127.255.255
denied-peer-ip=127.0.0.0-127.255.255.255
denied-peer-ip=169.254.0.0-169.254.255.255
denied-peer-ip=172.16.0.0-172.31.255.255
denied-peer-ip=192.0.0.0-192.0.0.255
denied-peer-ip=192.168.0.0-192.168.255.255
denied-peer-ip=198.18.0.0-198.19.255.255
denied-peer-ip=198.51.100.0-198.51.100.255
denied-peer-ip=203.0.113.0-203.0.113.255
denied-peer-ip=240.0.0.0-255.255.255.255

# ── TLS (dev) ───────────────────────────────────────────────
# En dev, TLS est désactivé — les navigateurs acceptent TURN non-TLS
# sur localhost. En prod, décommenter et fournir les certificats.
# cert=/etc/coturn/certs/fullchain.pem
# pkey=/etc/coturn/certs/privkey.pem

# ── Logs ────────────────────────────────────────────────────
log-file=stdout
verbose
# Décommenter pour des logs très détaillés (debug ICE)
# Verbose
```

```bash
cp .env.example .env && cp .env.frontend.example .env.frontend
# → Remplir les valeurs dans .env

docker compose up -d
docker compose exec nestjs npm run migration:run   # Migrations PostgreSQL (inclut CREATE EXTENSION pg_uuidv7)
docker compose exec nestjs npm run neo4j:init      # Schéma + contraintes Neo4j
docker compose logs -f nestjs

# Accès :
# API NestJS    → http://localhost:3000/v1
# Swagger       → http://localhost:3000/api
# React         → http://localhost:5173
# Mailpit UI    → http://localhost:8025
# Neo4j Browser → http://localhost:7474
```

## 9.3 Production

Docker-compose.prod.yaml
```yaml
# ============================================================
# Nabor Services — docker-compose.prod.yml
# Override de production — utilisé conjointement avec
# docker-compose.yml :
#   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
# ============================================================

services:

  nestjs:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod    # multi-stage, sans devDependencies
    restart: always
    environment:
      NODE_ENV: production
    volumes: []                      # pas de volume de code en prod
    command: node dist/main.js
    deploy:
      replicas: 1                    # une seule instance — pas de Redis adapter Socket.io en v1
      update_config:
        order: start-first
        failure_action: rollback
        delay: 10s

  react:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod    # build statique servi par Caddy
    volumes: []
    ports: []                        # Caddy prend le relais, plus d'exposition directe

  dsl-service:
    volumes: []
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2

  # ──────────────────────────────────────────────────────────
  # Caddy — reverse proxy TLS auto (Let's Encrypt)
  # ──────────────────────────────────────────────────────────
  caddy:
    image: caddy:2-alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
      - "443:443/udp"    # HTTP/3 QUIC
    volumes:
      - ./docker/Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
      - ./frontend/dist:/srv/frontend:ro   # build statique React

  # Mailpit supprimé en prod (profiles: dev-only)
  # Brevo SMTP via variables SMTP_HOST / SMTP_PORT dans .env.prod

  coturn:
    volumes:
      - ./docker/turnserver.prod.conf:/etc/coturn/turnserver.conf:ro

volumes:
  caddy_data:
  caddy_config:
```

```conf
# ============================================================
# coturn — turnserver.prod.conf (production)
# Monté dans le conteneur : /etc/coturn/turnserver.conf
# via docker-compose.prod.yml
# ============================================================

# ── Identité du serveur ─────────────────────────────────────
realm=nabor.fr
server-name=turn.nabor.fr

# ── Réseau ──────────────────────────────────────────────────
listening-port=3478
tls-listening-port=5349

min-port=49152
max-port=65535

# ⚠️  OBLIGATOIRE en prod — remplacer par l'IP publique du serveur
# Sans ça, coturn annonce une IP incorrecte et les appels échouent
external-ip=<IP_PUBLIQUE_DU_SERVEUR>

# ── Authentification ────────────────────────────────────────
lt-cred-mech
use-auth-secret

# ⚠️  Doit correspondre exactement à COTURN_SECRET dans .env.prod
# Générer avec : openssl rand -hex 32
static-auth-secret=<COTURN_SECRET_FROM_ENV>

# ── TLS ─────────────────────────────────────────────────────
# Certificats générés par Caddy (Let's Encrypt) ou certbot
# Caddy stocke les certs dans /data/caddy/certificates/
# Adapter le chemin selon votre setup
cert=/etc/coturn/certs/fullchain.pem
pkey=/etc/coturn/certs/privkey.pem

# ── Sécurité ────────────────────────────────────────────────
no-multicast-peers
denied-peer-ip=0.0.0.0-0.255.255.255
denied-peer-ip=10.0.0.0-10.255.255.255
denied-peer-ip=100.64.0.0-100.127.255.255
denied-peer-ip=127.0.0.0-127.255.255.255
denied-peer-ip=169.254.0.0-169.254.255.255
denied-peer-ip=172.16.0.0-172.31.255.255
denied-peer-ip=192.0.0.0-192.0.0.255
denied-peer-ip=192.168.0.0-192.168.255.255
denied-peer-ip=198.18.0.0-198.19.255.255
denied-peer-ip=198.51.100.0-198.51.100.255
denied-peer-ip=203.0.113.0-203.0.113.255
denied-peer-ip=240.0.0.0-255.255.255.255

# Forcer TLS pour le signaling (rejette les connexions TURN non-TLS)
# Le relay UDP media reste actif — nécessaire pour WebRTC
no-tlsv1
no-tlsv1_1

# ── Logs ────────────────────────────────────────────────────
log-file=stdout
# Pas de verbose en prod — trop de logs pour les relay media
```

```
# ============================================================
# docker/Caddyfile (production)
# TLS automatique via Let's Encrypt
# ============================================================

# ── Frontend React (build statique) ─────────────────────────
nabor.tech {
    root * /srv/frontend
    file_server

    # SPA fallback — toutes les routes inconnues → index.html
    try_files {path} /index.html

    # Cache agressif pour les assets Vite (hash dans le nom de fichier)
    @assets path /assets/*
    header @assets Cache-Control "public, max-age=31536000, immutable"

    # Pas de cache pour index.html (toujours la dernière version)
    header /index.html Cache-Control "no-cache, no-store, must-revalidate"

    encode gzip
}

# ── API NestJS ───────────────────────────────────────────────
api.nabor.tech {
    # WebSocket Socket.io
    @websocket {
        header Connection *Upgrade*
        header Upgrade    websocket
    }
    reverse_proxy @websocket nestjs:3000

    # REST
    reverse_proxy nestjs:3000 {
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
    }

    encode gzip
}
```

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

**Différences prod :**
- NestJS : `Dockerfile.prod` multi-stage (builder → runner, pas de devDependencies)
- React : build statique servi par Caddy
- Caddy : TLS auto (Let's Encrypt), reverse proxy vers NestJS et React
- Mailpit : supprimé (`profiles: ["dev-only"]`) → Brevo SMTP
- NestJS : 1 instance (deploy.replicas: 1) — Socket.io Redis adapter non activé en v1. Rolling update configuré (start-first, rollback on failure, délai 10s)
- `.env.prod` séparé (secrets Docker)

## 9.4 Variables d'environnement clés (`.env`)

```dotenv
# Bases de données
# ============================================================
# Nabor Services — .env.example
# Copier en .env et remplir les valeurs avant docker compose up
# NE PAS committer .env — uniquement .env.example
# ============================================================

# ── PostgreSQL ───────────────────────────────────────────────
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=nabor
POSTGRES_PASSWORD=change_me_postgres
POSTGRES_DB=nabor
DATABASE_URL=postgres://nabor:change_me_postgres@postgres:5432/nabor

# ── MongoDB ──────────────────────────────────────────────────
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=change_me_mongo_root
MONGO_APP_PASSWORD=change_me_mongo_app
MONGO_URI=mongodb://nabor:change_me_mongo_app@mongodb:27017/nabor?authSource=nabor

# ── Neo4j ────────────────────────────────────────────────────
NEO4J_URI=bolt://neo4j:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=change_me_neo4j

# ── Redis ────────────────────────────────────────────────────
REDIS_PASSWORD=change_me_redis
REDIS_URL=redis://:change_me_redis@redis:6379

# ── JWT ──────────────────────────────────────────────────────
# Générer avec : openssl rand -base64 64
JWT_SECRET=change_me_jwt_secret_minimum_64_chars_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d
JWT_DESKTOP_EXPIRY=90d

# ── Chiffrement AES ──────────────────────────────────────────
# Générer avec : openssl rand -hex 32
AES_MASTER_KEY=0000000000000000000000000000000000000000000000000000000000000000

# ── Stripe ───────────────────────────────────────────────────
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxx
STRIPE_PLATFORM_COMMISSION_PERCENT=5

# ── SMTP (dev = Mailpit) ─────────────────────────────────────
SMTP_HOST=mailpit
SMTP_PORT=1025
SMTP_FROM=noreply@nabor.fr
# Pour la prod, remplacer par :
# SMTP_HOST=smtp-relay.brevo.com
# SMTP_PORT=587
# SMTP_USER=your_brevo_login
# SMTP_PASSWORD=your_brevo_password

# ── WebRTC / coturn ──────────────────────────────────────────
# En dev : 127.0.0.1 (coturn tourne sur l'hôte via network_mode: host)
COTURN_URL=turn:127.0.0.1:3478
COTURN_REALM=nabor.local
# Doit correspondre à static-auth-secret dans turnserver.conf
# Générer avec : openssl rand -hex 32
COTURN_SECRET=nabor-dev-turn-secret-change-in-prod

# ── Application ──────────────────────────────────────────────
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
DSL_SERVICE_URL=http://dsl-service:8000
```

---


# 10. Internationalisation (i18n)

## 10.1 Langues supportées

| Code | Langue | Flag | Statut |
|------|--------|------|--------|
| `fr` | Français | 🇫🇷 | Langue principale (textes sources) |
| `en` | Anglais | 🇬🇧 | Traduction complète |

Extension possible sans modification du code (ajout de fichier de traduction uniquement).

## 10.2 Frontend React — `react-i18next`

```bash
npm install i18next react-i18next i18next-http-backend
```

**Structure des fichiers :**
```
public/locales/
├── fr/
│   ├── common.json     // Navigation, boutons, erreurs génériques
│   ├── auth.json       // Connexion, inscription, TOTP
│   ├── listings.json   // Annonces et services
│   ├── events.json     // Événements
│   ├── messages.json   // Messagerie
│   ├── profile.json    // Profils
│   ├── admin.json      // Back-office admin
│   └── errors.json     // Codes d'erreur API
└── en/
    └── [mêmes fichiers]
```

**Initialisation :**
```js
i18n.use(Backend).use(LanguageDetector).use(initReactI18next).init({
  ns: ['common','auth','listings','events','messages','profile','admin','errors'],
  defaultNS: 'common',
  fallbackLng: 'fr',
  backend: { loadPath: '/locales/{{lng}}/{{ns}}.json' },
  detection: { order: ['localStorage', 'navigator'] }
})
```

**Usage :**
```jsx
const { t, i18n } = useTranslation('listings')
<h1>{t('create.title')}</h1>
// Changement : i18n.changeLanguage('en') → PATCH /users/me/locale
```

## 10.3 Backend NestJS — `nestjs-i18n`

```bash
npm install nestjs-i18n
```

**Localisation des réponses d'erreur :** NestJS lit le header `Accept-Language` (ou le `locale` du JWT) et retourne les messages traduits :

```json
// fr : { "message": "Annonce introuvable" }
// en : { "message": "Listing not found" }
```

**Emails :** templates Handlebars traduits dans `src/mail/templates/{fr,en}/` — langue de l'utilisateur depuis PostgreSQL `users.locale`.

## 10.4 Application Java — `ResourceBundle`

```java
// Chargement
Locale locale = Locale.forLanguageTag(appSettings.get("active")); // "fr" ou "en"
ResourceBundle bundle = ResourceBundle.getBundle("i18n/messages", locale);

// Usage
label.setText(bundle.getString("incidents.title"));
```

**Fichiers :**
```
src/main/resources/i18n/
├── messages_fr.properties
└── messages_en.properties
```

**Changement à chaud :** `LocaleChangeListener` recharge le bundle et met à jour tous les textes de l'UI sans redémarrage.

## 10.5 Conventions de traduction

- **Clés** : `module.entité.action` (ex: `listings.create.title`, `errors.not_found`)
- **Variables** : `{{count}} annonces` (react-i18next) / `{0} annonces` (Java MessageFormat)
- **Pluriel** : géré via i18next `_one` / `_other` (React) et `ChoiceFormat` (Java)
- **Format dates** : ISO 8601 en base → formaté selon locale via `Intl.DateTimeFormat` (React) et `DateTimeFormatter` (Java)

---

# 11. Tests & qualité

## 11.1 Stratégie globale

| Couche | Framework | Objectif couverture | Types |
|--------|-----------|--------------------|----|
| NestJS | Jest | ≥ 70% | Unitaires + e2e |
| React | Vitest + RTL | ≥ 60% | Composants + hooks |
| Java | JUnit 5 | ≥ 60% | Unitaires + intégration |

## 11.2 Tests NestJS (Jest)

**Tests unitaires — services métier :**
```
src/
├── auth/__tests__/auth.service.spec.ts
├── listings/__tests__/listings.service.spec.ts
├── events/__tests__/events.service.spec.ts
├── payments/__tests__/payments.service.spec.ts
└── dsl/__tests__/dsl.service.spec.ts
```

**Tests e2e — flux critiques :**
```
test/
├── auth.e2e-spec.ts             // Inscription → TOTP → login → logout
├── listing-lifecycle.e2e-spec.ts // open → pending → in_progress → closed
├── event-registration.e2e-spec.ts // Inscription avec liste d'attente
├── payment-flow.e2e-spec.ts      // Checkout Stripe (mock webhook)
└── dsl-query.e2e-spec.ts        // Pipeline DSL complet
```

**Configuration :**
```json
// jest.config.json
{
  "moduleNameMapper": { "@/(.*)": "<rootDir>/src/$1" },
  "collectCoverageFrom": ["src/**/*.ts", "!src/**/*.dto.ts", "!src/main.ts"],
  "coverageThreshold": { "global": { "lines": 70 } }
}
```

## 11.3 Tests React (Vitest + RTL)

**Focus sur :** composants interactifs (formulaires, chat, votes) · hooks custom (`useAuth`, `useSocket`, `useI18n`) · flux de paiement (mock Stripe)

```bash
vitest run --coverage   # Coverage HTML dans coverage/
```

## 11.4 Tests Java (JUnit 5)

**Focus sur :** services métier offline (`SyncService`, `IncidentService`) · algorithme détection conflits · chargement plugins (`PluginLoader`) · vérification SHA-256 auto-update

```java
@Test void testConflictDetection() {
    // given : incident modifié localement ET sur le serveur depuis last_sync_at
    // when  : SyncService.detectConflicts(dirty, serverSnapshot)
    // then  : conflit inséré dans sync_conflicts
}
```

## 11.5 Tests DSL — Python (pytest)

Le pipeline DSL (lexer → parser → querybuilder) est testé indépendamment de NestJS,
directement dans le micro-service FastAPI.
```
dsl-service/
└── tests/
    ├── test_lexer.py        // Tokenisation correcte, caractères illégaux, opérateurs
    ├── test_parser.py       // Grammaire BNF, précédence booléenne, cas limites
    ├── test_querybuilder.py // Mapping DSL → filtre MongoDB, projection sécurité, LIMIT
    └── test_integration.py  // Pipeline complet POST /parse — requêtes valides + erreurs
```

**Cas couverts obligatoirement :**

| Fichier | Cas de test |
|---|---|
| `test_lexer.py` | Token `<=` avant `<` (ordre déclaratif PLY), string avec guillemets, identifier avec `.` (champ imbriqué), caractère illégal → `LexError` |
| `test_parser.py` | `A AND B OR C` → `(A AND B) OR C` (précédence), `NOT (A OR B)`, `IS NULL`, `IS NOT NULL`, requête sans `WHERE`, requête vide → `SyntaxError` |
| `test_querybuilder.py` | `CONTAINS` → `$elemMatch`, `=` → égalité directe vs `$ne`, LIMIT plafonné à 500, projection systématique des champs sensibles (`content_encrypted`, `iv`, `auth_tag`, `data`, `pdf.data`, `qr_png`, `signature.canvas_b64`, `signature.signed_ip`) |
| `test_integration.py` | Collection non whitelistée → `403`, requête > 1000 chars → `400`, pipeline complet sur chaque collection autorisée, re-exécution idempotente du même filtre |

**Lancement :**
```bash
cd dsl-service && pytest --cov=. --cov-report=html
# Seuil minimum : 80% (DSL est critique sécurité)
```

**Seuil de couverture DSL (80%)** plus élevé que NestJS (70%) et React (60%) —
justifié par le risque d'injection et la complexité de la grammaire.

## 11.6 CI/CD (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  test-nestjs:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./backend   # à adapter selon ta structure
    services:
      postgres:
        image: postgres:17-alpine
        env:
          POSTGRES_USER: nabor
          POSTGRES_PASSWORD: test
          POSTGRES_DB: nabor_test
        ports: ['5432:5432']
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        ports: ['6379:6379']
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-retries 5
    env:
      NODE_ENV: test
      DATABASE_URL: postgres://nabor:test@localhost:5432/nabor_test
      REDIS_URL: redis://localhost:6379
      JWT_SECRET: ci-test-secret-64-chars-minimum-padding-here-xxxxxxxx
      AES_MASTER_KEY: 0000000000000000000000000000000000000000000000000000000000000000
      STRIPE_SECRET_KEY: sk_test_dummy
      STRIPE_WEBHOOK_SECRET: whsec_dummy
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      - run: npm ci
      - run: npm run migration:run   # migrations avant les tests e2e
      - run: npm run test:cov
      - run: npm run lint

  test-react:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./frontend   # à adapter
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci
      - run: vitest run --coverage

  test-java:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./java-desktop   # à adapter
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: 'maven'
      - run: mvn test --no-transfer-progress

  test-dsl:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./dsl-service   # à adapter
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
          cache: 'pip'
      - run: pip install -r requirements.txt
      - run: pytest --cov=. --cov-report=xml --cov-fail-under=80

  docker-build:
    needs: [test-nestjs, test-react, test-java, test-dsl]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: |
          cp .env.example .env
          cp .env.frontend.example .env.frontend
          docker compose build --no-cache
```

## 11.7 Convention de branches & commits

**Branches :**
- `main` — code de production (branche protégée, merge via PR uniquement)
- `develop` — intégration continue
- `feat/<module>-<description>` — nouvelles fonctionnalités
- `fix/<description>` — correctifs
- `chore/<description>` — configuration, dépendances, docs

**Commits conventionnels** (`conventional commits`) :
```
feat(listings): add moderation action endpoint
fix(auth): correct TOTP blocking TTL calculation
chore(docker): upgrade postgres to 16-alpine
docs(api): update Swagger annotations for /events
test(java): add conflict detection unit tests
```

**Workflow :** branch `feat/*` → PR vers `develop` → review équipe → merge → intégration CI → PR vers `main` pour livraison

---

# 12. Identité visuelle

## 12.1 Palette de couleurs

| Nom | Hex | Usage |
|-----|-----|-------|
| **Navy** | `#0F2A5E` | Couleur primaire — backgrounds, headers, boutons principaux |
| **Orange** | `#F7931E` | Couleur accent — CTAs, highlights, badges |
| **Blanc** | `#FFFFFF` | Backgrounds, textes sur fonds sombres |
| **Vert succès** | `#3DBD77` | Confirmations, statuts validés |
| **Rouge erreur** | `#E8534A` | Erreurs, alertes critiques, modération |
| **Gris** | `#8C8C8C` | Textes secondaires, placeholders |

## 12.2 Composants UI (design system)

**Boutons :**
- `Button Accent` : background `#F7931E`, texte blanc — CTA principal (Publier, Payer, Signer)
- `Button Primary` : background `#0F2A5E`, texte blanc — actions secondaires

**Maquettes Figma :** https://www.figma.com/design/TLa3Cbo10YuKmTqxPCVfLJPA

## 12.3 Application Java Desktop

Même palette CSS JavaFX. Thèmes :
- **default** : background `#FFFFFF`, primary `#0F2A5E`, accent `#F7931E`
- **dark** : background `#1A1A2E`, primary `#2D4A8A`, accent `#F7931E`

---

# 13. Décisions architecturales

## ADR-001 — Stripe Connect sans fonds stockés

**Décision :** utiliser Stripe Connect (paiements directs compte-à-compte)  
**Raison :** zéro responsabilité légale sur la détention de fonds, pas d'agrément d'établissement de paiement requis, conformité PCI-DSS native  
**Rejeté :** escrow interne (agrément requis), marketplace Stripe (complexité + frais supplémentaires)

## ADR-002 — Neo4j pour le graphe social & les recommandations

**Décision :** Neo4j 5 pour le graphe social, la géographie et les recommandations  
**Raison :** requêtes de voisinage (ADJACENT_TO*1..2), scoring multi-signal en une seule requête Cypher, relations complexes impossibles en SQL sans JOINs exponentiels  
**Rejeté :** PostgreSQL + récursivité CTEs (performances dégradées à l'échelle), DynamoDB graphs (pas cloud-agnostique)

## ADR-003 — PLY Python pour le DSL custom

**Décision :** Python Lex-Yacc (PLY) dans un micro-service FastAPI isolé  
**Raison :** séparation des responsabilités, grammaire formelle BNF extensible, thread-safety par `lexer.clone()`, pas de dépendance PLY dans NestJS  
**Rejeté :** regex seules (ambiguïtés, maintenance), ANTLR (surpuissant pour ce cas d'usage)

## ADR-004 — Leaflet.draw pour la gestion géographique des quartiers

**Décision :** Leaflet.draw (React Leaflet) + turf.js côté NestJS  
**Raison :** dessin de polygones intuitif pour les admins, calcul centroïde/aire/adjacences côté serveur (pas de dépendance PostGIS), GeoJSON natif Neo4j  
**Rejeté :** PostGIS (surpuissant, ajoute une extension PostgreSQL), Google Maps (payant)

## ADR-005 — Messagerie chiffrée AES-256-GCM serveur (pas E2E)

**Décision :** chiffrement AES-256-GCM côté serveur avec clé de groupe dans Redis  
**Raison :** compromise acceptable pour v1 — fonctionnalités de modération préservées, clé jamais exposée au client, coût implémentation E2E (X3DH + Double Ratchet) reporté en v2  
**Note :** l'évolution vers E2E (Signal Protocol) est identifiée et documentée — architecture de clés de groupe (une clé par groupe) facilite cette migration

## ADR-006 — BullMQ (Redis) + SELECT FOR UPDATE pour les inscriptions événements

**Décision :** queue BullMQ `event-register` (concurrency:1) + `SELECT FOR UPDATE` PostgreSQL  
**Raison :** le lock Redis `SET NX` était rejeté car il rejette les requêtes concurrentes au lieu de les sérialiser, sans garantie de durabilité si NestJS crash. BullMQ absorbe les pics, `SELECT FOR UPDATE` garantit la cohérence même en multi-instances NestJS  
**Résultat :** 202 Accepted immédiat + résultat via Socket.io → meilleure UX
**Note :** BullMQ est le successeur actif de Bull (en maintenance mode). API similaire, meilleures performances et support TypeScript natif.

## ADR-007 — SQLite offline-first pour Java (pas de réplication MongoDB/Neo4j)

**Décision :** SQLite embarqué — uniquement le sous-ensemble nécessaire (incidents, modération, utilisateurs)  
**Raison :** MongoDB et Neo4j sont trop lourds à répliquer offline pour un client léger — seules les données de travail des admins/modérateurs sont synchronisées  
**Synchronisation :** batch idempotent avec `job_id` — safe pour les réseaux instables et les crashs

## ADR-008 — eIDAS niveau simple (pas qualifié)

**Décision :** signature électronique eIDAS niveau simple (sans prestataire certifié externe)  
**Raison :** niveau légalement recevable en France pour les transactions entre particuliers, implémentable directement (JWT + TOTP + SHA-256 + canvas), coût zéro vs prestataires qualifiés  
**Composants :** identification JWT · intégrité SHA-256 · horodatage serveur · confirmation TOTP · signature manuscrite canvas

---

# 14. Organisation de l'équipe

## 14.1 Composition

| Membre | Rôle | Contact |
|--------|------|---------|
| **Amélie** | Développeuse full-stack | `[À RENSEIGNER]` |
| **Antonio** | Développeur full-stack | `[À RENSEIGNER]` |
| **Nathan** | Développeur full-stack | `[À RENSEIGNER]` |

> **Principe retenu :** tout le monde touche à tout. La répartition est par module fonctionnel, pas par couche technique — chaque développeur est responsable de bout en bout d'un module (frontend + backend + tests + documentation).

## 14.2 Outils de gestion de projet

| Outil | Usage |
|-------|-------|
| **GitHub** | Code source, branches par fonctionnalité, PRs, CI/CD | `[URL À RENSEIGNER]` |
| **Plane** | Backlog → En cours → Review → Terminé | `[URL À RENSEIGNER]` |
| **Discord** | Communication interne, revues de code, daily standup |
| **Figma** | Design system, maquettes | https://www.figma.com/design/TLa3Cbo10YuKmTqxPCVfLJPA |

## 14.3 Découpage suggéré par sprints

| Sprint | Durée | Objectifs |
|--------|-------|----------|
| **S1** | 2 sem | Auth TOTP · Profils · Docker Compose complet |
| **S2** | 2 sem | Annonces · Messagerie (DM) · Neo4j quartiers |
| **S3** | 2 sem | Paiements Stripe · Documents/signatures eIDAS |
| **S4** | 2 sem | Événements · Liste d'attente · Billets QR |
| **S5** | 2 sem | Votes · Incidents · DSL |
| **S6** | 2 sem | App Java Desktop · SSO QR · Offline sync |
| **S7** | 1 sem | Tests · CI/CD · Documentation · i18n |
| **S8** | 1 sem | Stabilisation · Revue sécurité · Démo finale |

## 14.4 Règles de développement

- **PR obligatoire** pour tout merge sur `develop` (minimum 1 review)
- **Tests avant merge** : couverture ne doit pas descendre en dessous du seuil
- **Swagger à jour** : tout nouvel endpoint doit être documenté via annotations NestJS avant PR
- **Pas de credentials** dans le code — `.env` uniquement, `.env.example` versionné
- **Soft delete uniquement** — aucun `DELETE` physique sur les entités sociales et contractuelles

---

# 15. Glossaire technique

| Terme | Définition |
|-------|-----------|
| **Argon2id** | Algorithme de hachage mémoire-intensif pour les mots de passe (OWASP recommandé). Hybride entre Argon2i (résistance side-channel) et Argon2d (résistance GPU). |
| **AES-256-GCM** | Advanced Encryption Standard 256-bit en mode Galois/Counter Mode. Chiffrement authentifié : garantit confidentialité + intégrité en un seul algorithme (auth_tag). |
| **BullMQ** | Librairie Node.js de queues de jobs basées sur Redis (successeur actif de Bull). Utilisée pour les tâches asynchrones (génération PDF, sync Neo4j, emails, Stripe webhooks). |
| **Cypher** | Langage de requête déclaratif de Neo4j, similaire au SQL mais pour les graphes. Syntaxe ASCII-art pour décrire les patterns de nœuds et relations. |
| **DSL** | Domain Specific Language — langage de requête custom du projet, parsé par PLY (Python Lex-Yacc), permettant d'interroger MongoDB sans exposer sa syntaxe native. |
| **eIDAS** | Règlement européen sur l'identification électronique et les services de confiance. Niveau Simple = identité prouvée par login + TOTP + SHA-256, sans prestataire certifié externe. |
| **HMAC-SHA256** | Hash-based Message Authentication Code avec SHA-256. Utilisé pour signer les payloads QR tickets et les credentials TURN/STUN. |
| **IdempotentJob** | Job Bull dont la ré-exécution produit le même résultat qu'une première exécution. Garantit la sécurité en cas de crash/retry (identifié par `job_id` UUID). |
| **JWT** | JSON Web Token — token d'authentification signé HS256 contenant `{ sub, role, locale, iat, exp }`. Partagé entre React (web) et Java Desktop (SSO). |
| **Offline-first** | Stratégie de conception où l'application fonctionne sans connexion, synchronisant ses données locales (SQLite) vers le serveur à la reconnexion. |
| **PLY** | Python Lex-Yacc — bibliothèque Python implémentant un compilateur lex/yacc complet. Utilisée pour le DSL custom de Nabor (tokenisation + grammaire BNF). |
| **RGPD** | Règlement Général sur la Protection des Données (UE 2016/679). Encadre la collecte, le traitement et la conservation des données personnelles. |
| **Soft delete** | Suppression logique via `deleted_at IS NOT NULL` — les données ne sont pas physiquement supprimées mais masquées. Permet la restauration et l'audit. |
| **Stripe Connect** | Produit Stripe permettant des paiements directs entre comptes tiers (prestataire → habitant), sans que la plateforme détienne les fonds. |
| **TOTP** | Time-based One-Time Password (RFC 6238) — code à 6 chiffres valable 30s généré depuis un secret partagé (Google Authenticator compatible). |
| **TURN/STUN** | Protocoles WebRTC pour traverser les NAT. STUN découvre l'IP publique ; TURN relaie le flux si P2P direct impossible (coturn est le serveur relay). |
| **UUID v7** | Variante d'UUID ordonné chronologiquement (RFC 9562) — compatible avec les index PostgreSQL B-tree et trié naturellement par date de création. Généré via l'extension `pg_uuidv7` (`uuidv7()`). |
| **WebRTC** | Web Real-Time Communication — API navigateur permettant des communications P2P directes (audio, vidéo, données) sans serveur intermédiaire. |
| **Webhook Stripe** | Requête HTTP envoyée par Stripe vers NestJS après un événement (paiement réussi, remboursement). Vérifié via `Stripe-Signature` (HMAC secret). |

---

# 16. Évolutions futures (v2+)

> Ces fonctionnalités sont **explicitement hors périmètre v1** et documentées ici pour guider
> l'architecture actuelle — les choix de v1 ne doivent pas bloquer ces évolutions.

## 16.1 Chiffrement de bout en bout (E2E) — v2

**Objectif :** remplacer le chiffrement AES-256 serveur par un protocole E2E (Signal Protocol).

**Protocole cible :** Signal Protocol (X3DH + Double Ratchet Algorithm)
- X3DH (Extended Triple Diffie-Hellman) pour l'établissement des clés initiales
- Double Ratchet pour la rotation des clés à chaque message

**Impact architectural :** 
- Clés de session gérées côté client (pas dans Redis)
- NestJS ne voit plus les messages en clair → modération reactive impossible (compromis à arbitrer)
- Architecture `group_key` actuelle (une clé AES par groupe dans Redis) facilitera la migration : même granularité, clé déplacée client-side

**Pré-requis migration :**
- Bibliothèque libsignal (React + Java)
- Key storage sécurisé navigateur (IndexedDB chiffré) et Java (KeyStore OS)
- Protocole de backup des clés pour la récupération de compte

## 16.2 Application mobile (iOS / Android) — v2

**Cible :** React Native (réutilisation de la logique métier React)

**Fonctionnalités prioritaires mobile :**
- Push notifications (Firebase Cloud Messaging)
- Scan QR billet événement (caméra native)
- Géolocalisation précise (découverte quartiers proches)
- Mode hors-ligne partiel (annonces, événements en cache)

## 16.3 IA de modération — v2

**Objectif :** modération proactive des contenus avant publication (images, textes)

**Stack envisagée :**
- Analyse de texte : API OpenAI Moderation ou modèle local HuggingFace
- Analyse d'image : AWS Rekognition ou Google Vision API (NSFW, violence)
- Score de confiance → mise en file d'attente pour review humaine si score > seuil

**Position de la modération réactive actuelle :** conservée comme filet de sécurité, même avec l'IA.

## 16.4 Marketplace avec paiement différé (escrow) — v2

**Objectif :** permettre le dépôt de fonds jusqu'à validation du service rendu

**Impact légal :** nécessite un agrément d'établissement de paiement (ou partenariat PSP agréé)

**Alternative sans agrément :** Stripe Treasury (US/UK uniquement à ce jour)

## 16.5 (Remplacé) Géocodage de précision

Cette fonctionnalité a été rapatriée dans la version 1.
**Stack :** BAN (Base Adresse Nationale) via conteneur Docker local + Neo4j.
Nominatim a été entièrement retiré de l'architecture.

## 16.6 Pepper Argon2id & rotation des clés AES — v2

**Objectif :** ajouter un pepper secret côté serveur pour les hachages Argon2id et
implémenter une rotation périodique des `AES_MASTER_KEY`.

**Actuel :** Argon2id sans pepper, `AES_MASTER_KEY` statique dans `.env`.

---

# 17. Matrice des risques & conformité

## 17.1 Risques sécurité

| Risque | Probabilité | Impact | Mitigation                                                                                                                                        |
|--------|-------------|--------|---------------------------------------------------------------------------------------------------------------------------------------------------|
| Manque d'intégrité référentielle (PostgreSQL / Neo4j) | Élevée | Élevé | PostgreSQL stocke `neighbourhood_id` (texte), Neo4j est la source de vérité. Pas de Foreign Keys. L'API doit utiliser des transactions applicatives strictes et interdire la suppression de quartiers peuplés pour éviter les orphelins. |
| Vol de JWT access token (XSS) | Moyenne | Élevé | Durée 15 min, `HttpOnly` pour refresh, CSP headers                                                                                                |
| Replay d'un webhook Stripe | Faible | Élevé | Vérification `Stripe-Signature` + idempotence `stripe_payment_intent`                                                                             |
| Race condition inscription événement | Élevée | Moyen | Queue Bull `concurrency:1` + `SELECT FOR UPDATE` PostgreSQL                                                                                       |
| Injection NoSQL dans le DSL | Moyenne | Élevé | Whitelist collections, projection systématique, LIMIT 500, Le DSL génère uniquement des requêtes de lecture MongoDB (pas d'écriture)              |
| Brute force TOTP | Moyenne | Élevé | 3 tentatives → blocage Redis 15 min                                                                                                               |
| Falsification de billet QR | Faible | Moyen | HMAC-SHA256 signé côté serveur                                                                                                                    |
| Fuite clé AES groupe depuis Redis | Faible | Élevé | Clé chiffrée avec `AES_MASTER_KEY`, AOF Redis, pas d'accès public                                                                                 |
| Crash NestJS pendant génération PDF | Moyenne | Faible | Queue Bull avec retry x3, idempotence via `transaction_id`                                                                                        |
| Plugin Java malveillant | Faible | Élevé | `URLClassLoader` isolé, pas d'accès réseau hors PluginContext                                                                                     |

## 17.2 Risques RGPD

| Risque | Mitigation |
|--------|-----------|
| Oubli d'anonymisation lors d'une suppression | Queue `bull:rgpd-anonymise` déclenché par `DELETE /users/me`, log de l'exécution |
| Conservation de données bancaires | Stripe gère le PCI-DSS — aucune donnée bancaire ne transite |
| Export RGPD incomplet | `GET /users/me/export` couvre profil, annonces, messages envoyés, participations, votes |
| Documents contractuels supprimés | `contracts` MongoDB avec flag `anonymised_at` — jamais de `DELETE`, seulement anonymisation sélective |
| Mineurs sur la plateforme | Mention CGU obligatoire à l'inscription (18+), pas de vérification d'âge technique en v1 |

## 17.3 Risques de scalabilité

| Risque | Seuil critique | Mitigation |
|--------|---------------|-----------|
| Feed Neo4j lent à grande échelle | > 50K utilisateurs | Pagination cursor-based, cache Redis 10 min, index Neo4j `pg_id` |
| Surcharge Redis à pic | Queues Bull trop longues | Bull Dashboard (monitoring), concurrency ajustable par queue |
| Multi-instances NestJS (prod x2) | Événements Socket.io perdus | Redis adapter Socket.io (`@socket.io/redis-adapter`) |
| SQLite concurrent Java | Accès multi-thread | WAL mode activé (`PRAGMA journal_mode=WAL`) |

⚠️ **Point critique prod** : le Redis adapter Socket.io est **obligatoire** dès que `deploy.replicas > 1` — sans lui, un client connecté à l'instance A ne reçoit pas les events émis depuis l'instance B.

---

*Nabor Services — Cahier des charges technique v1.1*  
*Équipe : Amélie · Antonio · Nathan · ESGI 3AL 2025/2026*
