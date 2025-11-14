import { Router } from 'express';
import multer from 'multer';
import {
  uploadAndExtractPassport,
  uploadAndExtractIDCard,
  uploadAndExtractVoterCard,
  extractPassportFromUrl,
  extractIDCardFromUrl,
  extractVoterCardFromUrl,
} from '../controllers/identity.controller';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  },
});

// Upload and extract passport information
router.post('/passport/upload-and-extract', upload.single('image'), uploadAndExtractPassport);

// Upload and extract ID card information
router.post('/id-card/upload-and-extract', upload.single('image'), uploadAndExtractIDCard);

// Upload and extract voter card information
router.post('/voter-card/upload-and-extract', upload.single('image'), uploadAndExtractVoterCard);

// Extract passport information from already uploaded image URL
router.post('/passport/extract', extractPassportFromUrl);

// Extract ID card information from already uploaded image URL
router.post('/id-card/extract', extractIDCardFromUrl);

// Extract voter card information from already uploaded image URL
router.post('/voter-card/extract', extractVoterCardFromUrl);

export default router;
