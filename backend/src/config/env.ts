import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path:path.resolve(__dirname, '../../.env') });

export const {
    PORT = "5500",
    DB_URI,
} = process.env as {
    PORT: string;
    DB_URI: string;
};