const jwt = require("jsonwebtoken");

// In a real app, store this in environment variables
const JWT_SECRET = "your-super-secret-jwt-key-change-this-in-production";

// Mock admin user (in production, use a database)
const adminUser = {
  id: 1,
  username: "admin",
};

const generateToken = (user) => {
  return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: "24h",
  });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

const authenticate = async (username, password) => {
  // Simple authentication for demo
  // In real app, use proper password hashing and database lookup
  if (username !== "admin" || password !== "admin123") {
    return null;
  }

  return {
    id: adminUser.id,
    username: adminUser.username,
  };
};

module.exports = {
  generateToken,
  verifyToken,
  authenticate,
};
