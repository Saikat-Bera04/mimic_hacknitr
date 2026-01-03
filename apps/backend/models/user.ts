import { getDb } from "../lib/mongo";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

export interface UserRecord {
  _id?: ObjectId;
  email: string;
  passwordHash: string;
  name?: string;
  createdAt: Date;
}

const USERS_COLL = "users";

export async function createUser(email: string, password: string, name?: string) {
  const db = getDb();
  const existing = await db.collection(USERS_COLL).findOne({ email });
  if (existing) throw new Error("User already exists");
  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date();
  const result = await db
    .collection(USERS_COLL)
    .insertOne({ email, passwordHash, name, createdAt: now });
  return { id: result.insertedId.toString(), email, name, createdAt: now };
}

export async function findUserByEmail(email: string) {
  const db = getDb();
  return db.collection<UserRecord>(USERS_COLL).findOne({ email });
}

export async function findUserById(id: string) {
  const db = getDb();
  return db.collection<UserRecord>(USERS_COLL).findOne({ _id: new ObjectId(id) });
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
