import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables before anything else
dotenv.config({ path: path.resolve(process.cwd(), '.env.test'), override: true });
