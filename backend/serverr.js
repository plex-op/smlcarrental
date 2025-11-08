const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { Client, Databases, Storage, ID, Query, InputFile } = require("node-appwrite");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

/* ====== APPWRITE CONFIG ====== */
const APPWRITE_ENDPOINT = "https://fra.cloud.appwrite.io/v1";
const APPWRITE_PROJECT  = "68ebb809003e6a0121ab";
const APPWRITE_API_KEY  = "standard_c417344b9b41b164f6ca7e4631db18761c0445ecb61e336cb58045634f4b9a75852d1252566fa880e20c00f4cd0288fcad6d41e9ca17577a536957407b313e33b237fd10fc075a97f4cb1b4e84afe2735df306c6a562e1d6b95acfa4424a7e2d5bc559685ef806abcfedb785e4102e1fc73363b2eda3e957eb1b94160c112aee";

const DATABASE_ID   = "68ebb8ae0035c0a643c3";
const COLLECTION_ID = "cars";
const BUCKET_ID     = "690731870022fd0282bd";

/* ====== APPWRITE CLIENT ====== */
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT)
  .setKey(APPWRITE_API_KEY);

const databases = new Databases(client);
const storage   = new Storage(client);

/* ====== EXPRESS SETUP ====== */
const app  = express();
const PORT = 5001;

// MIDDLEWARE MUST COME FIRST
app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

/* ====== MULTER CONFIG ====== */
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"), false);
  },
});

/* ====== AUTH MIDDLEWARE ====== */
const JWT_SECRET = "car-dealer-key-2024";
const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No authorization header" });
    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

/* ====== HELPER FUNCTIONS ====== */
async function uploadOneToAppwrite(filePath, fileName) {
  try {
    const buffer = fs.readFileSync(filePath);
    const inputFile = InputFile.fromBuffer(buffer, fileName);
    
    const uploadedFile = await storage.createFile(BUCKET_ID, ID.unique(), inputFile);
    const viewUrl = `${APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${uploadedFile.$id}/view?project=${APPWRITE_PROJECT}`;
    
    return { 
      id: uploadedFile.$id, 
      url: viewUrl,
      name: fileName
    };
  } catch (error) {
    console.error("Upload error for file:", fileName, error);
    throw error;
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
    console.warn("Cleanup warning:", error.message);
  }
}

