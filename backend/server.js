// server.js — Final fixed version
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Appwrite SDK
const { Client, Databases, Storage, ID, Query, Permission } = require("node-appwrite");

/* ====== ENV ====== */
const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT;
const APPWRITE_PROJECT = process.env.APPWRITE_PROJECT;
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;
const DATABASE_ID = process.env.DATABASE_ID;
const COLLECTION_ID = process.env.COLLECTION_ID;
const BUCKET_ID = process.env.BUCKET_ID;
const JWT_SECRET = process.env.JWT_SECRET || "car-dealer-key-2024";

if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT || !APPWRITE_API_KEY) {
  console.error("❌ Missing Appwrite env vars. Check .env");
  process.exit(1);
}

/* ====== Appwrite client ====== */
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT)
  .setKey(APPWRITE_API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);

/* ====== Express setup ====== */
const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

/* ====== Multer (temp uploads) ====== */
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

/* ====== Auth middleware ====== */
const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ success: false, error: "No authorization header" });
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: "Invalid token" });
  }
};

/* ====== Helpers ====== */
async function uploadOneToAppwrite(filePath, fileName) {
  if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);

  // createReadStream is compatible with node-appwrite storage.createFile
  const stream = fs.createReadStream(filePath);

  // upload to Appwrite
  const uploaded = await storage.createFile(BUCKET_ID, ID.unique(), stream);

  const fileUrl = `${APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${uploaded.$id}/view?project=${APPWRITE_PROJECT}`;

  return { id: uploaded.$id, url: fileUrl, name: fileName };
}

function cleanupFiles(files) {
  try {
    const arr = Array.isArray(files) ? files : [files];
    arr.forEach((f) => {
      if (!f) return;
      const p = f.path || f;
      if (p && fs.existsSync(p)) fs.unlinkSync(p);
    });
  } catch (err) {
    console.warn("Cleanup warning:", err.message || err);
  }
}

/* ====== Basic routes ====== */
app.get("/", (req, res) => {
  res.json({ message: "🚗 SML Car Rental API - ACTIVE", time: new Date().toISOString() });
});

/* ====== Health ====== */
app.get("/api/health", async (req, res) => {
  try {
    const dbCheck = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [Query.limit(1)]);
    const storageCheck = await storage.listFiles(BUCKET_ID, [Query.limit(1)]);
    res.json({
      success: true,
      database: { ok: true, docs: dbCheck.total },
      storage: { ok: true, files: storageCheck.total },
      time: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ====== Auth & debug ====== */
app.post("/api/login", (req, res) => {
  const { username, password } = req.body || {};
  if (username === "admin" && password === "admin123") {
    const token = jwt.sign({ userId: "1", username: "admin", role: "admin" }, JWT_SECRET, { expiresIn: "24h" });
    return res.json({ success: true, token, user: { username: "admin" } });
  }
  res.status(401).json({ success: false, error: "Invalid credentials" });
});

app.get("/api/profile", requireAuth, (req, res) => {
  res.json({ success: true, user: req.user });
});

app.get("/api/debug/routes", (req, res) => {
  res.json({
    success: true,
    routes: [
      "GET /",
      "GET /api/health",
      "POST /api/login",
      "GET /api/profile",
      "GET /api/cars",
      "POST /api/cars",
      "PUT /api/cars/:id",
      "DELETE /api/cars/:id",
      "POST /api/upload",
      "POST /api/upload-multiple",
    ],
  });
});

/* ====== Cars CRUD ====== */
app.get("/api/cars", async (req, res) => {
  try {
    const result = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [Query.orderDesc("$createdAt"), Query.limit(100)]);
    res.json({ success: true, data: result.documents, total: result.total });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/cars/:id", async (req, res) => {
  try {
    const car = await databases.getDocument(DATABASE_ID, COLLECTION_ID, req.params.id);
    res.json({ success: true, data: car });
  } catch (err) {
    res.status(404).json({ success: false, error: "Car not found" });
  }
});

app.post("/api/cars", requireAuth, async (req, res) => {
  try {
    const { brand, model, year, price, fuelType, imageUrl, images } = req.body || {};

    // Minimal required validation (mirror Appwrite schema)
    if (!brand || !model || !year || !price || !fuelType || !imageUrl) {
      return res.status(400).json({ success: false, error: "Missing required fields (brand, model, year, price, fuelType, imageUrl)" });
    }

    const carData = {
      brand: String(brand).substring(0, 64),
      model: String(model).substring(0, 64),
      year: parseInt(year, 10),
      price: parseInt(price, 10),
      fuelType: String(fuelType).substring(0, 32),
      imageUrl: String(imageUrl).substring(0, 512),
      images: Array.isArray(images) ? images.map(i => String(i).substring(0, 512)) : [],
      available: true,
      // createdAt: new Date().toISOString(),
    };

    // Create document with public read (safe). Do NOT pass invalid permission strings.
    const result = await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), carData, [Permission.read("any")]);

    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Create car error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put("/api/cars/:id", requireAuth, async (req, res) => {
  try {
    // apply only allowed fields & constraints as needed
    const updates = {};
    const body = req.body || {};

    if (body.brand !== undefined) updates.brand = String(body.brand).substring(0, 64);
    if (body.model !== undefined) updates.model = String(body.model).substring(0, 64);
    if (body.year !== undefined) updates.year = parseInt(body.year, 10);
    if (body.price !== undefined) updates.price = parseInt(body.price, 10);
    if (body.fuelType !== undefined) updates.fuelType = String(body.fuelType).substring(0, 32);
    if (body.imageUrl !== undefined) updates.imageUrl = String(body.imageUrl).substring(0, 512);
    if (body.images !== undefined) updates.images = Array.isArray(body.images) ? body.images.map(i => String(i).substring(0,512)) : [];
    if (body.available !== undefined) updates.available = Boolean(body.available);

    const result = await databases.updateDocument(DATABASE_ID, COLLECTION_ID, req.params.id, updates);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete("/api/cars/:id", requireAuth, async (req, res) => {
  try {
    await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, req.params.id);
    res.json({ success: true, message: "Car deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ====== Upload routes ====== */
app.post("/api/upload", requireAuth, upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: "No file uploaded" });

  try {
    const uploaded = await uploadOneToAppwrite(req.file.path, req.file.originalname);
    cleanupFiles(req.file);
    res.json({ success: true, imageUrl: uploaded.url, id: uploaded.id });
  } catch (err) {
    cleanupFiles(req.file);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/upload-multiple", requireAuth, upload.array("images", 10), async (req, res) => {
  if (!req.files || req.files.length === 0) return res.status(400).json({ success: false, error: "No files uploaded" });

  try {
    const results = [];
    for (const f of req.files) {
      try {
        const upl = await uploadOneToAppwrite(f.path, f.originalname);
        results.push({ success: true, id: upl.id, url: upl.url, name: upl.name });
      } catch (e) {
        results.push({ success: false, name: f.originalname, error: e.message });
      }
    }
    cleanupFiles(req.files);
    res.json({ success: true, total: results.length, files: results });
  } catch (err) {
    cleanupFiles(req.files);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ====== Error / 404 handlers ====== */
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, error: "Internal server error" });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: "Route not found", path: req.path });
});

/* ====== Start server ====== */
app.listen(PORT, "0.0.0.0", () => {
  console.log("====================================");
  console.log("🚗 SML Car Rental API Ready");
  console.log(`🌐 Listening on: http://localhost:${PORT}`);
  console.log("====================================");
});
