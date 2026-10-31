const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { isProduction } = require("./env");

let localServer = null;

// With no mongo_url, development runs on a local MongoDB kept in .data/
const startLocalMongo = async () => {
  const { MongoMemoryServer } = require("mongodb-memory-server");
  const dbPath = path.join(__dirname, "..", "..", ".data");
  fs.mkdirSync(dbPath, { recursive: true });
  for (let attempt = 1; ; attempt += 1) {
    try {
      localServer = await MongoMemoryServer.create({
        instance: { dbPath, storageEngine: "wiredTiger", dbName: "managemate" },
      });
      return localServer.getUri();
    } catch (error) {
      // A restart can begin while the previous mongod is still releasing .data/
      if (attempt >= 20 || !error.message.includes("DBPathInUse")) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
};

const connectDb = async () => {
  let uri = process.env.mongo_url;
  if (!uri) {
    if (isProduction) {
      throw new Error("mongo_url is required in production");
    }
    uri = await startLocalMongo();
    console.log("No mongo_url set, using local MongoDB in .data/");
  }
  await mongoose.connect(uri);
  console.log("Mongo db connected successfully");
  return { isLocal: Boolean(localServer) };
};

const disconnectDb = async () => {
  await mongoose.disconnect();
  if (localServer) {
    await localServer.stop();
  }
};

module.exports = { connectDb, disconnectDb };
