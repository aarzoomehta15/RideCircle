export const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatTime = (time) => {
  return time; // Already in HH:MM format
};

export const isDateInPast = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(date) < today;
};

export const getTodayDate = () => {
  return formatDate(new Date());
};

export const getMinDate = () => {
  return getTodayDate();
};

// NEW: Function to check if a cancellation is a "late" cancellation (e.g., within 1 hour)
export const isLateCancellation = (dateString, timeString) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const poolDateTime = new Date(dateString);
  poolDateTime.setHours(hours, minutes, 0, 0);

  const now = new Date();
  const diffInMinutes = (poolDateTime.getTime() - now.getTime()) / (1000 * 60);

  // Consider it a late cancellation if the ride is in the future but less than 60 minutes away.
  return diffInMinutes > 0 && diffInMinutes < 60; 
};

// NEW: Function to check if a ride's scheduled time has passed
export const hasRideTimePassed = (dateString, timeString) => {
  if (!dateString || !timeString) return false;
  
  const [hours, minutes] = timeString.split(':').map(Number);
  const poolDateTime = new Date(dateString);
  poolDateTime.setHours(hours, minutes, 0, 0);

  const now = new Date();
  // Check if the scheduled time is in the past
  return poolDateTime.getTime() < now.getTime();
};

// NEW: Function to get the current time formatted as HH:MM for input validation
export const getCurrentTimeHHMM = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}