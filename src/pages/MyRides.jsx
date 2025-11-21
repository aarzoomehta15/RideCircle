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
  ChevronDown,
  XCircle, // Added XCircle for cancellation
  CheckCheck // Added CheckCheck for completion
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { poolService } from "../services/poolService";
import { feedbackService } from "../services/feedbackService";
import Header from "../components/Header";
import RatingModal from "../components/RatingModal";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import { hasRideTimePassed, isLateCancellation } from "../utils/dateUtils"; // NEW IMPORT

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
      const payload = {
        rideId: selectedRide._id,  // <-- REQUIRED
        ...ratingData             // includes ratedUserId, score, comment, safetyFlag
      };

      await feedbackService.submitFeedback(payload);

      alert("Rating submitted successfully!");
      setSelectedRide(null);
      loadMyRides(); // Reload to update rated status
    } catch (err) {
      alert(err || "Failed to submit rating");
    }
  };

  
  // NEW: Handle participant leaving a pool
  const handleLeavePool = async (poolId, date, time) => {
      
      try {
          const isLate = isLateCancellation(date, time);
          
          if (isLate) {
              const confirmLate = window.confirm(
                  "This cancellation is less than 1 hour before departure. You will incur a 5-point Trust Score penalty. Continue?"
              );
              if (!confirmLate) {
                  return;
              }
          } else {
              if (!window.confirm("Are you sure you want to leave this pool? This action cannot be undone.")) {
                  return;
              }
          }
          
          const response = await poolService.leavePool(poolId);
          alert(response.message);
          loadMyRides();
      } catch (err) {
          alert(err || "Failed to leave pool");
      }
  };
  
  // NEW: Handle creator updating pool status (Mark as Completed / Cancel Pool)
  const handleUpdatePoolStatus = async (poolId, status, activeParticipants) => {
      let message = "";
      if (status === 'completed') {
          message = "Are you sure you want to mark this ride as completed? You will then be able to rate your co-riders.";
      } else if (status === 'cancelled') {
          if (activeParticipants > 1) {
              message = `WARNING: This will cancel the ride, and since ${activeParticipants - 1} other participant(s) have joined, you will incur a 5-point Trust Score penalty. Are you sure?`;
          } else {
              message = "Are you sure you want to cancel this pool? This action cannot be undone.";
          }
      }
      
      if (!window.confirm(message)) {
          return;
      }

      try {
          const response = await poolService.updatePoolStatus(poolId, status);
          if (response.penaltyApplied) {
              alert(response.message);
          } else {
              alert(`Ride successfully marked as ${status}.`);
          }
          loadMyRides();
      } catch (err) {
          alert(err || `Failed to update pool status to ${status}.`);
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
  
  const upcomingRides = pools.filter((p) => p.status === "upcoming" || p.status === "ongoing");
  const completedRides = pools.filter((p) => p.status === "completed");
  const cancelledRides = pools.filter((p) => p.status === "cancelled"); // New section

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

        {/* Upcoming & Ongoing Rides */}
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
              {upcomingRides.map((pool) => {
                const isCreator = pool.createdBy._id === user.id;
                const isActiveParticipant = pool.participants.some(
                    p => p.user._id === user.id && p.status === 'joined'
                );
                const activeParticipantsCount = pool.participants?.filter(p => p.status === 'joined').length || 0;
                
                const timePassed = hasRideTimePassed(pool.date, pool.time);
                
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
                            {activeParticipantsCount} riders
                          </span>
                        </div>
                      </div>

                      {/* NEW BUTTONS/ACTIONS */}
                      <div className="flex flex-col gap-2">
                        {/* Creator: Mark as Completed */}
                        {timePassed && isCreator && pool.status === 'upcoming' && (
                            <button
                                onClick={() => handleUpdatePoolStatus(pool._id, 'completed')}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center gap-2 text-sm"
                            >
                                <CheckCheck size={16} /> Mark as Completed
                            </button>
                        )}
                        
                        {/* Creator: Cancel Pool */}
                        {isCreator && !timePassed && (
                            <button
                                onClick={() => handleUpdatePoolStatus(pool._id, 'cancelled', activeParticipantsCount)}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center gap-2 text-sm"
                            >
                                <XCircle size={16} /> Cancel Pool
                            </button>
                        )}

                        {/* Participant: Leave Pool */}
                        {!isCreator && isActiveParticipant && !timePassed && (
                            <button
                                onClick={() => handleLeavePool(pool._id, pool.date, pool.time)}
                                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition flex items-center gap-2 text-sm"
                            >
                                <XCircle size={16} /> Leave Pool
                            </button>
                        )}
                        
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium text-right">
                          {pool.status.charAt(0).toUpperCase() + pool.status.slice(1)}
                        </span>
                      </div>
                      
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-sm font-medium text-gray-700 mb-3">
                        Co-riders ({activeParticipantsCount}):
                      </p>
                      {/* FIX 2: LAYOUT - Use flex-wrap and gap-4 to create the two-column grid */}
                      <div className="flex flex-wrap gap-4"> 
                        {pool.participants?.map((participant) => (
                            <ParticipantCard key={participant._id} participant={participant} />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Completed Rides */}
        <div className="mb-8">
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
                // Check if the current user has rated *any* co-rider for this pool
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
        
        {/* Cancelled Rides (New Section) */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Cancelled Rides ({cancelledRides.length})
          </h3>
          {cancelledRides.length === 0 ? (
            <div className="bg-white p-8 rounded-xl shadow-md text-center text-gray-500">
              No cancelled rides
            </div>
          ) : (
            <div className="space-y-4">
              {cancelledRides.map((pool) => (
                  <div
                    key={pool._id}
                    className="bg-white p-6 rounded-xl shadow-md opacity-70 border border-red-300"
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
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                            Cancelled
                          </span>
                          <span className="text-xs">
                            {pool.createdBy._id === user.id ? "(Created by you)" : `(Cancelled by ${pool.createdBy.name})`}
                          </span>
                        </div>
                      </div>
                      <XCircle size={32} className="text-red-500"/>
                    </div>
                  </div>
              ))}
            </div>
          )}
        </div>
        
      </div>

      {selectedRide && (
        <RatingModal
          pool={selectedRide}
          // Pass the complete participant objects which contain nested user data
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