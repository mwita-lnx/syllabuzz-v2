const mongoose = require('mongoose');
const logger = require('../utils/logger');

const setupMongoose = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/syllabuzz";
        if (!mongoUri.startsWith("mongodb://") && !mongoUri.startsWith("mongodb+srv://")) {
            throw new Error(`Invalid MongoDB URI: ${mongoUri}`);
        }

        await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

        logger.info("MongoDB connection established successfully");
        return mongoose.connection;
    } catch (error) {
        logger.error("Failed to connect to MongoDB:", error);
        process.exit(1); // Exit the process if connection fails
    }
};

module.exports = { setupMongoose, connection: mongoose.connection };
