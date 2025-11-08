import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { poolService } from "../services/poolService";
import Header from "../components/Header";
import MapPicker from "../components/MapPicker";
import { getMinDate } from "../utils/dateUtils";

const CreatePool = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    source: "",
    destination: "",
    sourceCoords: null,
    destCoords: null,
    date: "",
    time: "",
    maxSeats: 4,
    type: "open",
    fare: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSourceMap, setShowSourceMap] = useState(false);
  const [showDestMap, setShowDestMap] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSourceLocation = (location) => {
    setFormData({
      ...formData,
      source: location.address,
      sourceCoords: { lat: location.lat, lng: location.lng },
    });
  };

  const handleDestLocation = (location) => {
    setFormData({
      ...formData,
      destination: location.address,
      destCoords: { lat: location.lat, lng: location.lng },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.source || !formData.destination) {
      setError("Please select both source and destination");
      return;
    }

    if (!formData.date || !formData.time) {
      setError("Please select date and time");
      return;
    }

    if (!formData.fare || formData.fare <= 0) {
      setError("Please enter a valid fare amount");
      return;
    }

    setLoading(true);

    try {
      const poolData = {
        ...formData,
        fare: parseFloat(formData.fare),
        maxSeats: parseInt(formData.maxSeats),
      };

      await poolService.createPool(poolData);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Failed to create pool");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition"
        >
          <ChevronRight size={20} className="rotate-180" />
          Back to Dashboard
        </button>

        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Create a New Pool
          </h2>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Source Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source Location *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.source}
                  readOnly
                  placeholder="Click 'Select on Map' to choose location"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSourceMap(!showSourceMap)}
                  className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  {showSourceMap ? "Hide Map" : "Select on Map"}
                </button>
              </div>
              {showSourceMap && (
                <div className="mt-4">
                  <MapPicker
                    onLocationSelect={handleSourceLocation}
                    label="Select Source Location"
                  />
                </div>
              )}
            </div>

            {/* Destination Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Destination *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.destination}
                  readOnly
                  placeholder="Click 'Select on Map' to choose location"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowDestMap(!showDestMap)}
                  className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  {showDestMap ? "Hide Map" : "Select on Map"}
                </button>
              </div>
              {showDestMap && (
                <div className="mt-4">
                  <MapPicker
                    onLocationSelect={handleDestLocation}
                    label="Select Destination"
                  />
                </div>
              )}
            </div>

            {/* Date, Time, Seats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  min={getMinDate()}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time *
                </label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Seats *
                </label>
                <input
                  type="number"
                  name="maxSeats"
                  value={formData.maxSeats}
                  onChange={handleChange}
                  min="2"
                  max="6"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Pool Type and Fare */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pool Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="open">Open to All</option>
                  <option value="women-only">Women Only</option>
                  <option value="community">Community Members Only</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Fare per Person (₹) *
                </label>
                <input
                  type="number"
                  name="fare"
                  value={formData.fare}
                  onChange={handleChange}
                  placeholder="100"
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                Pool Information
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>
                  • You will be automatically added as the first participant
                </li>
                <li>
                  • The fare shown is per person and will be split among all
                  riders
                </li>
                <li>• You can cancel the pool anytime before the ride date</li>
                <li>
                  • Other users can join your pool based on the type you
                  selected
                </li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-indigo-300"
            >
              {loading ? "Creating Pool..." : "Create Pool"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePool;
