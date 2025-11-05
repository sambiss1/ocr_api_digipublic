# Codes Provinces RDC - Plaques d'Immatriculation

## Formats des plaques supportés

Le système détecte plusieurs formats de plaques RDC:

### Format 1: Standard avec lettres au début
**Format:** `XX-XXXX-XX` ou `XX XXXX XX`
- **XX** (2 lettres) : Identifiant du véhicule
- **XXXX** (4 chiffres) : Numéro séquentiel
- **XX** (2 chiffres) : Code de la province
- **Exemples:** `BE-6401-01`, `BE 6401 01`

### Format 2: Chiffres puis lettres
**Format:** `XXXX-XX-XX` ou `XXXXXX XX`
- **XXXX** (4 chiffres) : Numéro séquentiel
- **XX** (2 lettres) : Identifiant
- **XX** (2 chiffres) : Code de la province
- **Exemples:** `1234AB 10`, `5678CD-12`

### Format 3: Format compact
**Format:** `XXXXXXXX` (sans séparateurs)
- **Exemples:** `0058AA19`, `1234AB01`

### Format 4: Variations avec 2-4 chiffres
**Format:** `XX-XXX-XX` ou `XXX-XX-XX`
- **Exemples:** `123AB 10`, `12CD 01`

## Liste des codes provinces

| Code | Province |
|------|----------|
| 01 | Kinshasa |
| 02 | Kongo Central |
| 03 | Kwango |
| 04 | Kwilu |
| 05 | Mai-Ndombe |
| 06 | Kasaï |
| 07 | Kasaï-Central |
| 08 | Kasaï-Oriental |
| 09 | Lomami |
| 10 | Sankuru |
| 11 | Maniema |
| 12 | Sud-Kivu |
| 13 | Nord-Kivu |
| 14 | Ituri |
| 15 | Haut-Uélé |
| 16 | Tshopo |
| 17 | Bas-Uélé |
| 18 | Nord-Ubangi |
| 19 | Mongala |
| 20 | Sud-Ubangi |
| 21 | Équateur |
| 22 | Tshuapa |
| 23 | Tanganyika |
| 24 | Haut-Lomami |
| 25 | Lualaba |
| 26 | Haut-Katanga |

## Exemples de plaques valides

### Format standard (lettres-chiffres-province)
```
BE-6401-01  → Kinshasa
AB-1234-26  → Haut-Katanga
CD 5678 12  → Sud-Kivu
EF-9012-13  → Nord-Kivu
GH 3456 02  → Kongo Central
```

### Format alternatif (chiffres-lettres-province)
```
1234AB 10   → Sankuru
5678CD 12   → Sud-Kivu
9012EF-13   → Nord-Kivu
3456GH 01   → Kinshasa
```

### Format compact (sans séparateurs)
```
0058AA19    → Mongala
1234AB01    → Kinshasa
5678CD26    → Haut-Katanga
```

## Variations acceptées par le système

Le système accepte **toutes** les variations suivantes:
- **Avec tirets:** `BE-6401-01`, `1234-AB-10`
- **Avec espaces:** `BE 6401 01`, `1234AB 10`
- **Sans séparateurs:** `BE640101`, `1234AB10`
- **Mixte:** `BE-6401 01`, `1234 AB-10`

Le système normalise automatiquement le format détecté.

## Numéros de châssis

### Format VIN standard (17 caractères)
Exemple: `WVWZZZ1JZYW123456`

### Format avec préfixe
- `CHASSIS: ABC123XYZ456789`
- `VIN: ABC123XYZ456789`
- `N° ABC123XYZ456789`
- `NO ABC123XYZ456789`

## Utilisation de l'API

### Exemple de requête
```bash
curl -X POST http://localhost:8000/api/images/upload-and-extract \
  -F "image=@plaque.jpg"
```

### Exemple de réponse
```json
{
  "success": true,
  "data": {
    "imageUrl": "https://digipublic.trinityagency.tech/images/abc123.jpg",
    "extractedContent": {
      "rawText": "BE-6401-01\nCHASSIS: WVWZZZ1JZYW123456",
      "confidence": 92.5,
      "plateNumber": "BE-6401-01",
      "province": "Kinshasa",
      "chassisNumber": "WVWZZZ1JZYW123456"
    }
  },
  "requestId": 1730799123456
}
```

## Conseils pour de meilleurs résultats

1. **Qualité de l'image**
   - Utilisez des images nettes et bien éclairées
   - Évitez les reflets sur la plaque
   - Cadrez au plus près de la plaque

2. **Résolution**
   - Minimum recommandé: 800x600 pixels
   - Optimal: 1920x1080 pixels ou plus

3. **Format**
   - JPEG, PNG ou WebP
   - Taille max: 10MB

4. **Angle de prise de vue**
   - Privilégiez une vue frontale
   - Évitez les angles trop prononcés
