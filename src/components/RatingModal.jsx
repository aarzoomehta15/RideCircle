import React, { useState } from "react";
import { X, AlertTriangle, Star } from "lucide-react";

const RatingModal = ({
  pool,
  participants,
  currentUserId,
  onSubmit,
  onClose,
}) => {
  const [ratingData, setRatingData] = useState({
    rateeId: "",
    score: 5,
    comment: "",
    safetyFlag: false,
  });

  const handleSubmit = () => {
    if (!ratingData.rateeId) {
      alert("Please select a rider to rate");
      return;
    }
    onSubmit(ratingData);
  };

  const coRiders = participants.filter((p) => p._id !== currentUserId);

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
              value={ratingData.rateeId}
              onChange={(e) =>
                setRatingData({ ...ratingData, rateeId: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Choose a rider...</option>
              {coRiders.map((rider) => (
                <option key={rider._id} value={rider._id}>
                  {rider.name}
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
            disabled={!ratingData.rateeId}
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
