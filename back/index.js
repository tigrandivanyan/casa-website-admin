import express from "express";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import multer from "multer";
import cors from "cors";
import { exec } from "child_process";

dotenv.config();

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JSON_FILE_PATH = process.env.JSON_FILE_PATH;
const IMAGE_UPLOAD_DIR = process.env.IMAGE_UPLOAD_DIR;
const DOCKER_DIR = process.env.DOCKER_DIR; // Add this to .env

app.use(express.json());
app.use(cors({ origin: "*" }));

// Ensure upload directory exists
if (!fs.existsSync(IMAGE_UPLOAD_DIR)) {
    fs.mkdirSync(IMAGE_UPLOAD_DIR, { recursive: true });
}

// storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, IMAGE_UPLOAD_DIR); // make sure this folder exists
    },
    filename: (req, file, cb) => {
        // sanitize name from frontend or fallback
        let name = req.body.name || file.originalname;
        name = name.replace(/[^a-zA-Z0-9]/g, ""); // keep only alphanumerics and dot

        const ext = path.extname(name);
        const base = path.basename(name, ext);

        // add suffix if file exists
        let finalName = name;
        let counter = 1;
        while (fs.existsSync(path.join(IMAGE_UPLOAD_DIR, finalName))) {
            finalName = `${base}_${counter}${ext}`;
            counter++;
        }

        cb(null, finalName);
    },
});

const upload = multer({ storage });

// Route 1: GET /read
app.get("/api/read", (req, res) => {
    fs.readFile(JSON_FILE_PATH, "utf-8", (err, data) => {
        if (err) return res.status(500).json({ error: "Could not read JSON file" });
        res.json(JSON.parse(data));
    });
});

// Route 2: POST /rewrite
app.post("/api/rewrite", (req, res) => {
    const newJson = req.body;
    fs.writeFile(JSON_FILE_PATH, JSON.stringify(newJson, null, 2), "utf-8", (err) => {
        if (err) return res.status(500).json({ error: "Could not write JSON file" });

        // After rewriting JSON, run docker-compose down && up
        if (DOCKER_DIR) {
            const cmd = `cd ${DOCKER_DIR} && docker-compose down && docker-compose up -d --build`;
            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Docker error: ${error.message}`);
                    return res.status(500).json({
                        message: "JSON updated, but Docker failed",
                        error: error.message,
                        stderr,
                    });
                }
                if (stderr) console.error(`Docker stderr: ${stderr}`);
                res.json({
                    message: "JSON file updated and Docker Compose executed successfully",
                    dockerOutput: stdout,
                });
            });
        } else {
            res.json({ message: "JSON file updated successfully, but no DOCKER_DIR set" });
        }
    });
});

// Route 3: POST /image
app.post("/api/image", upload.single("image"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No image uploaded" });
    res.json({ message: "Image uploaded successfully", filename: req.file.filename });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
