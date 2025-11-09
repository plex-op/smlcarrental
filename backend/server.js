// server.js (fixed)

// Load environment variables first
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const {
  Client,
  Databases,
  Storage,
  ID,
  Query,
  InputFile, // used for file uploads
} = require("node-appwrite");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

/* ====== APPWRITE CONFIG (from env) ====== */
const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT;
const APPWRITE_PROJECT = process.env.APPWRITE_PROJECT;
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;
const DATABASE_ID = process.env.DATABASE_ID;
const COLLECTION_ID = process.env.COLLECTION_ID;
const BUCKET_ID = process.env.BUCKET_ID;

/* ====== EXPRESS SETUP ====== */
const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

/* ====== APPWRITE CLIENT ====== */
if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT || !APPWRITE_API_KEY) {
  console.error("❌ Missing Appwrite environment variables. Check .env or Railway variables.");
  process.exit(1);
}

const client = new Client();
client
  .setEndpoint(APPWRITE_ENDPOINT) // must start with http/https
  .setProject(APPWRITE_PROJECT)
  .setKey(APPWRITE_API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);

/* ====== MULTER CONFIG ====== */
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"), false);
  },
});

/* ====== AUTH MIDDLEWARE ====== */
const JWT_SECRET = process.env.JWT_SECRET || "car-dealer-key-2024";
const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No authorization header" });
    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

/* ====== HELPER FUNCTIONS ====== */
async function uploadOneToAppwrite(filePath, fileName) {
  try {
    if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);

    // Use InputFile.fromPath to create a proper file payload for node-appwrite
    const input = InputFile.fromPath(filePath, fileName);

    const uploadedFile = await storage.createFile(BUCKET_ID, ID.unique(), input);

    const fileUrl = `${APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${uploadedFile.$id}/view?project=${APPWRITE_PROJECT}`;

    return {
      id: uploadedFile.$id,
      url: fileUrl,
      name: fileName,
    };
  } catch (error) {
    console.error("❌ Upload error for file:", fileName, error);
    throw new Error(`Upload failed: ${error.message}`);
  }
}

