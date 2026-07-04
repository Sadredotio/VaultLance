export const validateRegisterForm = (name, email, password, confirmPassword) => {
  const errors = {};

  // Name validation
  if (!name.trim()) {
    errors.name = 'Full name is required';
  } else if (name.length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }

  // Email validation
  if (!email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Password validation
  if (!password) {
    errors.password = 'Password is required';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  // Confirm password validation
  if (!confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
};
