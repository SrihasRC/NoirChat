import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path:path.resolve(__dirname, '../../.env') });

export const {
    PORT = "5500",
    NODE_ENV,
    DB_URI,
    JWT_SECRET, 
    JWT_EXPIRATION
} = process.env as {
    PORT: string;
    NODE_ENV: string;
    DB_URI: string;
    JWT_SECRET: string;
    JWT_EXPIRATION: string;
};