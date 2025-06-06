const config = {
  API_URL: process.env.API_URL || 'https://chatbot-backend-v-4.onrender.com',
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot',
  JWT_SECRET: process.env.JWT_SECRET || 'your_jwt_secret',
  NODE_ENV: process.env.NODE_ENV || 'development'
};

module.exports = config; 