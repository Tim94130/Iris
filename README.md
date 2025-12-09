# 🌟 IRIS - AI Project Summary

> Une application moderne de résumé de projet en temps réel, alimentée par l'IA locale (Ollama).

![IRIS Preview](https://img.shields.io/badge/Status-Development-blue) ![React](https://img.shields.io/badge/React-18.2-61dafb) ![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178c6) ![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)

## 📋 Description

IRIS est une application full-stack qui permet de:

- **Afficher une conversation** à gauche de l'écran (texte)
- **Afficher en temps réel un résumé structuré** de projet à droite, rempli par une IA

L'IA analyse le transcript de la conversation et extrait automatiquement:

- 📝 **Titre** du projet
- 📅 **Date de début** (format YYYY-MM-DD)
- 📅 **Date de fin** (format YYYY-MM-DD)
- 💰 **Budget** (en euros)

## 🐳 Démarrage avec Docker (Recommandé)

### Prérequis

- Docker Desktop installé
- Au moins 8 Go de RAM (pour Ollama)

### Lancement en une commande

```bash
# Cloner et lancer
cd Iris
docker-compose up -d

# Télécharger le modèle Ollama (première fois uniquement)
docker exec -it iris-ollama ollama pull llama3.2
```

L'application sera disponible sur:

- **Frontend**: http://localhost
- **Backend API**: http://localhost:3001
- **Ollama API**: http://localhost:11434

### Arrêter l'application

```bash
docker-compose down
```

## 🖥️ Démarrage local (Développement)

### Prérequis

- Node.js 18+ et npm
- Ollama installé localement ([ollama.ai](https://ollama.ai))

### 1. Installer Ollama et le modèle

```bash
# Installer Ollama (Windows/Mac/Linux)
# Télécharger depuis https://ollama.ai

# Télécharger le modèle
ollama pull llama3.2

# Vérifier qu'Ollama tourne
ollama list
```

### 2. Lancer l'application

```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

L'application sera disponible sur:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

## 🏗️ Architecture

```
Iris/
├── docker-compose.yml          # Orchestration Docker
├── frontend/                   # Application React
│   ├── Dockerfile
│   ├── nginx.conf
│   └── src/
│       ├── components/        # Composants UI
│       ├── hooks/             # Hooks personnalisés
│       ├── services/          # Appels API
│       └── types/             # Types TypeScript
│
├── backend/                    # API Node.js/Express
│   ├── Dockerfile
│   └── src/
│       ├── routes/            # Routes Express
│       ├── services/          # Logique métier (IA Ollama)
│       ├── repositories/      # Couche données
│       └── models/            # Types/Modèles
│
└── README.md
```

## 🎨 Design & UX

### Thème visuel

- **Dark futuriste** avec dégradé bleu nuit/violet
- Accents **néon** (cyan `#00f5ff`, violet `#a855f7`)
- Effets **glassmorphism** et **glow** subtils
- Police moderne **Sora** + **JetBrains Mono**

### Animations (Framer Motion)

- ✨ **Fade + scale** à l'apparition des champs
- 💫 **Highlight pulsé** lors des mises à jour
- 📝 **Slide-in** pour les nouveaux messages
- ⏳ **Skeleton loading** en attente

## 📡 API Endpoints

### `POST /api/messages`

Envoie un message et reçoit l'analyse IA.

```json
// Request
{
  "conversationId": "conv_123",
  "text": "Le projet s'appelle Nova, budget de 50000€"
}

// Response
{
  "aiMessage": "Bien noté ! J'ai noté le nom du projet...",
  "summary": {
    "title": "Nova",
    "start_date": null,
    "end_date": null,
    "budget": 50000
  }
}
```

### `GET /api/projects/:conversationId/summary`

Récupère le résumé actuel d'une conversation.

### `GET /api/health`

Vérifie l'état du serveur et d'Ollama.

## ⚙️ Configuration

### Variables d'environnement (Backend)

| Variable       | Description       | Défaut                   |
| -------------- | ----------------- | ------------------------ |
| `PORT`         | Port du serveur   | `3001`                   |
| `OLLAMA_HOST`  | URL d'Ollama      | `http://localhost:11434` |
| `OLLAMA_MODEL` | Modèle à utiliser | `llama3.2`               |

### Modèles Ollama recommandés

| Modèle        | Taille | Performance        |
| ------------- | ------ | ------------------ |
| `llama3.2`    | 2GB    | ⭐⭐⭐ Recommandé  |
| `llama3.2:1b` | 1.3GB  | ⭐⭐ Léger         |
| `mistral`     | 4GB    | ⭐⭐⭐⭐ Meilleur  |
| `mixtral`     | 26GB   | ⭐⭐⭐⭐⭐ Premium |

## 🔌 Intégrations futures

### Speech-to-Text (STT)

Le hook `useTranscriptStream` est prêt pour l'intégration:

```typescript
// frontend/src/hooks/useTranscriptStream.ts
// TODO: Brancher ici le résultat du package STT
```

### MongoDB

Le repository est prêt pour MongoDB:

```typescript
// backend/src/repositories/projectSummaryRepository.ts
// TODO: Remplacer par une vraie implémentation MongoDB
```

## 🧪 Test rapide

1. Lancez l'application (Docker ou local)
2. Assurez-vous qu'Ollama est démarré avec le modèle
3. Tapez dans le chat:
   - _"Le projet s'appelle Aurora"_
   - _"On commence le 15 janvier 2025"_
   - _"Le budget est de 75000 euros"_
4. Observez le panneau droit se remplir en temps réel ! ✨

## 🛠️ Technologies

### Frontend

- **React 18** + TypeScript
- **Tailwind CSS** pour le styling
- **Framer Motion** pour les animations
- **Lucide React** pour les icônes
- **Vite** comme bundler

### Backend

- **Node.js** + **Express**
- **TypeScript**
- **Zod** pour la validation
- **Ollama** pour l'IA locale

### Infrastructure

- **Docker** + **Docker Compose**
- **Nginx** pour le frontend
- **Ollama** comme LLM local

## 📄 License

MIT © 2024 IRIS Team
