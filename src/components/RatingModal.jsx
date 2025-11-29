import React, { useState, useEffect } from "react";
import { X, AlertTriangle, Star } from "lucide-react";

const RatingModal = ({
  pool,
  participants,
  currentUserId,
  onSubmit,
  onClose,
}) => {
  // Filter for active, non-current users.
  const coRiders = participants.filter(
    (p) => p.user._id !== currentUserId && p.status === "joined"
  );

  const [ratedUserId, setRatedUserId] = useState("");
  const [hoveredStar, setHoveredStar] = useState(0); // State for hover effect

  const [ratingData, setRatingData] = useState({
    ratedUserId: "",
    score: 5,
  });

  // Set default rated user on mount
  useEffect(() => {
    if (coRiders.length > 0 && !ratedUserId) {
      setRatedUserId(coRiders[0].user._id);
      setRatingData((prev) => ({
        ...prev,
        ratedUserId: coRiders[0].user._id,
      }));
    }
  }, [coRiders.length]);

  const handleSubmit = () => {
    if (!ratingData.ratedUserId) {
      alert("Please select a rider to rate");
      return;
    }
    onSubmit(ratingData);
  };

  const handleSelectChange = (e) => {
    setRatedUserId(e.target.value);
    setRatingData({
      // Reset rating for new user
      ratedUserId: e.target.value,
      score: 5,
    });
  };

  // Handle case where there are no co-riders to rate
  if (coRiders.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">
              No Co-riders to Rate
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <X size={24} />
            </button>
          </div>
          <p className="text-gray-600">
            You were the only active participant left on this ride, or all
            co-riders have left.
          </p>
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

        <div className="space-y-6">
          {/* Rider Selection */}
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
                <option key={p.user._id} value={p.user._id}>
                  {p.user.name}
                </option>
              ))}
            </select>
          </div>

          {/* Star Rating Interaction */}
          <div className="flex flex-col items-center">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              How was your experience?
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() =>
                    setRatingData({ ...ratingData, score: star })
                  }
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    size={32}
                    className={`${
                      star <= (hoveredStar || ratingData.score)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    } transition-colors duration-200`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2 font-medium">
              {hoveredStar || ratingData.score} out of 5
            </p>
          </div>

          {/* Comment Section */}
          {/* <div>
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
          </div> */}

          {/* Safety Flag */}
          {/* <label className="flex items-center gap-3 cursor-pointer p-3 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition">
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                checked={ratingData.safetyFlag}
                onChange={(e) =>
                  setRatingData({ ...ratingData, safetyFlag: e.target.checked })
                }
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-600" />
              <span className="text-sm font-medium text-red-800">
                Report a safety concern
              </span>
            </div>
          </label> */}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!ratingData.ratedUserId}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition shadow-sm"
          >
            Submit Rating
          </button>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;