function cleanupFiles(files) {
  try {
    (Array.isArray(files) ? files : [files]).forEach((file) => {
      if (file?.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    });
  } catch (error) {
    console.warn("Cleanup warning:", error?.message || error);
  }
}

/* ====== BASIC ROUTES ====== */
app.get("/", (req, res) => {
  res.json({
    message: "SML Car Rental API - WORKING VERSION",
    timestamp: new Date().toISOString(),
    status: "ACTIVE",
    version: "1.0.0",
  });
});

// HEALTH CHECK
app.get("/api/health", async (req, res) => {
  try {
    const dbResult = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [Query.limit(1)]);
    const storageResult = await storage.listFiles(BUCKET_ID, [Query.limit(1)]);
    res.json({
      success: true,
      message: "API is healthy",
      database: { connected: true, documents: dbResult.total },
      storage: { connected: true, files: storageResult.total },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ====== AUTH & DEBUG ROUTES ====== */
const validateLogin = (req, res, next) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ success: false, error: "Username and password are required" });
  if (username.length < 3 || password.length < 6) return res.status(400).json({ success: false, error: "Invalid username or password format" });
  next();
};

app.post("/api/login", validateLogin, (req, res) => {
  const { username, password } = req.body;
  if (username === "admin" && password === "admin123") {
    const token = jwt.sign({ userId: "1", username: "admin", role: "admin" }, JWT_SECRET, { expiresIn: "24h" });
    return res.json({ success: true, token, user: { id: "1", username: "admin", role: "admin" }, message: "Login successful!" });
  }
  return res.status(401).json({ success: false, error: "Invalid credentials", message: "Please check your username and password" });
});

app.get("/api/profile", requireAuth, (req, res) => {
  res.json({ success: true, user: req.user, message: "Profile retrieved successfully" });
});

app.get("/api/debug/routes", (req, res) => {
  const routes = [
    "GET  /",
    "GET  /api/health",
    "POST /api/login",
    "GET  /api/profile",
    "GET  /api/cars",
    "GET  /api/cars/:id",
    "POST /api/cars",
    "PUT  /api/cars/:id",
    "DELETE /api/cars/:id",
    "POST /api/upload-multiple",
    "POST /api/upload",
    "GET  /api/debug/routes",
    "GET  /api/debug/upload-test",
    "POST /api/test-upload",
  ];
  res.json({ success: true, routes, timestamp: new Date().toISOString() });
});

app.get("/api/debug/upload-test", (req, res) => {
  res.json({ success: true, message: "Upload test endpoint is working!", timestamp: new Date().toISOString() });
});

/* ====== TEST UPLOAD (no auth) ====== */
app.post("/api/test-upload", upload.array("images", 2), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.json({ success: true, message: "Test endpoint works, but no files received", receivedFiles: 0 });
  }
  try {
    const fileInfo = req.files.map((f) => ({ name: f.originalname, size: f.size, type: f.mimetype }));
    cleanupFiles(req.files);
    res.json({ success: true, message: "Test upload successful", receivedFiles: req.files.length, files: fileInfo });
  } catch (error) {
    cleanupFiles(req.files);
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ====== CARS CRUD ROUTES ====== */
app.get("/api/cars", async (req, res) => {
  try {
    const result = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [Query.limit(100), Query.orderDesc("$createdAt")]);
    res.json({ success: true, data: result.documents, total: result.total });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/cars/:id", async (req, res) => {
  try {
    const car = await databases.getDocument(DATABASE_ID, COLLECTION_ID, req.params.id);
    res.json({ success: true, data: car });
  } catch (error) {
    res.status(404).json({ success: false, error: "Car not found" });
  }
});

app.post("/api/cars", requireAuth, async (req, res) => {
  try {
    const requiredFields = ["brand", "model", "year", "price", "fuelType"];
    const missing = requiredFields.filter((f) => !req.body[f]);
    if (missing.length) return res.status(400).json({ success: false, error: `Missing required fields: ${missing.join(", ")}` });

    const carData = {
      brand: req.body.brand.substring(0, 64),
      model: req.body.model.substring(0, 64),
      year: parseInt(req.body.year),
      price: parseInt(req.body.price),
      fuelType: req.body.fuelType.substring(0, 32),
      imageUrl: req.body.imageUrl ? req.body.imageUrl.substring(0, 512) : "",
      mileage: req.body.mileage ? parseInt(req.body.mileage) : 0,
      color: req.body.color ? req.body.color.substring(0, 64) : "White",
      transmission: req.body.transmission ? req.body.transmission.substring(0, 32) : "Manual",
      owners: req.body.owners ? req.body.owners.substring(0, 32) : "1st Owner",
      type: req.body.type ? req.body.type.substring(0, 32) : "Sedan",
      seatingCapacity: req.body.seatingCapacity ? parseInt(req.body.seatingCapacity) : 5,
      location: req.body.location ? req.body.location.substring(0, 128) : "Main Branch",
      available: req.body.available !== undefined ? Boolean(req.body.available) : true,
      features: Array.isArray(req.body.features)
        ? req.body.features.map((f) => f.substring(0, 256))
        : typeof req.body.features === "string"
        ? req.body.features.split(",").map((s) => s.trim().substring(0, 256)).filter(Boolean)
        : [],
      images: Array.isArray(req.body.images) ? req.body.images.map((i) => i.substring(0, 512)) : [],
    };

    if (!carData.imageUrl) return res.status(400).json({ success: false, error: "imageUrl is required according to database schema" });

    const result = await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), carData, ["any"]); // make doc public read
    res.json({ success: true, data: result, message: "Car created successfully" });
  } catch (error) {
    console.error("❌ Create car error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put("/api/cars/:id", requireAuth, async (req, res) => {
  try {
    const updateData = {};
    const body = req.body;
    if (body.brand !== undefined) updateData.brand = body.brand.substring(0, 64);
    if (body.model !== undefined) updateData.model = body.model.substring(0, 64);
    if (body.year !== undefined) updateData.year = parseInt(body.year);
    if (body.price !== undefined) updateData.price = parseInt(body.price);
    if (body.fuelType !== undefined) updateData.fuelType = body.fuelType.substring(0, 32);
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl.substring(0, 512);
    if (body.mileage !== undefined) updateData.mileage = parseInt(body.mileage);
    if (body.color !== undefined) updateData.color = body.color.substring(0, 64);
    if (body.transmission !== undefined) updateData.transmission = body.transmission.substring(0, 32);
    if (body.owners !== undefined) updateData.owners = body.owners.substring(0, 32);
    if (body.type !== undefined) updateData.type = body.type.substring(0, 32);
    if (body.seatingCapacity !== undefined) updateData.seatingCapacity = parseInt(body.seatingCapacity);
    if (body.location !== undefined) updateData.location = body.location.substring(0, 128);
    if (body.available !== undefined) updateData.available = Boolean(body.available);
    if (body.features !== undefined) {
      updateData.features = Array.isArray(body.features)
        ? body.features.map((f) => f.substring(0, 256))
        : typeof body.features === "string"
        ? body.features.split(",").map((s) => s.trim().substring(0, 256)).filter(Boolean)
        : [];
    }

    const result = await databases.updateDocument(DATABASE_ID, COLLECTION_ID, req.params.id, updateData);
    res.json({ success: true, data: result, message: "Car updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete("/api/cars/:id", requireAuth, async (req, res) => {
  try {
    await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, req.params.id);
    res.json({ success: true, message: "Car deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ====== UPLOAD ROUTES ====== */
app.post("/api/upload-multiple", requireAuth, upload.array("images", 10), async (req, res) => {
  if (!req.files || req.files.length === 0) return res.status(400).json({ success: false, error: "No files uploaded" });

  try {
    const uploadResults = [];
    for (const file of req.files) {
      try {
        const result = await uploadOneToAppwrite(file.path, file.originalname);
        uploadResults.push({ url: result.url, fileId: result.id, name: result.name, success: true });
      } catch (fileError) {
        uploadResults.push({ name: file.originalname, success: false, error: fileError.message });
      }
    }
    cleanupFiles(req.files);
    const successfulUploads = uploadResults.filter((r) => r.success);
    res.json({ success: true, files: uploadResults, urls: successfulUploads.map((r) => r.url), message: `Uploaded ${successfulUploads.length} files successfully`, total: successfulUploads.length });
  } catch (error) {
    cleanupFiles(req.files);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/upload", requireAuth, upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: "No file uploaded" });
  try {
    const result = await uploadOneToAppwrite(req.file.path, req.file.originalname);
    cleanupFiles(req.file);
    res.json({ success: true, imageUrl: result.url, fileId: result.id });
  } catch (error) {
    cleanupFiles(req.file);
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ====== ERROR HANDLER (must be before final 404) ====== */
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  res.status(500).json({ success: false, error: "Internal server error" });
});

/* ====== SERVE FRONTEND (if present) ====== */
const frontendPath = path.join(__dirname, "../frontend/build");
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
  // Serve index.html for client-side routes except API routes
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(frontendPath, "index.html"));
  });
}

/* ====== FINAL 404 FOR API ROUTES ====== */
app.use((req, res) => {
  console.log(`❌ 404 - ${req.method} ${req.path}`);
  res.status(404).json({ success: false, error: "Route not found", path: req.path, method: req.method, suggestion: "Check /api/debug/routes for available endpoints" });
});

/* ====== START SERVER ====== */
app.listen(PORT, "0.0.0.0", () => {
  console.log("====================================");
  console.log("🚗 SML Car Rental API - COMPATIBLE WITH APPWRITE SCHEMA");
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`📍 Network: http://0.0.0.0:${PORT}`);
  console.log("====================================");
});
