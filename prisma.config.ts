import path from 'node:path'
import { defineConfig } from 'prisma/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { configDotenv } from 'dotenv'

configDotenv({ path: path.resolve(__dirname, '.env') })

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    url: process.env.DIRECT_URL,
  },
  // @ts-expect-error — 'migrate' is a valid Prisma 7 config key but missing from bundled types
  migrate: {
    async adapter() {
      const pool = new Pool({ connectionString: process.env.DIRECT_URL })
      // @ts-expect-error — @types/pg version conflict between root and @prisma/adapter-pg's bundled types
      return new PrismaPg(pool)
    },
  },
})
