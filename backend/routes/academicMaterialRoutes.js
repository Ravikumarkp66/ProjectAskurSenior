const express  = require('express');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const auth     = require('../middleware/auth');
const admin    = require('../middleware/admin');
const {
    getMaterials,
    getStats,
    createMaterial,
    updateMaterial,
    deleteMaterial,
} = require('../controllers/academicMaterialController');

const router = express.Router();

// ─── Multer — disk storage for file uploads ───────────────────────────────────
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/academic-materials');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, unique + path.extname(file.originalname));
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
    fileFilter: (req, file, cb) => {
        const allowed = ['.pdf', '.zip', '.rar', '.ppt', '.pptx', '.doc', '.docx', '.xls', '.xlsx'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) cb(null, true);
        else cb(new Error(`Unsupported file type: ${ext}`));
    },
});

// ─── All routes require authentication + admin ────────────────────────────────
router.use(auth, admin);

router.get('/stats', getStats);

router.route('/')
    .get(getMaterials)
    .post(upload.single('file'), createMaterial);

router.route('/:id')
    .put(updateMaterial)
    .delete(deleteMaterial);

module.exports = router;
