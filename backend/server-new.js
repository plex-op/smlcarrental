const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Test route to verify server is working
app.get("/", (req, res) => {
  res.json({ 
    message: "SML Car Rental API - FRESH SERVER", 
    timestamp: new Date().toISOString(),
    status: "RUNNING"
  });
});

// Debug routes - SIMPLE VERSION
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
    "GET  /api/debug/upload-test",
    "GET  /api/debug/routes"
  ];
  res.json({ success: true, routes });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ 
    success: true, 
    message: "Server is healthy",
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: "Route not found",
    path: req.path,
    method: req.method
  });
});

// Start server
app.listen(PORT, () => {
  console.log("====================================");
  console.log("🆕 FRESH SERVER STARTED");
  console.log("====================================");
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log("📋 Available Routes:");
  console.log("   GET  /");
  console.log("   GET  /api/health");
  console.log("   GET  /api/debug/upload-test");
  console.log("   GET  /api/debug/routes");
  console.log("====================================");
});