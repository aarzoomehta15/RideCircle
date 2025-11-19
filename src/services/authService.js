import api from "./api";

export const authService = {
  signup: async (userData) => {
    try {
      const response = await api.post("/auth/signup", userData);
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      // Log full error for debugging and rethrow useful message/object
      console.error("authService.signup error:", error.response || error);
      // Prefer server-provided message, then whole data, then generic message
      const serverMsg = error.response?.data?.message;
      const serverData = error.response?.data;
      throw serverMsg || serverData || error.message || "Signup failed";
    }
  },

  login: async (credentials) => {
    try {
      const response = await api.post("/auth/login", credentials);
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      console.error("authService.login error:", error.response || error);
      const serverMsg = error.response?.data?.message;
      const serverData = error.response?.data;
      throw serverMsg || serverData || error.message || "Login failed";
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  getCurrentUser: () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  updateProfile: async (userId, userData) => {
    try {
      const response = await api.put(`/auth/profile/${userId}`, userData);
      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      console.error(
        "authService.updateProfile error:",
        error.response || error
      );
      const serverMsg = error.response?.data?.message;
      const serverData = error.response?.data;
      throw serverMsg || serverData || error.message || "Profile update failed";
    }
  },
};