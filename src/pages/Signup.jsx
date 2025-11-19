import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Users, X, ChevronDown, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { validateForm } from "../utils/validation";

const COMMUNITY_OPTIONS = [
  "TIET Patiala",
  "Delhi University",
  "ABC Office",
  "XYZ Society",
];

const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    gender: "other",
    community: [], // Changed to array
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
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
  
  const handleRemoveCommunity = (communityToRemove) => {
    setFormData((prev) => ({
      ...prev,
      community: prev.community.filter((c) => c !== communityToRemove),
    }));
    setError("");
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
    setError("");
  };
  
  const handleChange = (e) => {
    const { name, value, type } = e.target;

    // Standard input handler (community is handled separately by the toggle function)
    if (name !== 'community') {
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? e.target.checked : value,
      });
    }
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    const errors = validateForm(formData, [
      "name",
      "email",
      "password",
      "phone",
    ]);
    if (Object.keys(errors).length > 0) {
      setError(Object.values(errors)[0]);
      return;
    }

    setLoading(true);

    try {
      const dataToSubmit = {
        ...formData,
        community: formData.community || [],
      };
      
      await signup(dataToSubmit);
      navigate("/dashboard");
    } catch (err) {
      if (!err) {
        setError("Signup failed. Please try again.");
      } else if (typeof err === "string") {
        setError(err);
      } else if (err.message) {
        setError(err.message);
      } else {
        try {
          setError(JSON.stringify(err));
        } catch (e) {
          setError("Signup failed. Please try again.");
        }
      }
    } finally {
      setLoading(false);
    }
  };
  
  const availableCommunities = COMMUNITY_OPTIONS.filter(c => !formData.community.includes(c));

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
          <p className="text-gray-600 mt-2">Join the RideCircle community</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
                minLength="6"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
                pattern="[0-9]{10}"
                placeholder="10-digit number"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="relative" ref={communityRef}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Community/Organization
              </label>
              
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
            </div>
          </div>

          {/* REMOVE: Removed Ride Preferences section entirely */}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-indigo-300"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Already have an account? Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;