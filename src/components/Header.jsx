import React from "react";
import { useNavigate } from "react-router-dom";
import { Users, Home, Calendar, User, LogOut, Shield } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Header = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate("/dashboard")}
        >
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Users className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">RideCircle</h1>
            <p className="text-xs text-gray-500">SafeShare Community</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-gray-700 hover:text-indigo-600 flex items-center gap-2 transition-colors"
          >
            <Home size={20} />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => navigate("/my-rides")}
            className="text-gray-700 hover:text-indigo-600 flex items-center gap-2 transition-colors"
          >
            <Calendar size={20} />
            <span>My Rides</span>
          </button>
          <button
            onClick={() => navigate("/profile")}
            className="text-gray-700 hover:text-indigo-600 flex items-center gap-2 transition-colors"
          >
            <User size={20} />
            <span>Profile</span>
          </button>
          <button
            onClick={handleLogout}
            className="text-red-600 hover:text-red-700 flex items-center gap-2 transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </nav>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
            <div className="flex items-center gap-1 justify-end">
              <Shield size={14} className="text-green-600" />
              <span className="text-xs text-gray-600">
                Trust: {user?.trustScore || 50}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-200">
        <div className="flex justify-around py-2">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex flex-col items-center text-gray-700 hover:text-indigo-600 p-2"
          >
            <Home size={20} />
            <span className="text-xs mt-1">Home</span>
          </button>
          <button
            onClick={() => navigate("/my-rides")}
            className="flex flex-col items-center text-gray-700 hover:text-indigo-600 p-2"
          >
            <Calendar size={20} />
            <span className="text-xs mt-1">Rides</span>
          </button>
          <button
            onClick={() => navigate("/profile")}
            className="flex flex-col items-center text-gray-700 hover:text-indigo-600 p-2"
          >
            <User size={20} />
            <span className="text-xs mt-1">Profile</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex flex-col items-center text-red-600 hover:text-red-700 p-2"
          >
            <LogOut size={20} />
            <span className="text-xs mt-1">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
