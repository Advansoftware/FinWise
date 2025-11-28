// src/lib/mongodb.ts

import { MongoClient, Db, MongoClientOptions } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'gastometria';

let cachedClient: MongoClient;
let cachedDb: Db;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

if (!MONGODB_DB) {
  throw new Error('Please define the MONGODB_DB environment variable inside .env.local');
}

// Opções de conexão para MongoDB Atlas
const getMongoOptions = (): MongoClientOptions => {
  const isAtlas = MONGODB_URI.includes('mongodb.net') || MONGODB_URI.includes('mongodb+srv');

  const options: MongoClientOptions = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  };

  // Configurações específicas para Atlas (conexão com TLS)
  if (isAtlas) {
    options.tls = true;
    options.tlsAllowInvalidCertificates = false;
    options.tlsAllowInvalidHostnames = false;
    // Força TLS 1.2+ para compatibilidade com Atlas
    options.minHeartbeatFrequencyMS = 500;
  }

  return options;
};

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const options = getMongoOptions();
  const client = await MongoClient.connect(MONGODB_URI, options);

  const db = client.db(MONGODB_DB);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}
