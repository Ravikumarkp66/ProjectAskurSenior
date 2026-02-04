const multer = require("multer");

const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB
  }
});

module.exports = { upload };
