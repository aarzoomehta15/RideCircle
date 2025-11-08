import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Shield, Star, Users, AlertTriangle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/authService";
import { feedbackService } from "../services/feedbackService";
import Header from "../components/Header";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    community: "",
    preferences: {
      womenOnly: false,
      communityOnly: false,
      verifiedOnly: true,
    },
  });
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

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
          community: user.community || "",
          preferences: user.preferences || {
            womenOnly: false,
            communityOnly: false,
            verifiedOnly: true,
          },
        });
      }

      // Load feedbacks
      const feedbackData = await feedbackService.getFeedbackForUser(user._id);
      setFeedbacks(feedbackData.feedbacks || []);
    } catch (err) {
      setError(err.message || "Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith("preferences.")) {
      const prefName = name.split(".")[1];
      setFormData({
        ...formData,
        preferences: {
          ...formData.preferences,
          [prefName]: checked,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const response = await authService.updateProfile(user._id, formData);
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
      community: user.community || "",
      preferences: user.preferences || {
        womenOnly: false,
        communityOnly: false,
        verifiedOnly: true,
      },
    });
    setEditing(false);
    setError(null);
  };
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Community/Organization
                </label>
                <input
                  type="text"
                  name="community"
                  value={formData.community}
                  onChange={handleChange}
                  disabled={!editing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-600"
                />
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

            {/* Preferences */}
            {editing && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Ride Preferences
                </p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="preferences.womenOnly"
                    checked={formData.preferences.womenOnly}
                    onChange={handleChange}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">
                    Prefer women-only rides
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="preferences.communityOnly"
                    checked={formData.preferences.communityOnly}
                    onChange={handleChange}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">
                    Prefer same community rides
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="preferences.verifiedOnly"
                    checked={formData.preferences.verifiedOnly}
                    onChange={handleChange}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">
                    Only verified users
                  </span>
                </label>
              </div>
            )}

            {!editing && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Current Preferences
                </p>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>
                    • Women-only rides:{" "}
                    {user?.preferences?.womenOnly ? "Yes" : "No"}
                  </p>
                  <p>
                    • Community rides:{" "}
                    {user?.preferences?.communityOnly ? "Yes" : "No"}
                  </p>
                  <p>
                    • Verified users only:{" "}
                    {user?.preferences?.verifiedOnly ? "Yes" : "No"}
                  </p>
                </div>
              </div>
            )}
          </div>

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
