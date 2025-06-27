import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path:path.resolve(__dirname, '../../.env') });

export const PORT = process.env.PORT || "5500";
export const NODE_ENV = process.env.NODE_ENV || "development";
export const DB_URI = process.env.DB_URI || "";
export const JWT_SECRET = process.env.JWT_SECRET || "";
export const JWT_EXPIRATION = process.env.JWT_EXPIRATION || "7d";