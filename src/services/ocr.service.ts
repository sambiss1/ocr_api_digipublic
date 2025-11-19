import { createWorker } from 'tesseract.js';

interface OCRResult {
  text: string;
  confidence: number;
  plateNumber?: string | null;
  chassisNumber?: string | null;
  province?: string | null;
  rawText?: string;
}

interface PassportData {
  documentType: 'passport';
  documentNumber: string | null;
  surname: string | null;
  givenNames: string | null;
  nationality: string | null;
  dateOfBirth: string | null;
  placeOfBirth: string | null;
  sex: string | null;
  dateOfIssue: string | null;
  dateOfExpiry: string | null;
  issuingAuthority: string | null;
  address: string | null;
  profession: string | null;
  mrz: string | null;
  rawText: string;
  confidence: number;
}

interface IDCardData {
  documentType: 'id_card';
  documentNumber: string | null;
  surname: string | null;
  givenNames: string | null;
  dateOfBirth: string | null;
  placeOfBirth: string | null;
  sex: string | null;
  dateOfIssue: string | null;
  dateOfExpiry: string | null;
  address: string | null;
  nationality: string | null;
  rawText: string;
  confidence: number;
}

interface VoterCardData {
  documentType: 'voter_card';
  cardNumber: string | null;
  codeCI: string | null;
  nomCI: string | null;
  lastname: string | null;
  middlename: string | null;
  firstname: string | null;
  dateOfBirth: string | null;
  placeOfBirth: string | null;
  sex: string | null;
  address: string | null;
  origin: string | null;
  fatherName: string | null;
  motherName: string | null;
  placeOfIssue: string | null;
  dateOfIssue: string | null;
  photoNumber: string | null;
  rawText: string;
  confidence: number;
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

/**
 * Extract passport information from text
 */
const extractPassportData = (text: string): Omit<PassportData, 'rawText' | 'confidence' | 'documentType'> => {
  // Nettoyer le texte
  const cleanText = text.replace(/\s+/g, ' ').trim();
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  // MRZ extraction (Machine Readable Zone - lignes commençant par P<)
  let mrz = null;
  const mrzLines = lines.filter(line => line.startsWith('P<') || /^[A-Z0-9<]{44}/.test(line));
  if (mrzLines.length >= 2) {
    mrz = mrzLines.slice(0, 2).join('\n');
  } else {
    // Essayer de trouver la MRZ dans le texte brut
    const mrzPattern = /P<[A-Z]{3}[A-Z<]+<+[A-Z<]+[\s\n]+[A-Z0-9<]{44}/gi;
    const mrzMatch = text.match(mrzPattern);
    mrz = mrzMatch ? mrzMatch[0].replace(/\s+/g, '\n') : null;
  }

  // Extraire depuis MRZ si disponible (plus fiable)
  let documentNumber = null;
  let surname = null;
  let givenNames = null;
  let dateOfBirth = null;
  let sex = null;
  let dateOfExpiry = null;
  let nationality = null;

  if (mrz) {
    // Format MRZ: P<CODMULENDAS<OLIVIER<FWAMBA<<<...
    // Ligne 1: P<XXX + NOM + << + PRENOMS
    const mrzLine1Match = mrz.match(/P<([A-Z]{3})([A-Z<]+)<<([A-Z<]+)/);
    if (mrzLine1Match) {
      nationality = mrzLine1Match[1]; // COD
      surname = mrzLine1Match[2].replace(/<+$/, '').replace(/S$/, ''); // MULENDA (enlever le S final si présent)
      givenNames = mrzLine1Match[3].replace(/<+/g, ' ').trim(); // OLIVIER FWAMBA
    }

    // Ligne 2: Numéro passeport + pays + date naissance + sexe + date expiration
    // Format: OP1519301 3COD 9609174 M 2811028 110281780
    const mrzLine2Match = mrz.match(/([A-Z0-9]{9})\d?([A-Z]{3})(\d{6})(\d)([MF])(\d{6})(\d)/);
    if (mrzLine2Match) {
      documentNumber = mrzLine2Match[1]; // OP1519301
      // Date de naissance: YYMMDD (960917 = 17/09/1996)
      const dobStr = mrzLine2Match[3];
      if (dobStr.length === 6) {
        const yy = parseInt(dobStr.substring(0, 2));
        const mm = dobStr.substring(2, 4);
        const dd = dobStr.substring(4, 6);
        const yyyy = yy > 50 ? `19${yy}` : `20${yy}`;
        dateOfBirth = `${dd}/${mm}/${yyyy}`;
      }
      sex = mrzLine2Match[5]; // M ou F
      // Date d'expiration: YYMMDD (281102 = 02/11/2028)
      const expStr = mrzLine2Match[6];
      if (expStr.length === 6) {
        const yy = parseInt(expStr.substring(0, 2));
        const mm = expStr.substring(2, 4);
        const dd = expStr.substring(4, 6);
        const yyyy = yy > 50 ? `19${yy}` : `20${yy}`;
        dateOfExpiry = `${dd}/${mm}/${yyyy}`;
      }
    }
  }

  // Fallback: chercher dans le texte si MRZ n'a pas donné de résultats
  if (!documentNumber) {
    // Numéro de passeport - pattern OP suivi de 7-9 chiffres
    const passportPatterns = [
      /\b(OP\d{7,9})\b/i,
      /(?:passport|passeport|n°|no)[\s:]*([A-Z]{1,2}\d{7,9})/i,
    ];
    for (const pattern of passportPatterns) {
      const match = text.match(pattern);
      if (match) {
        documentNumber = match[1].toUpperCase();
        break;
      }
    }
  }

  if (!surname) {
    // Nom - chercher après "Nom" ou dans la structure
    const surnamePatterns = [
      /(?:Nom|Name|Surname)[\s:\/]*([A-Z]{3,})/i,
      /\b([A-Z]{5,})\b/,  // Mot en majuscules de 5+ lettres
    ];
    for (const pattern of surnamePatterns) {
      const match = text.match(pattern);
      if (match && match[1] !== 'CONGO' && match[1] !== 'REPUBLIC') {
        surname = match[1];
        break;
      }
    }
  }

  if (!givenNames) {
    // Prénoms - chercher après le nom ou "Prénom"
    const givenNamesPatterns = [
      /(?:Pr[eé]nom|Given|Postnom)[\s:\/]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
      /\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/,  // Deux mots avec majuscule initiale
    ];
    for (const pattern of givenNamesPatterns) {
      const match = text.match(pattern);
      if (match) {
        givenNames = match[1];
        break;
      }
    }
  }

  // Lieu de naissance
  let placeOfBirth = null;
  const pobPatterns = [
    /(?:Lieu|Place|Birth)[\s:\/]*([A-Z]{4,})/i,
    /\b(KINSHASA|LUBUMBASHI|GOMA|BUKAVU|MATADI|KISANGANI|KANANGA|MBUJI[- ]?MAYI)\b/i,
  ];
  for (const pattern of pobPatterns) {
    const match = text.match(pattern);
    if (match) {
      placeOfBirth = match[1].toUpperCase();
      break;
    }
  }

  // Nationalité
  if (!nationality) {
    const nationalityPatterns = [
      /(?:Nationalit[ée]|Nationality)[\s:\/]*([A-Z]{4,})/i,
      /\b(CONGOLAISE|CONGOLAIS)\b/i,
    ];
    for (const pattern of nationalityPatterns) {
      const match = text.match(pattern);
      if (match) {
        nationality = match[1].toUpperCase();
        break;
      }
    }
  }

  // Date d'émission
  let dateOfIssue = null;
  const issueDatePatterns = [
    /(?:Date\s*d[\'']?[ée]mission|Date\s*of\s*issue)[\s:\/]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i,
    /\b(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})\b/,
  ];
  for (const pattern of issueDatePatterns) {
    const matches = text.match(new RegExp(pattern.source, 'gi'));
    if (matches && matches.length > 0) {
      // Prendre la première date trouvée qui n'est pas la date d'expiration
      dateOfIssue = matches[0].replace(/[\.]/g, '/');
      break;
    }
  }

