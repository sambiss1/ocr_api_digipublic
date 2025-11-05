import { Router } from 'express';
import multer from 'multer';
import { uploadImage, uploadAndExtract, extractImageContent } from '../controllers/image.controller';

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

// Upload image only (without extraction)
router.post('/upload', upload.single('image'), uploadImage);

// Upload image AND extract content in one request
router.post('/upload-and-extract', upload.single('image'), uploadAndExtract);

// Extract content from already uploaded image URL
router.post('/extract', extractImageContent);


export default router;
