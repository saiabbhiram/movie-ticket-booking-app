function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isPositiveInt(value) {
  const num = Number(value);
  return Number.isInteger(num) && num > 0;
}

function isPositiveNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0;
}

module.exports = {
  isNonEmptyString,
  isValidEmail,
  isPositiveInt,
  isPositiveNumber,
};
