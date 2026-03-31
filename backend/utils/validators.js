/**
 * Validate full name
 * @param {string} name - Full name to validate
 * @returns {boolean} Validation result
 */
const validateFullName = (name) => {
  if (!name) return false;
  return name.length >= 2 && name.length <= 50;
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Validation result
 */
const validateEmail = (email) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} Validation result
 */
const validatePhoneNumber = (phone) => {
  const phoneRegex = /^[0-9]{10,15}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result with details
 */
const validatePassword = (password) => {
  const minLength = 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[@$!%*?&]/.test(password);
  const isValidLength = password.length >= minLength;
  
  const isValid = isValidLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
  
  return {
    isValid,
    errors: {
      minLength: !isValidLength ? `Password must be at least ${minLength} characters` : null,
      uppercase: !hasUppercase ? 'Password must contain at least one uppercase letter' : null,
      lowercase: !hasLowercase ? 'Password must contain at least one lowercase letter' : null,
      number: !hasNumber ? 'Password must contain at least one number' : null,
      specialChar: !hasSpecialChar ? 'Password must contain at least one special character (@$!%*?&)' : null
    }
  };
};

/**
 * Validate password match
 * @param {string} password - Password
 * @param {string} confirmPassword - Confirm password
 * @returns {boolean} Validation result
 */
const validatePasswordMatch = (password, confirmPassword) => {
  return password === confirmPassword;
};

export {
  validateFullName,
  validateEmail,
  validatePhoneNumber,
  validatePassword,
  validatePasswordMatch
};