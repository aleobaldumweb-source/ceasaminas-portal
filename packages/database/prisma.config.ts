import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, env } from 'prisma/config';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(currentDirectory, '../..');

dotenv.config({ path: path.join(workspaceRoot, '.env') });

export default defineConfig({
  schema: path.join(currentDirectory, 'prisma/schema.prisma'),
  migrations: {
    path: path.join(currentDirectory, 'prisma/migrations'),
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
