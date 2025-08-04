// config.js
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables from .env file
dotenv.config();

// Environment-specific configurations
const environments = {
  development: {
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/syllabuzz',
    jwtSecret: process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || 'dev_jwt_secret_change_in_production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    port: process.env.PORT || 4000,
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:4000'],
    logLevel: process.env.LOG_LEVEL || 'debug'
  },
  test: {
    mongoUri: process.env.TEST_MONGO_URI || 'mongodb://localhost:27017/syllabuzz_test',
    jwtSecret: process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || 'test_jwt_secret_change_in_production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    port: process.env.PORT || 3001,
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
    logLevel: process.env.LOG_LEVEL || 'error'
  },
  production: {
    mongoUri: process.env.MONGO_URI,
    jwtSecret: process.env.JWT_SECRET || process.env.JWT_SECRET_KEY,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    port: process.env.PORT || 4000,
    corsOrigins: process.env.CORS_ORIGINS?.split(','),
    logLevel: process.env.LOG_LEVEL || 'info'
  }
};

// Determine current environment
const env = process.env.NODE_ENV || 'development';
const config = environments[env];

// Configure mongoose connection options
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  autoIndex: env !== 'production', // Disable automatic index creation in production
  serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds instead of 30
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4 // Use IPv4, skip trying IPv6
};

// Mongoose connection function
const connectDatabase = async () => {
  try {
    await mongoose.connect(config.mongoUri, mongooseOptions);
    console.log(`Connected to MongoDB in ${env} mode`);
    
    // Handle connection events
    mongoose.connection.on('error', err => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });
    
    // Handle application termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination');
      process.exit(0);
    });
    
    return mongoose.connection;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

module.exports = {
  ...config,
  env,
  connectDatabase
};