/* ====== BASIC ROUTES - PUT THESE FIRST ====== */
app.get("/", (req, res) => {
  res.json({ 
    message: "SML Car Rental API - WORKING VERSION", 
    timestamp: new Date().toISOString(),
    status: "ACTIVE",
    version: "1.0.0"
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
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// LOGIN ROUTE - ADD THIS
app.post("/api/login", (req, res) => {
  console.log("🔐 Login attempt received");
  const { username, password } = req.body || {};
  
  console.log("📧 Username:", username);
  console.log("🔑 Password:", password ? "***" : "missing");

  // Default credentials
  if (username === "admin" && password === "admin123") {
    const token = jwt.sign({ userId: "admin", username: "admin" }, JWT_SECRET, { expiresIn: "24h" });
    console.log("✅ Login successful for user:", username);
    
    return res.json({ 
      success: true, 
      token, 
      user: { username: "admin", role: "admin" },
      message: "Login successful" 
    });
  }
  
  console.log("❌ Login failed - invalid credentials");
  return res.status(401).json({ 
    success: false, 
    error: "Invalid credentials",
    message: "Please check your username and password" 
  });
});

// DEBUG ROUTES
app.get("/api/debug/upload-test", (req, res) => {
  console.log("✅ /api/debug/upload-test called");
  res.json({ 
    success: true, 
    message: "Upload test endpoint is working!",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/debug/routes", (req, res) => {
  const routes = [
    "GET  /",
    "GET  /api/health", 
    "POST /api/login",
    "GET  /api/cars",
    "GET  /api/cars/:id",
    "POST /api/cars",
    "PUT  /api/cars/:id",
    "DELETE /api/cars/:id",
    "POST /api/upload-multiple",
    "POST /api/upload",
    "GET  /api/debug/routes",
    "GET  /api/debug/upload-test",
    "POST /api/test-upload"
  ];
  res.json({ success: true, routes, timestamp: new Date().toISOString() });
});

// Test upload endpoint (no auth required for testing)
app.post("/api/test-upload", upload.array("images", 2), async (req, res) => {
  console.log("🧪 Test upload endpoint called");
  
  if (!req.files || req.files.length === 0) {
    return res.json({ 
      success: true, 
      message: "Test endpoint works, but no files received",
      receivedFiles: 0
    });
  }

  try {
    const fileInfo = req.files.map(f => ({
      name: f.originalname,
      size: f.size,
      type: f.mimetype
    }));

    cleanupFiles(req.files);
    
    res.json({
      success: true,
      message: "Test upload successful",
      receivedFiles: req.files.length,
      files: fileInfo
    });
  } catch (error) {
    cleanupFiles(req.files);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/* ====== CARS CRUD ROUTES ====== */
app.get("/api/cars", async (req, res) => {
  try {
    const result = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.limit(100),
      Query.orderDesc("$createdAt"),
    ]);
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
    if (missing.length) {
      return res.status(400).json({ success: false, error: `Missing fields: ${missing.join(", ")}` });
    }

    const images = Array.isArray(req.body.images) ? req.body.images : [];
    const carData = {
      brand: req.body.brand,
      model: req.body.model,
      year: parseInt(req.body.year),
      price: parseFloat(req.body.price),
      fuelType: req.body.fuelType,
      imageUrl: images[0] || req.body.imageUrl,
      images,
      mileage: req.body.mileage ? parseInt(req.body.mileage) : 0,
      color: req.body.color || "White",
      transmission: req.body.transmission || "Manual",
      owners: req.body.owners || "1st Owner",
      type: req.body.type || "Sedan",
      seatingCapacity: req.body.seatingCapacity ? parseInt(req.body.seatingCapacity) : 5,
      location: req.body.location || "Main Branch",
      available: req.body.available !== undefined ? req.body.available : true,
      features: Array.isArray(req.body.features)
        ? req.body.features
        : (typeof req.body.features === "string"
            ? req.body.features.split(",").map(s => s.trim()).filter(Boolean)
            : []),
    };

    const result = await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), carData);
    res.json({ success: true, data: result, message: "Car created successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put("/api/cars/:id", requireAuth, async (req, res) => {
  try {
    const updateData = {};
    const body = req.body;

    // Basic fields
    if (body.brand !== undefined) updateData.brand = body.brand;
    if (body.model !== undefined) updateData.model = body.model;
    if (body.year !== undefined) updateData.year = parseInt(body.year);
    if (body.price !== undefined) updateData.price = parseFloat(body.price);
    if (body.fuelType !== undefined) updateData.fuelType = body.fuelType;
    if (body.mileage !== undefined) updateData.mileage = parseInt(body.mileage);
    if (body.color !== undefined) updateData.color = body.color;
    if (body.transmission !== undefined) updateData.transmission = body.transmission;
    if (body.owners !== undefined) updateData.owners = body.owners;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.seatingCapacity !== undefined) updateData.seatingCapacity = parseInt(body.seatingCapacity);
    if (body.location !== undefined) updateData.location = body.location;
    if (body.available !== undefined) updateData.available = body.available;

    // Handle images
    if (body.images !== undefined) {
      const images = Array.isArray(body.images) ? body.images : [];
      updateData.images = images;
      if (images.length) updateData.imageUrl = images[0];
    }

    // Handle features
    if (body.features !== undefined) {
      updateData.features = Array.isArray(body.features)
        ? body.features
        : (typeof body.features === "string" 
            ? body.features.split(",").map(s => s.trim()).filter(Boolean) 
            : []);
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
  console.log("🎯 UPLOAD-MULTIPLE ENDPOINT HIT!");
  
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ 
      success: false, 
      error: "No files uploaded"
    });
  }

  try {
    console.log(`🔄 Processing ${req.files.length} files`);
    const uploadResults = [];
    
    for (const file of req.files) {
      try {
        const result = await uploadOneToAppwrite(file.path, file.originalname);
        uploadResults.push({
          url: result.url,
          fileId: result.id,
          name: result.name,
          success: true
        });
      } catch (fileError) {
        uploadResults.push({
          name: file.originalname,
          success: false,
          error: fileError.message
        });
      }
    }

    cleanupFiles(req.files);
    const successfulUploads = uploadResults.filter(r => r.success);
    
    res.json({
      success: true,
      files: uploadResults,
      urls: successfulUploads.map(r => r.url),
      message: `Uploaded ${successfulUploads.length} files successfully`
    });

  } catch (error) {
    cleanupFiles(req.files);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/upload", requireAuth, upload.single("image"), async (req, res) => {
  console.log("📤 Single upload endpoint hit!");
  
  if (!req.file) {
    return res.status(400).json({ success: false, error: "No file uploaded" });
  }

  try {
    const result = await uploadOneToAppwrite(req.file.path, req.file.originalname);
    cleanupFiles(req.file);

    res.json({
      success: true,
      imageUrl: result.url,
      fileId: result.id
    });
  } catch (error) {
    cleanupFiles(req.file);
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ====== ERROR HANDLERS - MUST BE LAST ====== */
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  res.status(500).json({ success: false, error: "Internal server error" });
});

app.use((req, res) => {
  console.log(`❌ 404 - ${req.method} ${req.path}`);
  res.status(404).json({ 
    success: false, 
    error: "Route not found",
    path: req.path,
    method: req.method,
    suggestion: "Check /api/debug/routes for available endpoints"
  });
});

/* ====== START SERVER ====== */
app.listen(PORT, () => {
  console.log("====================================");
  console.log("🚗 SML Car Rental API - FIXED VERSION");
  console.log("====================================");
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log("📋 Available Routes:");
  console.log("   POST /api/login");
  console.log("   GET  /api/health");
  console.log("   GET  /api/debug/routes");
  console.log("   GET  /api/debug/upload-test");
  console.log("====================================");
});