import React from "react";
import { MapPin, Users, Calendar, Clock, Shield, User } from "lucide-react";

const PoolCard = ({ pool, creator, onJoin, showJoinButton = false }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {creator && (
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gray-100 p-2 rounded-full">
                <User size={20} className="text-gray-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{creator.name}</p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Shield size={14} className="text-green-600" />
                  <span>Trust: {creator.trustScore}</span>
                  {creator.community && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                      {creator.community}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={16} className="text-indigo-600" />
                <span className="text-sm font-semibold text-gray-900">
                  {pool.source}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-green-600" />
                <span className="text-sm font-semibold text-gray-900">
                  {pool.destination}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar size={16} />
                <span>{new Date(pool.date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock size={16} />
                <span>{pool.time}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 text-sm text-gray-600">
                <Users size={16} />
                {pool.participants?.length || 0}/{pool.maxSeats} seats
              </span>
              <span className="text-sm font-semibold text-green-600">
                ₹{pool.fare}/person
              </span>
              <span
                className={`px-2 py-1 rounded text-xs ${
                  pool.type === "women-only"
                    ? "bg-pink-100 text-pink-700"
                    : pool.type === "community"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {pool.type}
              </span>
            </div>

            {showJoinButton && onJoin && (
              <button
                onClick={() => onJoin(pool._id)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Join Pool
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoolCard;
