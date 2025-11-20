import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Calendar,
  Star,
  Plus,
  Search,
  ChevronRight,
  MapPin,
  Clock,
  Users,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { poolService } from "../services/poolService";
import { feedbackService } from "../services/feedbackService";
import Header from "../components/Header";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pools, setPools] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);
  
  // NEW: Run cleanup after initial data load
  useEffect(() => {
    if (!loading && !error) {
        runCleanup();
    }
  }, [loading, error]);
  
  const loadPoolsDataOnly = async () => {
    try {
        const poolsData = await poolService.getMyPools();
        setPools(poolsData.pools || []);
    } catch (err) {
        // Only update the error state if it was previously null, to avoid infinite loops
        if (!error) {
            setError(err.message || "Failed to load pools data for cleanup check");
        }
    }
  };
  
  // NEW: Function to run the cleanup endpoint
  const runCleanup = async () => {
      try {
          const result = await poolService.cleanupOldPools();
          if (result.deletedCount > 0) {
              console.log(result.message);
              // Reload pools to reflect changes after cleanup
              loadPoolsDataOnly(); 
          }
      } catch (e) {
          console.warn("Cleanup failed but continuing dashboard load.", e);
      }
  }

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [poolsData, feedbackData] = await Promise.all([
        poolService.getMyPools(),
        feedbackService.getMyFeedback(),
      ]);
      setPools(poolsData.pools || []);
      setFeedbacks(feedbackData.feedbacks || []);
    } catch (err) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const getTrustLevel = (score) => {
    if (score >= 80)
      return {
        label: "Excellent",
        color: "text-green-600",
        bg: "bg-green-100",
      };
    if (score >= 60)
      return { label: "Good", color: "text-blue-600", bg: "bg-blue-100" };
    if (score >= 40)
      return { label: "Fair", color: "text-yellow-600", bg: "bg-yellow-100" };
    return { label: "Low", color: "text-red-600", bg: "bg-red-100" };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <LoadingSpinner message="Loading dashboard..." />
        </div>
      </div>
    );
  }

  const upcomingPools = pools
    .filter((p) => p.status === "upcoming" || p.status === "ongoing")
    .slice(0, 3);
  const completedCount = pools.filter((p) => p.status === "completed").length;
  const avgRating =
    feedbacks.length > 0
      ? (
          feedbacks.reduce((sum, f) => sum + f.score, 0) / feedbacks.length
        ).toFixed(1)
      : "N/A";
  const trustLevel = getTrustLevel(user?.trustScore || 50);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600">
            Manage your rides and connect with your community
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} onRetry={loadDashboardData} />
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${trustLevel.bg}`}>
                <Shield className={trustLevel.color} size={24} />
              </div>
              <span className={`text-2xl font-bold ${trustLevel.color}`}>
                {user?.trustScore || 50}
              </span>
            </div>
            <h3 className="text-gray-900 font-semibold mb-1">Trust Score</h3>
            <p className="text-sm text-gray-600">{trustLevel.label} standing</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-indigo-100">
                <Calendar className="text-indigo-600" size={24} />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {completedCount}
              </span>
            </div>
            <h3 className="text-gray-900 font-semibold mb-1">
              Completed Rides
            </h3>
            <p className="text-sm text-gray-600">Total trips shared</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-yellow-100">
                <Star className="text-yellow-600" size={24} />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {avgRating}
              </span>
            </div>
            <h3 className="text-gray-900 font-semibold mb-1">Average Rating</h3>
            <p className="text-sm text-gray-600">
              From {feedbacks.length} reviews
            </p>
          </div>
        </div>

        {/* Quick Actions and Upcoming Rides */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <button
                onClick={() => navigate("/create-pool")}
                className="w-full flex items-center justify-between p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-600 rounded-lg">
                    <Plus className="text-white" size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Create a Pool</p>
                    <p className="text-sm text-gray-600">
                      Start a new ride share
                    </p>
                  </div>
                </div>
                <ChevronRight className="text-gray-400 group-hover:text-indigo-600 transition" />
              </button>

              <button
                onClick={() => navigate("/join-pool")}
                className="w-full flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 rounded-lg transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-600 rounded-lg">
                    <Search className="text-white" size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Join a Pool</p>
                    <p className="text-sm text-gray-600">
                      Find available rides
                    </p>
                  </div>
                </div>
                <ChevronRight className="text-gray-400 group-hover:text-green-600 transition" />
              </button>
            </div>
          </div>

          {/* Upcoming Rides */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Upcoming Rides
            </h2>
            {upcomingPools.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar size={48} className="mx-auto mb-3 opacity-50" />
                <p>No upcoming rides</p>
                <button
                  onClick={() => navigate("/join-pool")}
                  className="text-indigo-600 text-sm mt-2 hover:underline"
                >
                  Find a ride
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingPools.map((pool) => (
                  <div
                    key={pool._id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition cursor-pointer"
                    onClick={() => navigate("/my-rides")}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin size={16} className="text-indigo-600" />
                          <p className="font-semibold text-gray-900 text-sm">
                            {pool.source}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-green-600" />
                          <p className="text-sm text-gray-600">
                            {pool.destination}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {pool.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={14} />
                          {pool.participants?.filter(p => p.status === 'joined').length || 0}/{pool.maxSeats}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;