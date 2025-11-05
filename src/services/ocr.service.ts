import { createWorker } from 'tesseract.js';

interface OCRResult {
  text: string;
  confidence: number;
  plateNumber?: string | null;
  chassisNumber?: string | null;
  province?: string | null;
  rawText?: string;
}

// Codes provinces RDC
const PROVINCE_CODES: { [key: string]: string } = {
  '01': 'Kinshasa',
  '02': 'Kongo Central',
  '03': 'Kwango',
  '04': 'Kwilu',
  '05': 'Mai-Ndombe',
  '06': 'Kasaï',
  '07': 'Kasaï-Central',
  '08': 'Kasaï-Oriental',
  '09': 'Lomami',
  '10': 'Sankuru',
  '11': 'Maniema',
  '12': 'Sud-Kivu',
  '13': 'Nord-Kivu',
  '14': 'Ituri',
  '15': 'Haut-Uélé',
  '16': 'Tshopo',
  '17': 'Bas-Uélé',
  '18': 'Nord-Ubangi',
  '19': 'Mongala',
  '20': 'Sud-Ubangi',
  '21': 'Équateur',
  '22': 'Tshuapa',
  '23': 'Tanganyika',
  '24': 'Haut-Lomami',
  '25': 'Lualaba',
  '26': 'Haut-Katanga',
};

/**
 * Extract license plate number from text (RDC format)
 * Supporte plusieurs formats:
 * - XX-XXXX-XX (e.g., BE-6401-01)
 * - XXXXXX XX (e.g., 1234AB 10)
 * - XX XXXX XX (e.g., BE 6401 01)
 */
const extractPlateNumber = (text: string): { plate: string | null; province: string | null } => {
  // Nettoyer le texte: enlever les retours à la ligne et espaces multiples
  const cleanText = text.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
  
  // Pattern 1: Format standard - 2 lettres - 4 chiffres - 2 chiffres (BE-6401-01 ou BE 6401 01)
  const pattern1 = /\b([A-Z]{2})[-\s]?(\d{4})[-\s]?(\d{2})\b/gi;
  
  // Pattern 2: Format alternatif - 4 chiffres + 2 lettres + espace + 2 chiffres (1234AB 10)
  const pattern2 = /\b(\d{4})([A-Z]{2})[\s-]?(\d{2})\b/gi;
  
  // Pattern 3: Format mixte - 2-3 chiffres + 2 lettres + espace + 2 chiffres (123AB 10)
  const pattern3 = /\b(\d{2,4})([A-Z]{2})[\s-]?(\d{2})\b/gi;
  
  // Pattern 4: Format avec lettres au milieu - chiffres + lettres + chiffres (0058AA19)
  const pattern4 = /\b(\d{2,4})([A-Z]{2})(\d{2})\b/gi;

  // Essayer tous les patterns
  const patterns = [pattern1, pattern2, pattern3, pattern4];
  
  for (const pattern of patterns) {
    const matches = cleanText.match(pattern);
    
    if (matches && matches.length > 0) {
      // Prendre la première correspondance
      let plate = matches[0].toUpperCase();
      
      // Extraire le code province (toujours les 2 derniers chiffres)
      const provinceMatch = plate.match(/(\d{2})$/);
      const provinceCode = provinceMatch ? provinceMatch[1] : null;
      const province = provinceCode ? (PROVINCE_CODES[provinceCode] || null) : null;
      
      // Normaliser le format pour l'affichage
      // Garder le format original mais nettoyer les espaces multiples
      plate = plate.replace(/\s+/g, ' ').trim();
      
      console.log(`Pattern matched: ${pattern.source} -> ${plate}`);
      
      return { plate, province };
    }
  }

  return { plate: null, province: null };
};

/**
 * Extract chassis number from text
 * Format VIN standard: 17 caractères alphanumériques
 */
const extractChassisNumber = (text: string): string | null => {
  // Pattern pour numéro de châssis VIN (17 caractères)
  const vinPattern = /\b[A-HJ-NPR-Z0-9]{17}\b/gi;
  const matches = text.match(vinPattern);

  if (matches && matches.length > 0) {
    return matches[0].toUpperCase();
  }

  // Pattern alternatif pour châssis non-standard (10-17 caractères alphanumériques)
  const altPattern = /\b(?:CHASSIS|VIN|N°|NO)[:\s]*([A-Z0-9]{10,17})\b/gi;
  const altMatches = text.match(altPattern);

  if (altMatches && altMatches.length > 0) {
    return altMatches[0].replace(/(?:CHASSIS|VIN|N°|NO)[:\s]*/gi, '').toUpperCase();
  }

  return null;
};

export const extractTextFromImage = async (imageBuffer: Buffer): Promise<OCRResult> => {
  let worker;
  try {
    // Create a new worker for each extraction to avoid caching issues
    worker = await createWorker('fra+eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    // Configure Tesseract for better accuracy with license plates
    // Note: On ne limite pas trop les caractères pour capturer tous les formats possibles
    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-:°/\\ ',
    });

    const { data } = await worker.recognize(imageBuffer);
    const rawText = data.text.trim();

    console.log('Raw OCR text:', rawText);

    // Extract specific information
    const { plate, province } = extractPlateNumber(rawText);
    const chassisNumber = extractChassisNumber(rawText);

    console.log('Extracted plate:', plate);
    console.log('Extracted province:', province);
    console.log('Extracted chassis:', chassisNumber);

    return {
      text: rawText,
      confidence: data.confidence,
      plateNumber: plate,
      chassisNumber: chassisNumber,
      province: province,
      rawText: rawText,
    };
  } catch (error) {
    console.error('OCR error:', error);
    throw new Error('Failed to extract text from image');
  } finally {
    // Always terminate the worker to free resources and avoid cache
    if (worker) {
      await worker.terminate();
    }
  }
};
