export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone) => {
  const re = /^\d{10}$/;
  return re.test(phone);
};

export const validatePassword = (password) => {
  // At least 6 characters
  return password.length >= 6;
};

export const validateForm = (formData, requiredFields) => {
  const errors = {};

  requiredFields.forEach((field) => {
    if (!formData[field] || formData[field].trim() === "") {
      errors[field] = `${field} is required`;
    }
  });

  if (formData.email && !validateEmail(formData.email)) {
    errors.email = "Invalid email format";
  }

  if (formData.phone && !validatePhone(formData.phone)) {
    errors.phone = "Phone number must be 10 digits";
  }

  if (formData.password && !validatePassword(formData.password)) {
    errors.password = "Password must be at least 6 characters";
  }

  return errors;
};
