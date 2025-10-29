import express from "express";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import multer from "multer";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JSON_FILE_PATH = process.env.JSON_FILE_PATH;
const IMAGE_UPLOAD_DIR = process.env.IMAGE_UPLOAD_DIR;

app.use(express.json());

// Ensure upload directory exists
if (!fs.existsSync(IMAGE_UPLOAD_DIR)) {
    fs.mkdirSync(IMAGE_UPLOAD_DIR, { recursive: true });
}

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, IMAGE_UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const name = req.body.name || file.originalname;
        cb(null, name);
    },
});
const upload = multer({ storage });

// Route 1: GET /read
app.get("/read", (req, res) => {
    fs.readFile(JSON_FILE_PATH, "utf-8", (err, data) => {
        if (err) return res.status(500).json({ error: "Could not read JSON file" });
        res.json(JSON.parse(data));
    });
});

// Route 2: POST /rewrite
app.post("/rewrite", (req, res) => {
    const newJson = req.body;
    fs.writeFile(JSON_FILE_PATH, JSON.stringify(newJson, null, 2), "utf-8", (err) => {
        if (err) return res.status(500).json({ error: "Could not write JSON file" });
        res.json({ message: "JSON file updated successfully" });
    });
});

// Route 3: POST /image
app.post("/image", upload.single("image"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No image uploaded" });
    res.json({ message: "Image uploaded successfully", filename: req.file.filename });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
