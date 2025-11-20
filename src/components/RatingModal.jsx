import React, { useState, useEffect } from "react"; 
import { X, AlertTriangle, Star } from "lucide-react";

const RatingModal = ({
  pool,
  participants,
  currentUserId,
  onSubmit,
  onClose,
}) => {
  // Filter for active, non-current users. Access nested 'user' object for data.
  const coRiders = participants.filter((p) => p.user._id !== currentUserId && p.status === 'joined');
  
  const [ratedUserId, setRatedUserId] = useState("");

  const [ratingData, setRatingData] = useState({
    ratedUserId: "", 
    score: 5,
    comment: "",
    safetyFlag: false,
  });
  
  // Set default rated user on mount
  useEffect(() => {
    if (coRiders.length > 0 && !ratedUserId) {
      setRatedUserId(coRiders[0].user._id);
      setRatingData(prev => ({ 
          ...prev, 
          ratedUserId: coRiders[0].user._id 
      }));
    }
  }, [coRiders.length]);


  const handleSubmit = () => {
    if (!ratingData.ratedUserId) {
      alert("Please select a rider to rate");
      return;
    }
    
    // The onSubmit function in MyRides.jsx expects the combined payload
    onSubmit(ratingData);
  };
  
  const handleSelectChange = (e) => {
    setRatedUserId(e.target.value);
    setRatingData({ 
        // Reset rating for new user
        ratedUserId: e.target.value,
        score: 5,
        comment: "",
        safetyFlag: false,
    });
  }

  // Handle case where there are no co-riders to rate
  if (coRiders.length === 0) {
      return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                  <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900">No Co-riders to Rate</h3>
                      <button
                          onClick={onClose}
                          className="text-gray-400 hover:text-gray-600 transition"
                      >
                          <X size={24} />
                      </button>
                  </div>
                  <p className="text-gray-600">You were the only active participant left on this ride, or all co-riders have left.</p>
                  <button
                      onClick={onClose}
                      className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 mt-4 transition"
                  >
                      Close
                  </button>
              </div>
          </div>
      );
  }


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">
            Rate Your Co-riders
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Rider
            </label>
            <select
              value={ratedUserId}
              onChange={handleSelectChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Choose a rider...</option>
              {coRiders.map((p) => (
                // Use p.user._id and p.user.name from the populated object
                <option key={p.user._id} value={p.user._id}>
                  {p.user.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating: {ratingData.score}/5
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={ratingData.score}
              onChange={(e) =>
                setRatingData({
                  ...ratingData,
                  score: parseInt(e.target.value),
                })
              }
              className="w-full"
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500">Poor</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((num) => (
                  <Star
                    key={num}
                    size={16}
                    className={
                      num <= ratingData.score
                        ? "text-yellow-500 fill-yellow-500"
                        : "text-gray-300"
                    }
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500">Excellent</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comment (Optional)
            </label>
            <textarea
              value={ratingData.comment}
              onChange={(e) =>
                setRatingData({ ...ratingData, comment: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows="3"
              placeholder="Share your experience..."
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer p-3 bg-red-50 rounded-lg hover:bg-red-100 transition">
            <input
              type="checkbox"
              checked={ratingData.safetyFlag}
              onChange={(e) =>
                setRatingData({ ...ratingData, safetyFlag: e.target.checked })
              }
              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
            />
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-600" />
              <span className="text-sm text-red-700 font-medium">
                Report safety concern
              </span>
            </div>
          </label>

          <button
            onClick={handleSubmit}
            disabled={!ratingData.ratedUserId}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
          >
            Submit Rating
          </button>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;