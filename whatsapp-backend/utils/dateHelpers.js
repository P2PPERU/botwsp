// utils/dateHelpers.js
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('es-PE');
};

const formatDateTime = (date) => {
  return new Date(date).toLocaleString('es-PE');
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const daysBetween = (date1, date2) => {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((date1 - date2) / oneDay));
};

module.exports = {
  formatDate,
  formatDateTime,
  addDays,
  daysBetween
};