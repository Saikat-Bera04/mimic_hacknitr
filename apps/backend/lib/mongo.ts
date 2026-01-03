import { MongoClient, Db } from "mongodb";

let client: MongoClient | null = null;
let dbInstance: Db | null = null;

export async function connectToMongo(uri: string, dbName: string) {
  if (client && dbInstance) return dbInstance;
  client = new MongoClient(uri);
  await client.connect();
  dbInstance = client.db(dbName);
  console.log("Connected to MongoDB", dbName);
  return dbInstance;
}

export function getDb() {
  if (!dbInstance) throw new Error("MongoDB not initialized. Call connectToMongo first.");
  return dbInstance;
}

export function closeMongo() {
  if (!client) return;
  return client.close();
}
