const { MongoClient } = require('mongodb');
let db = null;

const connectDB = async () => {
    try {
        const client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
        db = client.db('noteapp');
        console.log('Connected to MongoDB successfully!');
    } catch (error) {
        console.log('Database connection failed:', error);
    }
};

const getDB = () => {
    if (!db){
        throw new Error('Database not connected, call connectDB() first!');
    }
    return db;
};

module.exports = {
    connectDB,
    getDB
};