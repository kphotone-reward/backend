const validatePassword = (password) => {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#]).{8,}$/.test(password);
};

const passwordErrorMessage =
  "Password must be at least 8 characters and include uppercase, lowercase, number, and special character";

module.exports = { validatePassword, passwordErrorMessage };