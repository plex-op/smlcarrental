import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

function AdminDashboard({ onLogout }) {
  const BACKEND_URL = "http://localhost:5001/api";

  const PLACEHOLDER_CAR_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='14' fill='%236b7280'%3ECar Image%3C/text%3E%3C/svg%3E";
  const PLACEHOLDER_ERROR_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23fef2f2'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='14' fill='%23dc2626'%3EImage Error%3C/text%3E%3C/svg%3E";

  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingCar, setEditingCar] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [activeView, setActiveView] = useState("grid");

  // Multi-image state
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  
  // Lightbox state
  const [lightbox, setLightbox] = useState({ 
    open: false, 
    images: [], 
    index: 0 
  });

  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    year: "",
    price: "",
    fuelType: "Gasoline",
    imageUrl: "",
    images: [],
    mileage: "",
    color: "White",
    transmission: "Manual",
    owners: "1st Owner",
    type: "Sedan",
    seatingCapacity: "5",
    location: "Main Branch",
    available: true,
    features: "",
  });

  const navigate = useNavigate();
  const getAuthToken = () => localStorage.getItem("token");
  const getCarId = (car) => car.$id || car.id;

  // Get primary image with better fallback
  const getPrimaryImage = (car) => {
    if (Array.isArray(car.images) && car.images.length > 0) {
      return car.images[0];
    }
    if (car.imageUrl) {
      return car.imageUrl;
    }
    return PLACEHOLDER_CAR_IMAGE;
  };

  // Get all images for a car
  const getAllImages = (car) => {
    if (Array.isArray(car.images) && car.images.length > 0) {
      return car.images;
    }
    if (car.imageUrl) {
      return [car.imageUrl];
    }
    return [PLACEHOLDER_CAR_IMAGE];
  };

  const fetchCars = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      console.log("🔄 Fetching cars...");
      
      const res = await fetch(`${BACKEND_URL}/cars`);
      if (!res.ok) throw new Error(`Failed to fetch cars: ${res.status}`);
      
      const data = await res.json();
      const docs = Array.isArray(data) ? data : (data.data || data.documents || []);
      
      console.log(`✅ Loaded ${docs.length} cars`);
      setCars(docs);
    } catch (err) {
      console.error("❌ Fetch error:", err);
      setError(err.message);
      setCars([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchCars(); 
  }, [fetchCars]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    onLogout?.();
    navigate("/login");
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === "checkbox" ? checked : value 
    }));
  };

  // Multi-file selection with better validation
  const handleFilesChange = (e) => {
    const files = Array.from(e.target.files || []);
    
    // Validate files
    const validFiles = files.filter(file => {
      if (!file.type.startsWith("image/")) {
        setError(`Skipped ${file.name}: Not an image file`);
        return false;
      }
      if (file.size > 8 * 1024 * 1024) {
        setError(`Skipped ${file.name}: File too large (max 8MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0 && files.length > 0) {
      setError("No valid image files selected");
      return;
    }

    if (validFiles.length > 0) {
      setImageFiles(prev => [...prev, ...validFiles]);
      const newPreviews = validFiles.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
      setError(""); // Clear previous errors
    }
  };

  // Remove individual image
  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(imagePreviews[index]); // Clean up memory
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const required = ["brand", "model", "year", "price", "fuelType"];
    const missing = required.filter(field => !formData[field]?.toString().trim());
    
    if (missing.length) {
      throw new Error(`Missing required fields: ${missing.join(", ")}`);
    }
    
    if (formData.year && (+formData.year < 1886 || +formData.year > 2030)) {
      throw new Error("Year must be between 1886 and 2030");
    }
    
    if (formData.price && (+formData.price < 0 || +formData.price > 1000000)) {
      throw new Error("Price must be between 0 and 1,000,000");
    }
  };

  // Upload multiple images
  const uploadMultiple = async (files) => {
    console.log("=== UPLOAD DEBUG START ===");
    
    if (!files || files.length === 0) {
      console.log("❌ No files to upload");
      return [];
    }
    
    const token = getAuthToken();
    console.log("🔑 Token exists:", !!token);
    
    if (!token) {
      throw new Error("No authentication token - please login again");
    }

    // Test endpoint first
    try {
      console.log("🔍 Testing upload endpoint...");
      const testRes = await fetch(`${BACKEND_URL}/debug/upload-test`);
      const testData = await testRes.json();
      console.log("✅ Endpoint test:", testData.message);
    } catch (testError) {
      console.error("❌ Endpoint test failed:", testError);
      throw new Error(`Upload endpoint not available: ${testError.message}`);
    }

    // Create FormData
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append("images", file);
      console.log(`📎 Added file ${index + 1}: ${file.name}`);
    });

    console.log("📤 Starting upload request...");
    
    try {
      const res = await fetch(`${BACKEND_URL}/upload-multiple`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          // IMPORTANT: No Content-Type header for FormData
        },
        body: formData,
      });

      console.log("📡 Response status:", res.status);
      console.log("📡 Response OK:", res.ok);

      const result = await res.json();
      console.log("📄 Response data:", result);
      
      if (!res.ok) {
        throw new Error(result?.error || `Upload failed with status ${res.status}`);
      }
      
      if (!result?.success) {
        throw new Error(result?.error || "Upload failed - no success in response");
      }

      console.log("✅ Upload successful! URLs:", result.urls);
      console.log("=== UPLOAD DEBUG END ===");
      
      return result.urls || [];
      
    } catch (error) {
      console.error("❌ Upload failed:", error);
      console.log("=== UPLOAD DEBUG END WITH ERROR ===");
      throw error;
    }
  };

  // Test upload system function
 
const testUploadSystem = async () => {
  try {
    setError("🧪 Testing upload system...");
    console.log("=== UPLOAD SYSTEM TEST ===");
    
    // Test 1: Backend health
    console.log("1. Testing backend health...");
    const healthRes = await fetch(`${BACKEND_URL}/health`);
    const healthData = await healthRes.json();
    console.log("Health:", healthData);
    
    if (!healthRes.ok) {
      throw new Error(`Health check failed: ${healthData.error}`);
    }
    
    // Test 2: Upload endpoint
    console.log("2. Testing upload endpoint...");
    const testRes = await fetch(`${BACKEND_URL}/debug/upload-test`);
    const testData = await testRes.json();
    console.log("Upload test:", testData);
    
    if (!testRes.ok) {
      throw new Error(`Upload endpoint test failed: ${testData.error}`);
    }
    
    setError(`✅ Upload system working! Backend is connected.`);
    console.log("=== UPLOAD SYSTEM TEST COMPLETE ===");
    
  } catch (err) {
    console.error("❌ Upload system test failed:", err);
    setError(`❌ Upload test failed: ${err.message}`);
  }
};

  // Debug function to test upload endpoint
  const testUploadEndpoint = async () => {
    try {
      setError("Testing upload endpoint...");
      const token = getAuthToken();
      const res = await fetch(`${BACKEND_URL}/health`);
      const data = await res.json();
      setError(`Backend status: ${data.success ? '✅ Connected' : '❌ Failed'}`);
    } catch (err) {
      setError(`❌ Backend connection failed: ${err.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError("");
      setUploading(true);
      
      validateForm();
      const token = getAuthToken();
      if (!token) throw new Error("No authentication token found");

      // Upload new images
      let uploadedUrls = [];
      if (imageFiles.length > 0) {
        uploadedUrls = await uploadMultiple(imageFiles);
      }

      // Combine new and existing images
      const allImages = [...uploadedUrls, ...formData.images];
      
      const payload = {
        brand: formData.brand,
        model: formData.model,
        year: parseInt(formData.year),
        price: parseFloat(formData.price),
        fuelType: formData.fuelType,
        images: allImages,
        imageUrl: allImages[0] || PLACEHOLDER_CAR_IMAGE,
        mileage: formData.mileage ? parseInt(formData.mileage) : 0,
        color: formData.color,
        transmission: formData.transmission,
        owners: formData.owners,
        type: formData.type,
        seatingCapacity: formData.seatingCapacity ? parseInt(formData.seatingCapacity) : 5,
        location: formData.location,
        available: formData.available,
        features: typeof formData.features === "string" && formData.features.trim()
          ? formData.features.split(",").map(f => f.trim()).filter(Boolean)
          : [],
      };

      const url = editingCar 
        ? `${BACKEND_URL}/cars/${getCarId(editingCar)}` 
        : `${BACKEND_URL}/cars`;
      
      const method = editingCar ? "PUT" : "POST";

      console.log("📦 Sending payload:", payload);

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json().catch(() => ({}));
      
      if (!res.ok || !result?.success) {
        throw new Error(result?.error || `Failed to ${editingCar ? "update" : "create"} car`);
      }

      await fetchCars();
      setShowForm(false);
      resetForm();
      setEditingCar(null);
      setError(`✅ Car ${editingCar ? "updated" : "created"} successfully!`);
      setTimeout(() => setError(""), 3000);
      
    } catch (err) {
      console.error("❌ Submit error:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      brand: "",
      model: "",
      year: "",
      price: "",
      fuelType: "Gasoline",
      imageUrl: "",
      images: [],
      mileage: "",
      color: "White",
      transmission: "Manual",
      owners: "1st Owner",
      type: "Sedan",
      seatingCapacity: "5",
      location: "Main Branch",
      available: true,
      features: "",
    });
    setImageFiles([]);
    // Clean up object URLs to prevent memory leaks
    imagePreviews.forEach(url => URL.revokeObjectURL(url));
    setImagePreviews([]);
  };

  const handleEdit = (car) => {
    setEditingCar(car);
    setFormData({
      brand: car.brand || "",
      model: car.model || "",
      year: car.year?.toString() || "",
      price: car.price?.toString() || "",
      fuelType: car.fuelType || "Gasoline",
      imageUrl: car.imageUrl || "",
      images: Array.isArray(car.images) ? car.images : [],
      mileage: car.mileage?.toString() || "",
      color: car.color || "White",
      transmission: car.transmission || "Manual",
      owners: car.owners || "1st Owner",
      type: car.type || "Sedan",
      seatingCapacity: car.seatingCapacity?.toString() || "5",
      location: car.location || "Main Branch",
      available: car.available !== undefined ? car.available : true,
      features: Array.isArray(car.features) ? car.features.join(", ") : (car.features || ""),
    });
    setShowForm(true);
  };

  const handleDelete = async (carId) => {
    if (!window.confirm("Are you sure you want to delete this car?")) return;
    
    try {
      const token = getAuthToken();
      if (!token) throw new Error("No authentication token found");
      
      const res = await fetch(`${BACKEND_URL}/cars/${carId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await res.json().catch(() => ({}));
      
      if (!res.ok || !result?.success) {
        throw new Error(result?.error || "Delete failed");
      }

      setCars(prev => prev.filter(car => getCarId(car) !== carId));
      setError("✅ Car deleted successfully!");
      setTimeout(() => setError(""), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleAvailability = async (car) => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error("No authentication token found");
      
      const res = await fetch(`${BACKEND_URL}/cars/${getCarId(car)}`, {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${token}`, 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({ available: !car.available }),
      });

      const result = await res.json().catch(() => ({}));
      
      if (!res.ok || !result?.success) {
        throw new Error(result?.error || "Update failed");
      }

      setCars(prev => prev.map(c => 
        getCarId(c) === getCarId(car) ? { ...c, available: !car.available } : c
      ));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg font-semibold opacity-70 animate-pulse">
          🔄 Loading cars...
          {error && <div className="text-sm text-red-500 mt-2">{error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🚗 Admin Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">Manage your car inventory</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveView(activeView === "grid" ? "table" : "grid")} 
              className="border border-gray-300 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {activeView === "grid" ? "📊 Table View" : "🖼️ Grid View"}
            </button>
            <button 
              onClick={() => navigate("/")} 
              className="border border-gray-300 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              👁️ Customer View
            </button>
            <button 
              onClick={handleLogout} 
              className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        {/* Debug Actions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-yellow-800 mb-2">🔧 Debug Tools</h3>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={testUploadEndpoint}
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
            >
              Test Backend
            </button>
            <button 
              onClick={testUploadSystem}
              className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
            >
              Test Upload System
            </button>
            <button 
              onClick={fetchCars}
              className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600"
            >
              Refresh Cars
            </button>
          </div>
        </div>

        {/* Main Actions */}
        <div className="bg-white border rounded-lg shadow-sm mb-6">
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setShowForm(true);
                  setEditingCar(null);
                  resetForm();
                }}
                className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors ml-auto"
              >
                ➕ Add New Car
              </button>
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className={`mb-6 border rounded-lg p-4 ${
            error.includes("✅") 
              ? "bg-green-50 border-green-200 text-green-800" 
              : "bg-red-50 border-red-200 text-red-800"
          }`}>
            <div className="flex justify-between items-center">
              <span>{error}</span>
              <button onClick={() => setError("")} className="text-sm underline hover:no-underline">
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Car Inventory */}
        <div className="bg-white border rounded-lg shadow-sm">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Car Inventory</h2>
              <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {cars.length} cars
              </span>
            </div>

            {cars.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">No cars found in the database.</div>
                <button 
                  onClick={() => setShowForm(true)}
                  className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
                >
                  Add Your First Car
                </button>
              </div>
            ) : activeView === "grid" ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {cars.map((car) => {
                  const images = getAllImages(car);
                  const primaryImage = getPrimaryImage(car);
                  
                  return (
                    <div 
                      key={getCarId(car)} 
                      className={`border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow ${
                        !car.available ? "opacity-60" : ""
                      }`}
                    >
                      {/* Image Section */}
                      <div className="relative">
                        <img
                          src={primaryImage}
                          alt={`${car.brand} ${car.model}`}
                          className="w-full h-48 object-cover cursor-zoom-in"
                          onClick={() => setLightbox({ 
                            open: true, 
                            images: images, 
                            index: 0 
                          })}
                          onError={(e) => { 
                            e.target.src = PLACEHOLDER_ERROR_IMAGE; 
                          }}
                        />
                        <div className="absolute top-2 right-2 flex gap-1">
                          <span className={`text-xs px-2 py-1 rounded ${
                            car.available 
                              ? "bg-green-100 text-green-800" 
                              : "bg-red-100 text-red-800"
                          }`}>
                            {car.available ? "Available" : "Unavailable"}
                          </span>
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            {car.year}
                          </span>
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="p-4">
                        <h3 className="font-semibold text-lg mb-1">
                          {car.brand} {car.model}
                        </h3>
                        <div className="text-sm text-gray-600 mb-3">
                          ₹{car.price?.toLocaleString()} • {car.fuelType} • {car.transmission}
                        </div>

                        {/* Image Thumbnails */}
                        {images.length > 0 && (
                          <div className="mb-3">
                            <div className="flex gap-2 overflow-x-auto pb-2">
                              {images.slice(0, 5).map((image, index) => (
                                <img
                                  key={index}
                                  src={image}
                                  alt={`${car.brand} ${car.model} - Image ${index + 1}`}
                                  className="w-12 h-12 object-cover rounded border cursor-pointer flex-shrink-0"
                                  onClick={() => setLightbox({ 
                                    open: true, 
                                    images: images, 
                                    index: index 
                                  })}
                                  onError={(e) => { 
                                    e.target.src = PLACEHOLDER_ERROR_IMAGE; 
                                  }}
                                />
                              ))}
                              {images.length > 5 && (
                                <button 
                                  className="text-xs text-blue-600 underline self-center"
                                  onClick={() => setLightbox({ 
                                    open: true, 
                                    images: images, 
                                    index: 5 
                                  })}
                                >
                                  +{images.length - 5} more
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-4">
                          <button 
                            onClick={() => toggleAvailability(car)}
                            className={`flex-1 border px-3 py-2 rounded text-sm ${
                              car.available 
                                ? "border-yellow-500 text-yellow-700 hover:bg-yellow-50" 
                                : "border-green-500 text-green-700 hover:bg-green-50"
                            }`}
                          >
                            {car.available ? "Make Unavailable" : "Make Available"}
                          </button>
                          <button 
                            onClick={() => handleEdit(car)}
                            className="flex-1 border border-blue-500 text-blue-700 px-3 py-2 rounded text-sm hover:bg-blue-50"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(getCarId(car))}
                            className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <TableView
                cars={cars}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleAvailability={toggleAvailability}
                getCarId={getCarId}
                getPrimaryImage={getPrimaryImage}
                getAllImages={getAllImages}
                PLACEHOLDER_ERROR_IMAGE={PLACEHOLDER_ERROR_IMAGE}
                onOpenLightbox={(images, index) => setLightbox({ 
                  open: true, 
                  images, 
                  index 
                })}
              />
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Car Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">
                {editingCar ? "Edit Car" : "Add New Car"}
              </h2>
              <button 
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <Input label="Brand *" name="brand" value={formData.brand} onChange={handleInputChange} required maxLength={64} />
                <Input label="Model *" name="model" value={formData.model} onChange={handleInputChange} required maxLength={64} />
                <Input label="Year *" name="year" type="number" value={formData.year} onChange={handleInputChange} required min={1886} max={2030} />
                <Input label="Price *" name="price" type="number" value={formData.price} onChange={handleInputChange} required min={0} max={1000000} />
                <Select label="Fuel Type *" name="fuelType" value={formData.fuelType} onChange={handleInputChange} options={["Gasoline", "Petrol", "Diesel", "Electric", "Hybrid", "CNG"]} required />
                <Input label="Mileage (km)" name="mileage" type="number" value={formData.mileage} onChange={handleInputChange} min={0} max={1000000} />
                <Input label="Color" name="color" value={formData.color} onChange={handleInputChange} maxLength={64} />
                <Select label="Transmission" name="transmission" value={formData.transmission} onChange={handleInputChange} options={["Manual", "Automatic", "AMT", "CVT", "DCT"]} />
                <Select label="Owners" name="owners" value={formData.owners} onChange={handleInputChange} options={["1st Owner", "2nd Owner", "3rd Owner", "4th Owner+"]} />
                <Select label="Type" name="type" value={formData.type} onChange={handleInputChange} options={["Sedan", "SUV", "Hatchback", "Coupe", "Convertible", "Minivan", "Pickup"]} />
                <Input label="Seating Capacity" name="seatingCapacity" type="number" value={formData.seatingCapacity} onChange={handleInputChange} min={1} max={20} />
                <Input label="Location" name="location" value={formData.location} onChange={handleInputChange} maxLength={128} />
              </div>

              {/* Features */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Features (comma-separated)
                </label>
                <textarea 
                  name="features" 
                  value={formData.features} 
                  onChange={handleInputChange} 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  maxLength={512} 
                  placeholder="AC, Power Steering, Music System, Sunroof..."
                  rows={3}
                />
              </div>

              {/* Availability */}
              <div className="flex items-center gap-2 mb-6">
                <input 
                  type="checkbox" 
                  name="available" 
                  checked={formData.available} 
                  onChange={handleInputChange} 
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-gray-700">
                  Available for rent/sale
                </label>
              </div>

              {/* Multiple Images Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Images (max 10 files, 8MB each)
                </label>
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  onChange={handleFilesChange} 
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                
                {/* New Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      New Images to Upload ({imagePreviews.length})
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative">
                          <img 
                            src={preview} 
                            alt={`Preview ${index + 1}`} 
                            className="w-20 h-20 object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Existing Images */}
                {formData.images?.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Existing Images ({formData.images.length})
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {formData.images.map((image, index) => (
                        <img 
                          key={index}
                          src={image} 
                          alt={`Existing ${index + 1}`}
                          className="w-16 h-16 object-cover rounded-lg border"
                          onError={(e) => {
                            e.target.src = PLACEHOLDER_ERROR_IMAGE;
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 justify-end pt-6 border-t">
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={uploading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {uploading ? "Uploading..." : editingCar ? "Update Car" : "Add Car"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox/Carousel */}
      {lightbox.open && (
        <Lightbox
          images={lightbox.images}
          index={lightbox.index}
          onClose={() => setLightbox({ open: false, images: [], index: 0 })}
        />
      )}
    </div>
  );
}

// Reusable Input Component
function Input({ label, ...props }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        {...props}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      />
    </div>
  );
}

// Reusable Select Component
function Select({ label, name, value, onChange, options = [], required }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      >
        {options.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

// Table View Component
function TableView({ cars, onEdit, onDelete, onToggleAvailability, getCarId, getPrimaryImage, getAllImages, PLACEHOLDER_ERROR_IMAGE, onOpenLightbox }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="text-left py-3 px-4 font-semibold text-gray-900">Image</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-900">Brand & Model</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-900">Year</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-900">Price</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-900">Fuel</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
          </tr>
        </thead>
        <tbody>
          {cars.map((car) => {
            const carId = getCarId(car);
            const primaryImage = getPrimaryImage(car);
            const allImages = getAllImages(car);
            
            return (
              <tr key={carId} className="border-b hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4">
                  <img
                    src={primaryImage}
                    alt={car.model}
                    className="w-16 h-12 object-cover rounded cursor-zoom-in border"
                    onClick={() => onOpenLightbox(allImages, 0)}
                    onError={(e) => { 
                      e.target.src = PLACEHOLDER_ERROR_IMAGE; 
                    }}
                  />
                </td>
                <td className="py-3 px-4 font-medium text-gray-900">
                  {car.brand} {car.model}
                </td>
                <td className="py-3 px-4 text-gray-700">{car.year}</td>
                <td className="py-3 px-4 text-gray-700">
                  ₹{car.price?.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-gray-700">{car.fuelType}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    car.available 
                      ? "bg-green-100 text-green-800" 
                      : "bg-red-100 text-red-800"
                  }`}>
                    {car.available ? "Available" : "Unavailable"}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onToggleAvailability(car)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Toggle
                    </button>
                    <button 
                      onClick={() => onEdit(car)}
                      className="text-green-600 hover:text-green-800 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => onDelete(carId)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Lightbox Component
function Lightbox({ images, index = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(index);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const nextImage = () => {
    setCurrentIndex(prev => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
  };

  if (!images.length) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 transition-colors z-10"
      >
        ✕
      </button>

      {/* Navigation Buttons */}
      {images.length > 1 && (
        <>
          <button
            onClick={prevImage}
            className="absolute left-4 text-white text-4xl hover:text-gray-300 transition-colors z-10"
          >
            ‹
          </button>
          <button
            onClick={nextImage}
            className="absolute right-4 text-white text-4xl hover:text-gray-300 transition-colors z-10"
          >
            ›
          </button>
        </>
      )}

      {/* Main Image */}
      <div className="relative max-w-4xl max-h-full w-full h-full flex items-center justify-center p-4">
        <img
          src={images[currentIndex]}
          alt={`Image ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain rounded-lg"
          onError={(e) => {
            e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23fef2f2'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='14' fill='%23dc2626'%3EImage Error%3C/text%3E%3C/svg%3E";
          }}
        />
      </div>

      {/* Image Counter */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded-full">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[90vw] pb-2">
          {images.map((image, idx) => (
            <img
              key={idx}
              src={image}
              alt={`Thumbnail ${idx + 1}`}
              onClick={() => setCurrentIndex(idx)}
              className={`w-12 h-12 object-cover rounded border cursor-pointer flex-shrink-0 transition-all ${
                currentIndex === idx ? "ring-2 ring-white ring-opacity-80" : "opacity-70 hover:opacity-100"
              }`}
              onError={(e) => {
                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' fill='%23fef2f2'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='8' fill='%23dc2626'%3EE%3C/text%3E%3C/svg%3E";
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;