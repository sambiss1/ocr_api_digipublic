import { Request, Response } from 'express';
import { createHash } from 'crypto';
import { uploadToCloudflare } from '../services/cloudflare.service';
import { extractTextFromImage } from '../services/ocr.service';

// Upload image only (without extraction)
export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Upload to Cloudflare R2
    const cloudflareUrl = await uploadToCloudflare(req.file);

    res.json({
      success: true,
      data: {
        imageUrl: cloudflareUrl,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Failed to upload image',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Upload image AND extract content in one request
export const uploadAndExtract = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const requestId = Date.now();
    const bufferHash = createHash('md5').update(req.file.buffer).digest('hex').substring(0, 8);
    console.log(`[${requestId}] Processing new image: ${req.file.originalname} (${req.file.size} bytes, hash: ${bufferHash})`);

    // Upload to Cloudflare R2
    const cloudflareUrl = await uploadToCloudflare(req.file);
    console.log(`[${requestId}] Image uploaded: ${cloudflareUrl}`);

    // Extract text content from image
    console.log(`[${requestId}] Starting OCR extraction...`);
    const extractedContent = await extractTextFromImage(req.file.buffer);
    console.log(`[${requestId}] OCR completed: "${extractedContent.text.substring(0, 50)}..." (confidence: ${extractedContent.confidence}%)`);
    
    if (extractedContent.plateNumber) {
      console.log(`[${requestId}] ✅ Plaque détectée: ${extractedContent.plateNumber} (${extractedContent.province || 'Province inconnue'})`);
    }
    if (extractedContent.chassisNumber) {
      console.log(`[${requestId}] ✅ Châssis détecté: ${extractedContent.chassisNumber}`);
    }

    const response = {
      success: true,
      data: {
        imageUrl: cloudflareUrl,
        extractedContent: {
          rawText: extractedContent.rawText,
          confidence: extractedContent.confidence,
          plateNumber: extractedContent.plateNumber,
          province: extractedContent.province,
          chassisNumber: extractedContent.chassisNumber,
        },
      },
      requestId, // Add unique ID to track responses
    };

    console.log(`[${requestId}] Sending response:`, JSON.stringify(response).substring(0, 300));
    res.json(response);
  } catch (error) {
    console.error('Upload and extract error:', error);
    res.status(500).json({
      error: 'Failed to process image',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const extractImageContent = async (req: Request, res: Response) => {
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

    // Extract text content
    const extractedContent = await extractTextFromImage(buffer);

    res.json({
      success: true,
      data: {
        extractedContent: {
          text: extractedContent.text,
          confidence: extractedContent.confidence,
        },
      },
    });
  } catch (error) {
    console.error('Extraction error:', error);
    res.status(500).json({
      error: 'Failed to extract content',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
