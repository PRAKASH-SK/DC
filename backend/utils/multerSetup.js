const multer = require("multer");
const fs = require("fs");

// Ensure upload folder exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
    console.log(`Created folder: ${uploadDir}`);
}

// Multer config - keeps original filename
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

module.exports = upload;