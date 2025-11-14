import { Request, Response } from 'express';
import { createHash } from 'crypto';
import { uploadToCloudflare } from '../services/cloudflare.service';
import { extractPassportFromImage, extractIDCardFromImage, extractVoterCardFromImage } from '../services/ocr.service';

/**
 * Upload and extract passport information
 */
export const uploadAndExtractPassport = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const requestId = Date.now();
    const bufferHash = createHash('md5').update(req.file.buffer).digest('hex').substring(0, 8);
    console.log(`[${requestId}] Processing passport: ${req.file.originalname} (${req.file.size} bytes, hash: ${bufferHash})`);

    // Upload to Cloudflare R2
    const cloudflareUrl = await uploadToCloudflare(req.file);
    console.log(`[${requestId}] Passport image uploaded: ${cloudflareUrl}`);

    // Extract passport information
    console.log(`[${requestId}] Starting passport OCR extraction...`);
    const passportData = await extractPassportFromImage(req.file.buffer);
    console.log(`[${requestId}] Passport OCR completed (confidence: ${passportData.confidence}%)`);

    const response = {
      success: true,
      data: {
        imageUrl: cloudflareUrl,
        passportData: {
          documentType: passportData.documentType,
          documentNumber: passportData.documentNumber,
          surname: passportData.surname,
          givenNames: passportData.givenNames,
          nationality: passportData.nationality,
          dateOfBirth: passportData.dateOfBirth,
          placeOfBirth: passportData.placeOfBirth,
          sex: passportData.sex,
          dateOfIssue: passportData.dateOfIssue,
          dateOfExpiry: passportData.dateOfExpiry,
          issuingAuthority: passportData.issuingAuthority,
          address: passportData.address,
          profession: passportData.profession,
          mrz: passportData.mrz,
          confidence: passportData.confidence,
          rawText: passportData.rawText,
        },
      },
      requestId,
    };

    console.log(`[${requestId}] Sending passport response`);
    res.json(response);
  } catch (error) {
    console.error('Passport extraction error:', error);
    res.status(500).json({
      error: 'Failed to process passport',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Upload and extract ID card information
 */
export const uploadAndExtractIDCard = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const requestId = Date.now();
    const bufferHash = createHash('md5').update(req.file.buffer).digest('hex').substring(0, 8);
    console.log(`[${requestId}] Processing ID card: ${req.file.originalname} (${req.file.size} bytes, hash: ${bufferHash})`);

    // Upload to Cloudflare R2
    const cloudflareUrl = await uploadToCloudflare(req.file);
    console.log(`[${requestId}] ID card image uploaded: ${cloudflareUrl}`);

    // Extract ID card information
    console.log(`[${requestId}] Starting ID card OCR extraction...`);
    const idCardData = await extractIDCardFromImage(req.file.buffer);
    console.log(`[${requestId}] ID card OCR completed (confidence: ${idCardData.confidence}%)`);

    const response = {
      success: true,
      data: {
        imageUrl: cloudflareUrl,
        idCardData: {
          documentType: idCardData.documentType,
          documentNumber: idCardData.documentNumber,
          surname: idCardData.surname,
          givenNames: idCardData.givenNames,
          dateOfBirth: idCardData.dateOfBirth,
          placeOfBirth: idCardData.placeOfBirth,
          sex: idCardData.sex,
          dateOfIssue: idCardData.dateOfIssue,
          dateOfExpiry: idCardData.dateOfExpiry,
          address: idCardData.address,
          nationality: idCardData.nationality,
          confidence: idCardData.confidence,
          rawText: idCardData.rawText,
        },
      },
      requestId,
    };

    console.log(`[${requestId}] Sending ID card response`);
    res.json(response);
  } catch (error) {
    console.error('ID card extraction error:', error);
    res.status(500).json({
      error: 'Failed to process ID card',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Extract passport information from already uploaded image URL
 */
export const extractPassportFromUrl = async (req: Request, res: Response) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    // Fetch image from URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch image from URL');
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract passport information
    const passportData = await extractPassportFromImage(buffer);

    res.json({
      success: true,
      data: {
        passportData,
      },
    });
  } catch (error) {
    console.error('Passport extraction from URL error:', error);
    res.status(500).json({
      error: 'Failed to extract passport information',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Extract ID card information from already uploaded image URL
 */
export const extractIDCardFromUrl = async (req: Request, res: Response) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    // Fetch image from URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch image from URL');
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract ID card information
    const idCardData = await extractIDCardFromImage(buffer);

    res.json({
      success: true,
      data: {
        idCardData,
      },
    });
  } catch (error) {
    console.error('ID card extraction from URL error:', error);
    res.status(500).json({
      error: 'Failed to extract ID card information',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Upload and extract voter card information
 */
export const uploadAndExtractVoterCard = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const requestId = Date.now();
    const bufferHash = createHash('md5').update(req.file.buffer).digest('hex').substring(0, 8);
    console.log(`[${requestId}] Processing voter card: ${req.file.originalname} (${req.file.size} bytes, hash: ${bufferHash})`);

    // Upload to Cloudflare R2
    const cloudflareUrl = await uploadToCloudflare(req.file);
    console.log(`[${requestId}] Voter card image uploaded: ${cloudflareUrl}`);

    // Extract voter card information
    console.log(`[${requestId}] Starting voter card OCR extraction...`);
    const voterCardData = await extractVoterCardFromImage(req.file.buffer);
    console.log(`[${requestId}] Voter card OCR completed (confidence: ${voterCardData.confidence}%)`);

    const response = {
      success: true,
      data: {
        imageUrl: cloudflareUrl,
        voterCardData: {
          documentType: voterCardData.documentType,
          cardNumber: voterCardData.cardNumber,
          codeCI: voterCardData.codeCI,
          nomCI: voterCardData.nomCI,
          lastname: voterCardData.lastname,
          middlename: voterCardData.middlename,
          firstname: voterCardData.firstname,
          dateOfBirth: voterCardData.dateOfBirth,
          placeOfBirth: voterCardData.placeOfBirth,
          sex: voterCardData.sex,
          address: voterCardData.address,
          origin: voterCardData.origin,
          fatherName: voterCardData.fatherName,
          motherName: voterCardData.motherName,
          placeOfIssue: voterCardData.placeOfIssue,
          dateOfIssue: voterCardData.dateOfIssue,
          photoNumber: voterCardData.photoNumber,
          confidence: voterCardData.confidence,
          rawText: voterCardData.rawText,
        },
      },
      requestId,
    };

    console.log(`[${requestId}] Sending voter card response`);
    res.json(response);
  } catch (error) {
    console.error('Voter card extraction error:', error);
    res.status(500).json({
      error: 'Failed to process voter card',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Extract voter card information from already uploaded image URL
 */
export const extractVoterCardFromUrl = async (req: Request, res: Response) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    // Fetch image from URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch image from URL');
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract voter card information
    const voterCardData = await extractVoterCardFromImage(buffer);

    res.json({
      success: true,
      data: {
        voterCardData,
      },
    });
  } catch (error) {
    console.error('Voter card extraction from URL error:', error);
    res.status(500).json({
      error: 'Failed to extract voter card information',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
