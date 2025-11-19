import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { poolService } from "../services/poolService";
import Header from "../components/Header";
import PoolCard from "../components/PoolCard";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

const JoinPool = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pools, setPools] = useState([]);
  const [creators, setCreators] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: "all",
    // CHANGE: Removed 'community' filter from state
    date: "",
  });

  const loadPools = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch all upcoming pools
      const response = await poolService.getPools({ status: "upcoming" });

      const initialPools = response.pools || [];

      setPools(initialPools);

      // Create creators map
      const creatorsMap = {};
      initialPools.forEach((pool) => {
        if (pool.createdBy) {
          creatorsMap[pool._id] = pool.createdBy;
        }
      });
      setCreators(creatorsMap);
    } catch (err) {
      setError(err.message || "Failed to load pools");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPools();
  }, [loadPools]);

  // CORE LOGIC: Filter pools based on visibility rules and user-selected filters
  const isPoolAvailableForUser = useCallback((pool) => {
    const creator = creators[pool._id];
    
    // Normalize user and creator communities (as arrays)
    // NOTE: Community fields should now be arrays due to the previous set of fixes.
    const userCommunities = Array.isArray(user?.community) ? user.community : [];
    const creatorCommunities = Array.isArray(creator?.community) ? creator.community : [];

    // 1. User already a participant or pool is full
    const isParticipant = pool.participants.some((p) => p.user._id === user.id);
    const isFull = pool.participants.filter(p => p.status === 'joined').length >= pool.maxSeats;
    if (isParticipant || isFull) {
        return false;
    }

    // 2. Pool Type Visibility Rules (The core requirement)
    
    // a. Women-Only Restriction
    if (pool.type === 'women-only' && user.gender === 'male') {
        return false;
    }
    
    // b. Community-Only Restriction (CORE NEW LOGIC)
    // If the pool is community-only, the user must share AT LEAST ONE community with the creator.
    if (pool.type === 'community') {
        // Check for intersection: returns true if any community in the creator's list is also in the user's list.
        const hasSharedCommunity = creatorCommunities.some(c => userCommunities.includes(c));
        
        if (!hasSharedCommunity) {
            return false;
        }
    }

    // 3. Optional UI Filters
    
    // a. Type filter
    if (filters.type !== "all" && pool.type !== filters.type) {
      return false;
    }

    // b. Date filter
    if (filters.date) {
      const poolDate = new Date(pool.date).toISOString().split("T")[0];
      if (poolDate !== filters.date) {
        return false;
      }
    }

    return true;
  }, [user, filters, creators]);

  const handleJoinPool = async (poolId) => {
    try {
      await poolService.joinPool(poolId);
      alert("Successfully joined the pool!");
      navigate("/my-rides");
    } catch (err) {
      alert(err.message || "Failed to join pool");
    }
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters({
      ...filters,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const filteredPools = pools.filter(isPoolAvailableForUser);

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

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Find a Pool</h2>

          {/* Filters */}
          <div className="bg-white p-4 rounded-xl shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pool Type
                </label>
                <select
                  name="type"
                  value={filters.type}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Types</option>
                  <option value="open">Open to All</option>
                  <option value="women-only">Women Only</option>
                  <option value="community">Community Only</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={filters.date}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* CHANGE: Combined clear filter into last column and removed 'Same community only' toggle */}
              <div className="md:col-span-2 flex items-end justify-end">
                <button
                  onClick={() =>
                    setFilters({ type: "all", date: "" })
                  }
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {loading && <LoadingSpinner message="Loading available pools..." />}

        {error && <ErrorMessage message={error} onRetry={loadPools} />}

        {!loading && !error && (
          <div className="space-y-4">
            {filteredPools.length === 0 ? (
              <div className="bg-white p-12 rounded-xl shadow-md text-center">
                <Search size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-2">
                  No pools found matching your criteria
                </p>
                <button
                  onClick={() => navigate("/create-pool")}
                  className="text-indigo-600 hover:underline"
                >
                  Create a new pool instead
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Found {filteredPools.length} available{" "}
                  {filteredPools.length === 1 ? "pool" : "pools"}
                </p>
                {filteredPools.map((pool) => (
                  <PoolCard
                    key={pool._id}
                    pool={pool}
                    creator={creators[pool._id]}
                    onJoin={handleJoinPool}
                    showJoinButton={true}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinPool;