import { loadEnv, defineConfig, Modules } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const REDIS_URL = process.env.REDIS_URL
const STRIPE_API_KEY = process.env.STRIPE_API_KEY
const RESEND_API_KEY = process.env.RESEND_API_KEY

/**
 * Redis-backed infra modules. Enabled whenever REDIS_URL is set (dev via
 * docker-compose, and always in staging/prod). Without it, Medusa falls back to
 * in-memory implementations — fine for one-off CLI commands, not for running the
 * server.
 */
const redisModules = REDIS_URL
  ? [
      {
        resolve: '@medusajs/medusa/cache-redis',
        options: { redisUrl: REDIS_URL },
      },
      {
        resolve: '@medusajs/medusa/event-bus-redis',
        options: { redisUrl: REDIS_URL },
      },
      {
        resolve: '@medusajs/medusa/workflow-engine-redis',
        options: { redis: { redisUrl: REDIS_URL } },
      },
      {
        resolve: '@medusajs/medusa/locking',
        options: {
          providers: [
            {
              resolve: '@medusajs/medusa/locking-redis',
              id: 'locking-redis',
              is_default: true,
              options: { redisUrl: REDIS_URL },
            },
          ],
        },
      },
    ]
  : []

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: REDIS_URL,
    workerMode:
      (process.env.MEDUSA_WORKER_MODE as 'shared' | 'worker' | 'server') ||
      'shared',
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    },
  },
  admin: {
    disable: process.env.DISABLE_MEDUSA_ADMIN === 'true',
  },
  modules: [
    ...redisModules,
    { resolve: './src/modules/supplier' },
    { resolve: './src/modules/supplier-order' },
    { resolve: './src/modules/ad-spend' },
    {
      resolve: '@medusajs/medusa/payment',
      options: {
        providers: [
          ...(STRIPE_API_KEY
            ? [
                {
                  resolve: '@medusajs/payment-stripe',
                  id: 'stripe',
                  options: {
                    apiKey: STRIPE_API_KEY,
                    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
                    capture: true,
                  },
                },
              ]
            : []),
        ],
      },
    },
    {
      resolve: '@medusajs/medusa/notification',
      options: {
        providers: [
          RESEND_API_KEY
            ? {
                resolve: './src/modules/notification-resend',
                id: 'resend',
                options: {
                  channels: ['email'],
                  apiKey: RESEND_API_KEY,
                  from: process.env.RESEND_FROM || 'orders@example.com',
                  replyTo: process.env.RESEND_REPLY_TO,
                },
              }
            : {
                resolve: '@medusajs/medusa/notification-local',
                id: 'local',
                options: {
                  channels: ['email'],
                },
              },
        ],
      },
    },
  ],
})
