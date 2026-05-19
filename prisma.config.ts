import path from 'node:path'
import { defineConfig } from 'prisma/config'
import { configDotenv } from 'dotenv'

configDotenv({ path: path.resolve(__dirname, '.env') })

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    url: process.env.DIRECT_URL ?? '',
  },
})
