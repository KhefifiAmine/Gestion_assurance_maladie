const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Only allow specific extensions and mimetypes
    const allowedTypes = /jpeg|jpg|png|pdf/i;
    const extMatch = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeMatch = allowedTypes.test(file.mimetype);

    if (extMatch && mimeMatch) {
        cb(null, true);
    } else {
        cb(new Error("Format de fichier non autorisé. Seuls PDF, JPG et PNG sont acceptés."), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter
});

module.exports = upload;