  // Autorité d'émission
  let issuingAuthority = null;
  const authorityPatterns = [
    /\b(MINAFFET|DGMIGRATION)\b/i,
    /(?:Autorit[ée]|Authority|Issuing)[\s:\/]*([A-Z]{4,})/i,
  ];
  for (const pattern of authorityPatterns) {
    const match = text.match(pattern);
    if (match) {
      issuingAuthority = match[1].toUpperCase();
      break;
    }
  }

  // Adresse - chercher après "Adresse" ou "Address"
  let address = null;
  const addressPattern = /(?:Adresse|Address)[\s:\/]*([A-Z0-9][^\n]{10,80})/i;
  const addressMatch = text.match(addressPattern);
  if (addressMatch) {
    address = addressMatch[1].trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\/°,\-]/g, '');
  }

  // Profession
  let profession = null;
  const professionPatterns = [
    /(?:Profession|Occupation)[\s:\/]*([A-Z][a-z]+)/i,
    /\b(LIBERALE|FONCTIONNAIRE|COMMERCANT|ETUDIANT)\b/i,
  ];
  for (const pattern of professionPatterns) {
    const match = text.match(pattern);
    if (match && match[1].length > 2) {
      profession = match[1].toUpperCase();
      break;
    }
  }

  return {
    documentNumber,
    surname,
    givenNames,
    nationality,
    dateOfBirth,
    placeOfBirth,
    sex,
    dateOfIssue,
    dateOfExpiry,
    issuingAuthority,
    address,
    profession,
    mrz,
  };
};

