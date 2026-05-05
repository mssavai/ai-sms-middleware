import dotenv from 'dotenv';

dotenv.config();

export default {
  port: process.env.PORT || 3000,
  openaiKey: process.env.OPENAI_API_KEY,
  dbUrl: process.env.DATABASE_URL,
};