import api from "./api";

export const feedbackService = {
  submitFeedback: async (feedbackData) => {
    try {
      const response = await api.post("/feedback", feedbackData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || "Failed to submit feedback";
    }
  },

  getFeedbackForUser: async (userId) => {
    try {
      const response = await api.get(`/feedback/user/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || "Failed to fetch feedback";
    }
  },

  getFeedbackForPool: async (poolId) => {
    try {
      const response = await api.get(`/feedback/pool/${poolId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || "Failed to fetch pool feedback";
    }
  },

  getMyFeedback: async () => {
    try {
      const response = await api.get("/feedback/my-feedback");
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || "Failed to fetch your feedback";
    }
  },
};
