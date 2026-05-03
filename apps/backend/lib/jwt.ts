import jwt, { SignOptions } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET environment variable is required");
const JWT_EXPIRES_IN: string | number = process.env.JWT_EXPIRES_IN || "7d";

export function signJwt(payload: object) {
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN as SignOptions["expiresIn"] };
  return jwt.sign(payload, JWT_SECRET!, options);
}

export function verifyJwt<T = unknown>(token: string): T | null {
  try {
    return jwt.verify(token, JWT_SECRET!) as T;
  } catch {
    return null;
  }
}
