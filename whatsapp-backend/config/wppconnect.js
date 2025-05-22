const axios = require('axios');

const WPPCONNECT_URL = process.env.WPPCONNECT_URL || 'http://localhost:21465';
const WPP_SESSION = process.env.WPP_SESSION || 'tes4';
const WPP_TOKEN = process.env.WPP_TOKEN;

// Cliente configurado para WPPConnect
const wppClient = axios.create({
  baseURL: WPPCONNECT_URL,
  headers: {
    'Authorization': `Bearer ${WPP_TOKEN}`,
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Interceptor para logging de requests
wppClient.interceptors.request.use(
  (config) => {
    console.log(`🔄 WPP Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ WPP Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para logging de responses
wppClient.interceptors.response.use(
  (response) => {
    console.log(`✅ WPP Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`❌ WPP Response Error: ${error.response?.status} ${error.config?.url}`);
    return Promise.reject(error);
  }
);

module.exports = {
  wppClient,
  WPP_SESSION,
  WPPCONNECT_URL
};