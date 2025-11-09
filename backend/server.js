const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { Client, Databases, Storage, ID, Query } = require("node-appwrite");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

/* ====== APPWRITE CONFIG ====== */
const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT;
const APPWRITE_PROJECT  = process.env.APPWRITE_PROJECT;
const APPWRITE_API_KEY  = process.env.APPWRITE_API_KEY;
const DATABASE_ID       = process.env.DATABASE_ID;
const COLLECTION_ID     = process.env.COLLECTION_ID;
const BUCKET_ID         = process.env.BUCKET_ID;

/* ====== APPWRITE CLIENT ====== */
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT)
  .setKey(APPWRITE_API_KEY);

const databases = new Databases(client);
const storage   = new Storage(client);

/* ====== EXPRESS SETUP ====== */
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

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
    console.log(`📤 Uploading file: ${fileName} from path: ${filePath}`);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Read file as buffer
    const fileBuffer = fs.readFileSync(filePath);
    console.log(`📄 File size: ${fileBuffer.length} bytes`);

    // CORRECT WAY: Create file from buffer using the proper method
    const uploadedFile = await storage.createFile(
      BUCKET_ID,
      ID.unique(),
      fileBuffer
    );
    
    // Generate the public URL for the uploaded file
    const fileUrl = `${APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${uploadedFile.$id}/view?project=${APPWRITE_PROJECT}`;
    
    console.log(`✅ File uploaded successfully: ${fileUrl}`);
    
    return { 
      id: uploadedFile.$id, 
      url: fileUrl,
      name: fileName
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
    console.warn("Cleanup warning:", error.message);
  }
}

/* ====== VALIDATION MIDDLEWARE ====== */
const validateLogin = (req, res, next) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: "Username and password are required"
    });
  }
  
  if (username.length < 3 || password.length < 6) {
    return res.status(400).json({
      success: false,
      error: "Invalid username or password format"
    });
  }
  
  next();
};

/* ====== BASIC ROUTES ====== */
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

// LOGIN ROUTE
app.post("/api/login", validateLogin, (req, res) => {
  console.log("🔐 Login attempt received");
  const { username, password } = req.body;
  
  console.log("📧 Username:", username);
  console.log("🔑 Password:", password ? "***" : "missing");

  // Default credentials
  if (username === "admin" && password === "admin123") {
    const token = jwt.sign({ 
      userId: "1", 
      username: "admin",
      role: "admin" 
    }, JWT_SECRET, { expiresIn: "24h" });
    
    console.log("✅ Login successful for user:", username);
    
    return res.json({ 
      success: true, 
      token, 
      user: { 
        id: "1",
        username: "admin", 
        role: "admin" 
      },
      message: "Login successful!" 
    });
  }
  
  console.log("❌ Login failed - invalid credentials");
  return res.status(401).json({ 
    success: false, 
    error: "Invalid credentials",
    message: "Please check your username and password" 
  });
});

// PROFILE ROUTE (Protected)
app.get("/api/profile", requireAuth, (req, res) => {
  res.json({
    success: true,
    user: req.user,
    message: "Profile retrieved successfully"
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
    // Validate required fields based on your Appwrite schema
    const requiredFields = ["brand", "model", "year", "price", "fuelType"];
    const missing = requiredFields.filter((f) => !req.body[f]);
    if (missing.length) {
      return res.status(400).json({ success: false, error: `Missing required fields: ${missing.join(", ")}` });
    }

    // Prepare car data according to your Appwrite schema
    const carData = {
      brand: req.body.brand.substring(0, 64), // Size: 64
      model: req.body.model.substring(0, 64), // Size: 64
      year: parseInt(req.body.year),
      price: parseInt(req.body.price), // Use integer as per schema
      fuelType: req.body.fuelType.substring(0, 32), // Size: 32
      imageUrl: req.body.imageUrl ? req.body.imageUrl.substring(0, 512) : "", // Required, Size: 512
      mileage: req.body.mileage ? parseInt(req.body.mileage) : 0,
      color: req.body.color ? req.body.color.substring(0, 64) : "White", // Size: 64
      transmission: req.body.transmission ? req.body.transmission.substring(0, 32) : "Manual", // Size: 32
      owners: req.body.owners ? req.body.owners.substring(0, 32) : "1st Owner", // Size: 32
      type: req.body.type ? req.body.type.substring(0, 32) : "Sedan", // Size: 32
      seatingCapacity: req.body.seatingCapacity ? parseInt(req.body.seatingCapacity) : 5,
      location: req.body.location ? req.body.location.substring(0, 128) : "Main Branch", // Size: 128
      available: req.body.available !== undefined ? Boolean(req.body.available) : true,
      features: Array.isArray(req.body.features) 
        ? req.body.features.map(f => f.substring(0, 256)) // Size: 256 each
        : (typeof req.body.features === "string" 
            ? req.body.features.split(",").map(s => s.trim().substring(0, 256)).filter(Boolean) 
            : []),
    };

    // Validate imageUrl is provided (required field)
    if (!carData.imageUrl) {
      return res.status(400).json({ 
        success: false, 
        error: "imageUrl is required according to database schema" 
      });
    }

    const result = await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), carData);
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

    // Update fields according to schema constraints
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

    // Handle features
    if (body.features !== undefined) {
      updateData.features = Array.isArray(body.features)
        ? body.features.map(f => f.substring(0, 256))
        : (typeof body.features === "string" 
            ? body.features.split(",").map(s => s.trim().substring(0, 256)).filter(Boolean) 
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
        console.log(`✅ Successfully uploaded: ${file.originalname}`);
      } catch (fileError) {
        console.error(`❌ Failed to upload ${file.originalname}:`, fileError);
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
      message: `Uploaded ${successfulUploads.length} files successfully`,
      total: successfulUploads.length
    });

  } catch (error) {
    cleanupFiles(req.files);
    console.error("💥 Upload endpoint error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
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
app.listen(PORT, '0.0.0.0', () => {
  console.log("====================================");
  console.log("🚗 SML Car Rental API - COMPATIBLE WITH APPWRITE SCHEMA");
  console.log("====================================");
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`📍 Network: http://0.0.0.0:${PORT}`);
  console.log("====================================");
  console.log("✅ Database Schema Compatible:");
  console.log("   - brand, model, year, price, fuelType: REQUIRED");
  console.log("   - imageUrl: REQUIRED (max 512 chars)");
  console.log("   - All fields respect size limits");
  console.log("====================================");
});