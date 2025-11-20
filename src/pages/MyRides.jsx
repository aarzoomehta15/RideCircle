import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  MapPin,
  Calendar,
  Clock,
  Users,
  User,
  Shield,
  CheckCircle,
  Phone,
  Feather, 
  ChevronDown // Added ChevronDown for better expand/collapse icon
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { poolService } from "../services/poolService";
import { feedbackService } from "../services/feedbackService";
import Header from "../components/Header";
import RatingModal from "../components/RatingModal";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

const MyRides = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pools, setPools] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRide, setSelectedRide] = useState(null);
  
  // FIX 1: STATE LOGIC - Tracks the ID of the ONE currently expanded participant
  const [expandedParticipantId, setExpandedParticipantId] = useState(null);

  useEffect(() => {
    loadMyRides();
  }, []);

  const loadMyRides = async () => {
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
      setError(err.message || "Failed to load your rides");
    } finally {
      setLoading(false);
    }
  };

  const handleRateSubmit = async (ratingData) => {
    try {
      await feedbackService.submitFeedback({
        rideId: selectedRide._id,
        ...ratingData,
      });
      alert("Rating submitted successfully!");
      setSelectedRide(null);
      loadMyRides(); // Reload to update rated status
    } catch (err) {
      alert(err.message || "Failed to submit rating");
    }
  };

  // Participant Card Component (defined as inner component to access state)
  const ParticipantCard = ({ participant }) => {
    // FIX: Accessing data from the correct nested structure (participant.user)
    const { user: coRider, status } = participant;
    
    // Ensure the participant data is populated and they haven't left
    if (!coRider || status !== 'joined') return null;

    // FIX 1: STATE LOGIC - Only expand if this specific participant ID matches the state
    const isExpanded = expandedParticipantId === coRider._id;
    const isCreator = user.id === coRider._id;

    const toggleExpand = (e) => {
      e.stopPropagation(); // Prevents propagation
      setExpandedParticipantId(isExpanded ? null : coRider._id);
    };
    
    // FIX 2: LAYOUT - Apply width calculation for two-column layout
    return (
      <div 
        key={coRider._id}
        onClick={toggleExpand}
        className={`w-full md:w-[calc(50%-0.5rem)] flex-shrink-0 bg-gray-50 p-3 rounded-lg cursor-pointer transition-all border ${isExpanded ? 'border-indigo-400 shadow-md' : 'border-gray-200 hover:border-indigo-300'}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User size={18} className={`text-gray-600 ${isCreator ? 'text-indigo-600' : ''}`} />
            <span className="font-medium text-gray-900">
              {coRider.name} {isCreator && "(You)"}
            </span>
          </div>

          {/* Initial Display: Trust Score */}
          <div className="flex items-center gap-1 text-sm">
            <Shield size={14} className="text-green-600" />
            <span className="text-xs font-semibold text-gray-600">
              {coRider.trustScore || 50}
            </span>
            <ChevronDown size={14} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {/* EXPANDED DETAILS (Phone & Gender) */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-200 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <Phone size={14} className="text-indigo-500" />
              <span>Phone: {coRider.phone}</span>
            </div>
            {/* FIX 3: GENDER VISIBILITY - Ensure 'capitalize' class is applied for clean display */}
            <div className="flex items-center gap-2 text-gray-700 capitalize"> 
              <Feather size={14} className="text-indigo-500" />
              <span>Gender: {coRider.gender}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const upcomingRides = pools.filter((p) => p.status === "upcoming");
  const completedRides = pools.filter((p) => p.status === "completed");

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <LoadingSpinner message="Loading your rides..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition"
        >
          <ChevronRight size={20} className="rotate-180" />
          Back to Dashboard
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">My Rides</h2>

        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} onRetry={loadMyRides} />
          </div>
        )}

        {/* Upcoming Rides */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Upcoming Rides ({upcomingRides.length})
          </h3>
          {upcomingRides.length === 0 ? (
            <div className="bg-white p-8 rounded-xl shadow-md text-center text-gray-500">
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
            <div className="space-y-4">
              {upcomingRides.map((pool) => (
                <div
                  key={pool._id}
                  className="bg-white p-6 rounded-xl shadow-md"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin size={16} className="text-indigo-600" />
                        <span className="font-semibold text-gray-900">
                          {pool.source}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <MapPin size={16} className="text-green-600" />
                        <span className="font-semibold text-gray-900">
                          {pool.destination}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(pool.date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {pool.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={14} />
                          {pool.participants?.filter(p => p.status === 'joined').length || 0} riders
                        </span>
                      </div>
                    </div>

                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      Upcoming
                    </span>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-700 mb-3">
                      Co-riders ({pool.participants?.filter(p => p.status === 'joined').length}):
                    </p>
                    {/* FIX 2: LAYOUT - Use flex-wrap and gap-4 to create the two-column grid */}
                    <div className="flex flex-wrap gap-4"> 
                      {pool.participants?.map((participant) => (
                          <ParticipantCard key={participant._id} participant={participant} />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Rides */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Completed Rides ({completedRides.length})
          </h3>
          {completedRides.length === 0 ? (
            <div className="bg-white p-8 rounded-xl shadow-md text-center text-gray-500">
              No completed rides yet
            </div>
          ) : (
            <div className="space-y-4">
              {completedRides.map((pool) => {
                const hasRated = feedbacks.some((f) => f.rideId === pool._id);
                return (
                  <div
                    key={pool._id}
                    className="bg-white p-6 rounded-xl shadow-md"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin size={16} className="text-indigo-600" />
                          <span className="font-semibold text-gray-900">
                            {pool.source}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <MapPin size={16} className="text-green-600" />
                          <span className="font-semibold text-gray-900">
                            {pool.destination}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>
                            {new Date(pool.date).toLocaleDateString()}
                          </span>
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                            Completed
                          </span>
                        </div>
                      </div>

                      {!hasRated ? (
                        <button
                          onClick={() => setSelectedRide(pool)}
                          className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
                        >
                          Rate Co-riders
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle size={20} />
                          <span className="text-sm font-medium">Rated</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedRide && (
        <RatingModal
          pool={selectedRide}
          participants={selectedRide.participants || []}
          currentUserId={user.id} 
          onSubmit={handleRateSubmit}
          onClose={() => setSelectedRide(null)}
        />
      )}
    </div>
  );
};

export default MyRides;