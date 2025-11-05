# Patterns de Test - Plaques RDC

## Patterns Regex Implémentés

### Pattern 1: Format Standard (Lettres au début)
**Regex:** `/\b([A-Z]{2})[-\s]?(\d{4})[-\s]?(\d{2})\b/gi`

**Exemples détectés:**
- ✅ `BE-6401-01`
- ✅ `BE 6401 01`
- ✅ `BE640101`
- ✅ `AB-1234-26`
- ✅ `CD 5678 12`

### Pattern 2: Format Alternatif (Chiffres puis lettres)
**Regex:** `/\b(\d{4})([A-Z]{2})[\s-]?(\d{2})\b/gi`

**Exemples détectés:**
- ✅ `1234AB 10`
- ✅ `5678CD-12`
- ✅ `9012EF 13`
- ✅ `3456GH01`

### Pattern 3: Format Mixte (2-4 chiffres + lettres)
**Regex:** `/\b(\d{2,4})([A-Z]{2})[\s-]?(\d{2})\b/gi`

**Exemples détectés:**
- ✅ `123AB 10`
- ✅ `12CD 01`
- ✅ `1234EF-26`
- ✅ `56GH 12`

### Pattern 4: Format Compact (Sans séparateurs)
**Regex:** `/\b(\d{2,4})([A-Z]{2})(\d{2})\b/gi`

**Exemples détectés:**
- ✅ `0058AA19`
- ✅ `1234AB01`
- ✅ `5678CD26`
- ✅ `123EF10`

## Ordre de Priorité

Les patterns sont testés dans l'ordre suivant:
1. Pattern 1 (Standard avec lettres au début)
2. Pattern 2 (Chiffres puis lettres)
3. Pattern 3 (Format mixte)
4. Pattern 4 (Format compact)

Le **premier pattern qui match** est retourné.

## Extraction du Code Province

Le code province est **toujours extrait des 2 derniers chiffres** de la plaque détectée.

**Exemples:**
- `BE-6401-01` → Province: `01` (Kinshasa)
- `1234AB 10` → Province: `10` (Sankuru)
- `0058AA19` → Province: `19` (Mongala)

## Cas Particuliers

### Espaces Multiples
Le système normalise automatiquement les espaces multiples:
- Input: `BE  6401   01`
- Output: `BE 6401 01`

### Retours à la ligne
Les retours à la ligne sont convertis en espaces:
- Input: `BE-6401\n01`
- Output: `BE-6401 01`

### Casse (Majuscules/Minuscules)
Tout est converti en majuscules:
- Input: `be-6401-01`
- Output: `BE-6401-01`

## Tests de Non-Détection

Ces formats **ne doivent PAS** être détectés comme plaques:

❌ `123` (trop court)
❌ `ABCD-1234-01` (trop de lettres)
❌ `AB-123-01` (pas assez de chiffres)
❌ `AB-12345-01` (trop de chiffres)
❌ `1234` (pas de lettres)
❌ `ABCD` (pas de chiffres)

## Validation des Codes Province

Seuls les codes de `01` à `26` sont valides:

✅ `BE-6401-01` → Kinshasa (valide)
✅ `AB-1234-26` → Haut-Katanga (valide)
❌ `CD-5678-99` → Code 99 invalide (province = null)
❌ `EF-9012-00` → Code 00 invalide (province = null)

## Exemples de Texte Complet

### Exemple 1: Plaque seule
```
Input: "BE-6401-01"
Output: {
  plate: "BE-6401-01",
  province: "Kinshasa"
}
```

### Exemple 2: Plaque avec autre texte
```
Input: "Véhicule immatriculé 1234AB 10 en bon état"
Output: {
  plate: "1234AB 10",
  province: "Sankuru"
}
```

### Exemple 3: Plusieurs plaques (prend la première)
```
Input: "BE-6401-01 et CD-5678-12"
Output: {
  plate: "BE-6401-01",
  province: "Kinshasa"
}
```

### Exemple 4: Plaque avec châssis
```
Input: "Plaque: 0058AA19\nCHASSIS: ABC123XYZ456789"
Output: {
  plate: "0058AA19",
  province: "Mongala",
  chassis: "ABC123XYZ456789"
}
```

## Logs de Débogage

Le système affiche dans les logs:
```
Raw OCR text: 1234AB 10
Pattern matched: \b(\d{4})([A-Z]{2})[\s-]?(\d{2})\b -> 1234AB 10
Extracted plate: 1234AB 10
Extracted province: Sankuru
```

## Recommandations pour de Meilleurs Résultats

1. **Image claire et nette**
2. **Bon éclairage** (éviter les ombres)
3. **Vue frontale** de la plaque
4. **Contraste élevé** entre plaque et fond
5. **Résolution minimale:** 800x600 pixels
6. **Format recommandé:** JPEG ou PNG