/**
 * Extract voter card information from text
 */
const extractVoterCardData = (text: string): Omit<VoterCardData, 'rawText' | 'confidence' | 'documentType'> => {
  // Numéro de carte (généralement en jaune, format long)
  const cardNumberPattern = /(\d{10,})/;
  const cardMatch = text.match(cardNumberPattern);
  const cardNumber = cardMatch ? cardMatch[1] : null;

  // CODE CI
  const codeCIPattern = /CODE\s*CI[:\s]*(\d+)/i;
  const codeCIMatch = text.match(codeCIPattern);
  const codeCI = codeCIMatch ? codeCIMatch[1] : null;

  // NOM CI
  const nomCIPattern = /NOM\s*CI[:\s]*(\d+)/i;
  const nomCIMatch = text.match(nomCIPattern);
  const nomCI = nomCIMatch ? nomCIMatch[1] : null;

  // Nom
  const lastnamePattern = /Nom\s*[:\s]*([A-Z]+)/i;
  const lastnameMatch = text.match(lastnamePattern);
  const lastname = lastnameMatch ? lastnameMatch[1] : null;

  // Postnom/Prénom
  const middlenamePattern = /Postnom\s*[\/\s]*Pr[ée]nom\s*[:\s]*([A-Z\/\s]+)/i;
  const middlenameMatch = text.match(middlenamePattern);
  let middlename = null;
  let firstname = null;

  if (middlenameMatch) {
    const parts = middlenameMatch[1].split('/').map(p => p.trim());
    middlename = parts[0] || null;
    firstname = parts[1] || null;
  }

  // Date et lieu de naissance
  const dobPattern = /Date\s*[\/\s]*Lieu\s*de\s*naissance\s*[:\s]*(\d{2}\/\d{2}\/\d{4})/i;
  const dobMatch = text.match(dobPattern);
  const dateOfBirth = dobMatch ? dobMatch[1] : null;

  // Lieu de naissance (après la date)
  const pobPattern = /Date\s*[\/\s]*Lieu\s*de\s*naissance\s*[:\s]*\d{2}\/\d{2}\/\d{4}\s*([A-Z\s]+)/i;
  const pobMatch = text.match(pobPattern);
  const placeOfBirth = pobMatch ? pobMatch[1].trim() : null;

  // Sexe
  const sexPattern = /Sexe\s*[:\s]*([MF])/i;
  const sexMatch = text.match(sexPattern);
  const sex = sexMatch ? sexMatch[1] : null;

  // Adresse (peut être sur plusieurs lignes)
  const addressPattern = /Adresse\s*[:\s]*([A-Z0-9\s\/\-,]+?)(?=Origine|Nom\s*du|$)/is;
  const addressMatch = text.match(addressPattern);
  const address = addressMatch ? addressMatch[1].trim().replace(/\s+/g, ' ') : null;

  // Origine
  const originPattern = /Origine\s*[:\s]*([A-Z\s\/\-]+?)(?=Nom\s*du|Lieu\s*et|$)/is;
  const originMatch = text.match(originPattern);
  const origin = originMatch ? originMatch[1].trim().replace(/\s+/g, ' ') : null;

  // Nom du père
  const fatherPattern = /Nom\s*du\s*p[èe]re\s*[:\s]*([A-Z]+)/i;
  const fatherMatch = text.match(fatherPattern);
  const fatherName = fatherMatch ? fatherMatch[1] : null;

  // Nom de la mère
  const motherPattern = /Nom\s*de\s*la\s*m[èe]re\s*[:\s]*([A-Z]+)/i;
  const motherMatch = text.match(motherPattern);
  const motherName = motherMatch ? motherMatch[1] : null;

  // Lieu et date de délivrance
  const issueLocationPattern = /Lieu\s*et\s*date\s*de\s*d[ée]livrance\s*[:\s]*([A-Z\s]+?)\s*(\d{2}\/\d{2}\/\d{4})/i;
  const issueMatch = text.match(issueLocationPattern);
  const placeOfIssue = issueMatch ? issueMatch[1].trim() : null;
  const dateOfIssue = issueMatch ? issueMatch[2] : null;

  // Numéro photo (sous la photo)
  const photoNumberPattern = /([A-Z]\d{13,})/;
  const photoMatch = text.match(photoNumberPattern);
  const photoNumber = photoMatch ? photoMatch[1] : null;

  return {
    cardNumber,
    codeCI,
    nomCI,
    lastname,
    middlename,
    firstname,
    dateOfBirth,
    placeOfBirth,
    sex,
    address,
    origin,
    fatherName,
    motherName,
    placeOfIssue,
    dateOfIssue,
    photoNumber,
  };
};

