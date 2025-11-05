# Simple Backend - Image Upload & OCR API

Backend Express pour uploader des images sur Cloudflare R2 et extraire leur contenu texte via OCR.

## 🚀 Fonctionnalités

- **Upload d'images** vers Cloudflare R2 (S3-compatible)
- **Extraction de texte** depuis les images (OCR) avec Tesseract.js
- **Optimisation automatique** des images avec Sharp
- Support des formats: JPEG, PNG, WebP
- OCR multilingue (Français + Anglais)

## 📋 Prérequis

- Node.js 18+
- Compte Cloudflare avec R2 activé
- Access Keys Cloudflare R2 (Access Key ID, Secret Access Key)

## 🛠️ Installation

1. **Installer les dépendances**
```bash
npm install
```

2. **Configurer les variables d'environnement**
```bash
cp .env.example .env
```

Puis éditer `.env` avec vos credentials Cloudflare R2:
```env
PORT=3000
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_ACCESS_KEY_ID=your_access_key_id
CLOUDFLARE_SECRET_ACCESS_KEY=your_secret_access_key
CLOUDFLARE_BUCKET_NAME=your_bucket_name
CLOUDFLARE_BUCKET_URL=https://your-bucket-url.r2.dev
```

## 🏃 Démarrage

**Mode développement:**
```bash
npm run dev
```

**Mode production:**
```bash
npm run build
npm start
```

Le serveur démarre sur `http://localhost:3000`

## 📡 API Endpoints

### 1. Upload d'image seule

**POST** `/api/images/upload`

Upload une image sur Cloudflare R2 (sans extraction de contenu).

**Request:**
- Content-Type: `multipart/form-data`
- Body: `image` (file)

**Response:**
```json
{
  "success": true,
  "data": {
    "imageUrl": "https://your-bucket.r2.dev/1234567890-image.jpg"
  }
}
```

**Exemple avec curl:**
```bash
curl -X POST http://localhost:3000/api/images/upload \
  -F "image=@/path/to/image.jpg"
```

### 2. Upload ET extraction en une requête

**POST** `/api/images/upload-and-extract`

Upload une image sur Cloudflare R2 ET extrait directement son contenu texte.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `image` (file)

**Response:**
```json
{
  "success": true,
  "data": {
    "imageUrl": "https://your-bucket.r2.dev/1234567890-image.jpg",
    "extractedContent": {
      "rawText": "BE-6401-01\nCHASSIS: ABC123XYZ456789",
      "confidence": 95.5,
      "plateNumber": "BE-6401-01",
      "province": "Kinshasa",
      "chassisNumber": "ABC123XYZ456789"
    }
  },
  "requestId": 1730799123456
}
```

**Exemple avec curl:**
```bash
curl -X POST http://localhost:3000/api/images/upload-and-extract \
  -F "image=@/path/to/image.jpg"
```

**Exemple avec fetch (JavaScript):**
```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);

const response = await fetch('http://localhost:3000/api/images/upload-and-extract', {
  method: 'POST',
  body: formData
});

const data = await response.json();
console.log(data);
```

### 3. Extraction depuis une URL

**POST** `/api/images/extract`

Extrait le texte d'une image déjà uploadée via son URL.

**Request:**
```json
{
  "imageUrl": "https://your-bucket.r2.dev/image.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "extractedContent": {
      "text": "Texte extrait",
      "confidence": 92.3
    }
  }
}
```

### 4. Health Check

**GET** `/health`

Vérifie que le serveur fonctionne.

**Response:**
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

## 🔧 Configuration Cloudflare R2

1. **Activer Cloudflare R2** dans votre dashboard Cloudflare
2. **Créer un bucket R2:**
   - Dashboard Cloudflare → R2 → Create bucket
   - Nommer votre bucket (ex: `my-images`)
3. **Générer des Access Keys:**
   - R2 → Manage R2 API Tokens → Create API token
   - Permissions: Object Read & Write
   - Copier l'Access Key ID et Secret Access Key
4. **Configurer le domaine public (optionnel):**
   - R2 → Votre bucket → Settings → Public access
   - Activer et configurer un domaine personnalisé ou utiliser l'URL R2.dev
5. **Mettre à jour `.env`** avec vos credentials

## 📦 Structure du projet

```
simple_backend/
├── src/
│   ├── controllers/
│   │   └── image.controller.ts    # Logique des endpoints
│   ├── routes/
│   │   └── image.routes.ts        # Définition des routes
│   ├── services/
│   │   ├── cloudflare.service.ts  # Upload vers Cloudflare R2
│   │   └── ocr.service.ts         # Extraction OCR
│   └── index.ts                   # Point d'entrée
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## 🔒 Sécurité

- Limite de taille de fichier: 10MB
- Types de fichiers autorisés: JPEG, PNG, WebP
- Les credentials Cloudflare doivent rester dans `.env` (jamais commiter)

## 🐛 Debugging

Les logs sont affichés dans la console:
- Progression de l'OCR
- Erreurs d'upload
- Erreurs d'extraction

## 🎯 Détection Intelligente

### Plaques d'immatriculation RDC
Le système détecte automatiquement **plusieurs formats** de plaques RDC:

**Formats supportés:**
- `XX-XXXX-XX` ou `XX XXXX XX` → Lettres au début (ex: `BE-6401-01`)
- `XXXXXX XX` ou `XXXX-XX-XX` → Chiffres au début (ex: `1234AB 10`)
- `XXXXXXXX` → Format compact (ex: `0058AA19`)
- Variations avec 2-4 chiffres (ex: `123AB 10`)

**Séparateurs acceptés:** tirets, espaces, ou aucun séparateur

**Exemples de plaques détectées:**
- `BE-6401-01` → Kinshasa
- `1234AB 10` → Sankuru
- `0058AA19` → Mongala
- `KA 1234 26` → Haut-Katanga

**Provinces supportées:** Les 26 provinces de la RDC

### Numéros de châssis
Le système détecte:
- **VIN standard:** 17 caractères alphanumériques
- **Format alternatif:** Précédé de "CHASSIS", "VIN", "N°" ou "NO"
- **Exemple:** `ABC123XYZ456789` ou `CHASSIS: ABC123XYZ456789`

### Fonctionnement
1. L'OCR extrait tout le texte de l'image (`rawText`)
2. Des regex intelligentes identifient les plaques et châssis
3. Seules les informations pertinentes sont retournées
4. Le code province est automatiquement traduit en nom de province

## 📝 Notes

- L'OCR utilise Tesseract.js avec support français et anglais
- Les images sont automatiquement optimisées (max 2000x2000px, qualité 85%)
- Le temps de traitement OCR dépend de la taille et complexité de l'image
- La whitelist de caractères est optimisée pour les plaques (A-Z, 0-9, -, espace)
