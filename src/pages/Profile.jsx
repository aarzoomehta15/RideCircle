import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Shield, Star, Users, AlertTriangle, X, ChevronDown } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/authService";
import { feedbackService } from "../services/feedbackService";
import Header from "../components/Header";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

// List of allowed communities
const COMMUNITY_OPTIONS = [
  "TIET Patiala",
  "Delhi University",
  "ABC Office",
  "XYZ Society",
];

// Helper function to normalize old string community field to an array
const normalizeCommunity = (community) => {
  if (Array.isArray(community)) {
    return community;
  }
  if (typeof community === 'string' && community) {
    return [community];
  }
  return [];
};

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    community: [], // Changed to array
  });
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // State for in-place multi-select UI
  const [isCommunityDropdownOpen, setIsCommunityDropdownOpen] = useState(false);
  const communityRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (communityRef.current && !communityRef.current.contains(event.target)) {
        setIsCommunityDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  useEffect(() => {
    loadProfileData();
  }, [user]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Set form data from user
      if (user) {
        setFormData({
          name: user.name || "",
          phone: user.phone || "",
          // FIX: Normalize stored community (from localStorage) to an array for the form state
          community: normalizeCommunity(user.community), 
        });
      }

      // Load feedbacks - uses user.id (fix from previous step)
      const feedbackData = await feedbackService.getFeedbackForUser(user.id);
      setFeedbacks(feedbackData.feedbacks || []);
    } catch (err) {
      setError(err.message || "Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCommunity = (communityToRemove) => {
    setFormData((prev) => ({
      ...prev,
      community: prev.community.filter((c) => c !== communityToRemove),
    }));
    setError(null);
  };
  
  const handleToggleCommunity = (communityToToggle) => {
    setFormData((prev) => {
      const isSelected = prev.community.includes(communityToToggle);
      const newCommunity = isSelected
        ? prev.community.filter((c) => c !== communityToToggle)
        : [...prev.community, communityToToggle];

      return { ...prev, community: newCommunity };
    });
    setIsCommunityDropdownOpen(false);
    setError(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name !== 'community') {
        setFormData({
            ...formData,
            [name]: value,
        });
    }
    setError(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const dataToSubmit = {
        ...formData,
        community: formData.community || [],
      };

      // Uses user.id (fix from previous step)
      const response = await authService.updateProfile(user.id, dataToSubmit);
      updateUser(response.user);
      setEditing(false);
      alert("Profile updated successfully!");
    } catch (err) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data
    setFormData({
      name: user.name || "",
      phone: user.phone || "",
      // FIX: Normalize stored community (from localStorage) to an array when canceling
      community: normalizeCommunity(user.community), 
    });
    setEditing(false);
    setError(null);
  };
  
  // Helper function to safely render community for display
  const renderCommunityDisplay = (community) => {
    const normalized = normalizeCommunity(community);
    return normalized.length > 0
        ? normalized.join(', ')
        : 'None specified';
  };
  
  const availableCommunities = COMMUNITY_OPTIONS.filter(c => !formData.community.includes(c));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <LoadingSpinner message="Loading profile..." />
        </div>
      </div>
    );
  }
  
  const avgRating =
    feedbacks.length > 0
      ? (
          feedbacks.reduce((sum, f) => sum + f.score, 0) / feedbacks.length
        ).toFixed(1)
      : "N/A";
  
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

        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
            <div className="flex gap-2">
              {editing ? (
                <>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:bg-indigo-300"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-6">
              <ErrorMessage message={error} />
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <Shield size={32} className="text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">
                {user?.trustScore || 50}
              </p>
              <p className="text-sm text-gray-600">Trust Score</p>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <Star size={32} className="text-yellow-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{avgRating}</p>
              <p className="text-sm text-gray-600">Avg Rating</p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <Users size={32} className="text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">
                {feedbacks.length}
              </p>
              <p className="text-sm text-gray-600">Reviews</p>
            </div>
          </div>

          {/* Profile Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!editing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!editing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-600"
                />
              </div>
              
              <div className="relative" ref={communityRef}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Community/Organization
                </label>
                
                {editing ? (
                  <>
                    {/* Multi-Select Input Field */}
                    <div
                      className={`flex items-center justify-between px-4 py-3 border ${
                        isCommunityDropdownOpen ? 'border-indigo-500 ring-2 ring-indigo-500' : 'border-gray-300'
                      } rounded-lg cursor-pointer transition`}
                      onClick={() => setIsCommunityDropdownOpen(!isCommunityDropdownOpen)}
                    >
                      <span className={`text-gray-500 ${formData.community.length > 0 ? 'text-gray-900' : ''}`}>
                        {formData.community.length > 0 ? 'Click to add/remove...' : 'Select communities...'}
                      </span>
                      <ChevronDown 
                        size={16} 
                        className={`text-gray-400 transition-transform ${isCommunityDropdownOpen ? 'rotate-180' : ''}`} 
                      />
                    </div>

                    {/* Tags/Bubbles Display */}
                    {formData.community.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.community.map((tag) => (
                          <div
                            key={tag}
                            className="flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium"
                          >
                            <span>{tag}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveCommunity(tag)}
                              className="ml-2 text-blue-700 hover:text-blue-900 transition"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Dropdown Menu */}
                    {isCommunityDropdownOpen && availableCommunities.length > 0 && (
                      <div className="absolute top-full left-0 z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {availableCommunities.map((option) => (
                          <div
                            key={option}
                            className="px-4 py-2 cursor-pointer hover:bg-indigo-50 flex justify-between items-center text-gray-900 text-sm"
                            onClick={() => handleToggleCommunity(option)}
                          >
                            <span>{option}</span>
                            <Users size={16} className="text-indigo-500"/>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600">
                    {renderCommunityDisplay(user?.community)}
                  </div>
                )}
              </div>

            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <input
                type="text"
                value={user?.gender || "Not specified"}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 capitalize"
              />
            </div>
          </div>

          {/* REMOVE: Removed Preferences Section */}
          
          {/* Recent Reviews */}
          {feedbacks.length > 0 && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Reviews ({feedbacks.length})
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {feedbacks.slice(0, 10).map((feedback) => (
                  <div key={feedback._id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">
                        {feedback.raterId?.name || "Anonymous"}
                      </span>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            className={
                              i < feedback.score
                                ? "text-yellow-500 fill-yellow-500"
                                : "text-gray-300"
                            }
                          />
                        ))}
                      </div>
                    </div>
                    {feedback.comment && (
                      <p className="text-sm text-gray-600 mb-2">
                        {feedback.comment}
                      </p>
                    )}
                    {feedback.safetyFlag && (
                      <div className="flex items-center gap-2 mt-2 text-red-600">
                        <AlertTriangle size={14} />
                        <span className="text-xs">Safety concern reported</span>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(feedback.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default Profile;