/**
 * Extract ID card information from text
 */
const extractIDCardData = (text: string): Omit<IDCardData, 'rawText' | 'confidence' | 'documentType'> => {
  // Numéro de carte d'identité
  const idNumberPattern = /(?:N°|NO|CARTE)[\s:]*([A-Z0-9\-]+)/i;
  const idMatch = text.match(idNumberPattern);
  const documentNumber = idMatch ? idMatch[1] : null;

  // Nom
  const surnamePattern = /(?:Nom)[\s:\/]*([A-Z]+)/i;
  const surnameMatch = text.match(surnamePattern);
  const surname = surnameMatch ? surnameMatch[1] : null;

  // Prénoms
  const givenNamesPattern = /(?:Pr[eé]nom|Postnom)[\s:\/]*([A-Z]+(?:\s+[A-Z]+)?)/i;
  const givenNamesMatch = text.match(givenNamesPattern);
  const givenNames = givenNamesMatch ? givenNamesMatch[1] : null;

  // Date de naissance
  const dobPattern = /(?:N[ée]\s*le)[\s:\/]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i;
  const dobMatch = text.match(dobPattern);
  const dateOfBirth = dobMatch ? dobMatch[1] : null;

  // Lieu de naissance
  const pobPattern = /(?:[àa]\s*)([A-Z]+)/i;
  const pobMatch = text.match(pobPattern);
  const placeOfBirth = pobMatch ? pobMatch[1] : null;

  // Sexe
  const sexPattern = /(?:Sexe)[\s:\/]*([MF])/i;
  const sexMatch = text.match(sexPattern);
  const sex = sexMatch ? sexMatch[1] : null;

  // Nationalité
  const nationalityPattern = /(?:Nationalit[ée])[\s:\/]*([A-Z]+)/i;
  const nationalityMatch = text.match(nationalityPattern);
  const nationality = nationalityMatch ? nationalityMatch[1] : null;

  // Date d'émission
  const issuePattern = /(?:D[ée]livr[ée]e?\s*le)[\s:\/]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i;
  const issueMatch = text.match(issuePattern);
  const dateOfIssue = issueMatch ? issueMatch[1] : null;

  // Date d'expiration
  const expiryPattern = /(?:Valable\s*jusqu[\'']?au)[\s:\/]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i;
  const expiryMatch = text.match(expiryPattern);
  const dateOfExpiry = expiryMatch ? expiryMatch[1] : null;

  // Adresse
  const addressPattern = /(?:Adresse)[\s:\/]*([A-Z0-9\s\/,]+)/i;
  const addressMatch = text.match(addressPattern);
  const address = addressMatch ? addressMatch[1].trim() : null;

  return {
    documentNumber,
    surname,
    givenNames,
    dateOfBirth,
    placeOfBirth,
    sex,
    dateOfIssue,
    dateOfExpiry,
    address,
    nationality,
  };
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

/**
 * Extract passport information from image
 */
export const extractPassportFromImage = async (imageBuffer: Buffer): Promise<PassportData> => {
  let worker;
  try {
    worker = await createWorker('fra+eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`Passport OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    const { data } = await worker.recognize(imageBuffer);
    const rawText = data.text.trim();

    console.log('Passport Raw OCR text:', rawText);

    const extractedData = extractPassportData(rawText);

    console.log('Extracted passport data:', extractedData);

    return {
      documentType: 'passport',
      ...extractedData,
      rawText,
      confidence: data.confidence,
    };
  } catch (error) {
    console.error('Passport OCR error:', error);
    throw new Error('Failed to extract passport information');
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
};

/**
 * Extract voter card information from image
 */
export const extractVoterCardFromImage = async (imageBuffer: Buffer): Promise<VoterCardData> => {
  let worker;
  try {
    worker = await createWorker('fra+eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`Voter Card OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    const { data } = await worker.recognize(imageBuffer);
    const rawText = data.text.trim();

    console.log('Voter Card Raw OCR text:', rawText);

    const extractedData = extractVoterCardData(rawText);

    console.log('Extracted voter card data:', extractedData);

    return {
      documentType: 'voter_card',
      ...extractedData,
      rawText,
      confidence: data.confidence,
    };
  } catch (error) {
    console.error('Voter Card OCR error:', error);
    throw new Error('Failed to extract voter card information');
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
};

/**
 * Extract ID card information from image
 */
export const extractIDCardFromImage = async (imageBuffer: Buffer): Promise<IDCardData> => {
  let worker;
  try {
    worker = await createWorker('fra+eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`ID Card OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    const { data } = await worker.recognize(imageBuffer);
    const rawText = data.text.trim();

    console.log('ID Card Raw OCR text:', rawText);

    const extractedData = extractIDCardData(rawText);

    console.log('Extracted ID card data:', extractedData);

    return {
      documentType: 'id_card',
      ...extractedData,
      rawText,
      confidence: data.confidence,
    };
  } catch (error) {
    console.error('ID Card OCR error:', error);
    throw new Error('Failed to extract ID card information');
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
};
