import dotenv from "dotenv";
dotenv.config();

const required = [
  "DATABASE_URL",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
] as const;

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

export const env = {
  DATABASE_URL: process.env.DATABASE_URL!,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET!,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES || "15m",
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || "7d",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  HF_API_KEY: process.env.HF_API_KEY || "",
  PORT: Number(process.env.PORT) || 4000,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "http://localhost:5173",
};
