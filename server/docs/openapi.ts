import type { OpenAPIV3 } from 'openapi-types'

const errorResponse: OpenAPIV3.ResponseObject = {
  description: 'Error response',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
    },
  },
}

const bearerAuth: OpenAPIV3.SecurityRequirementObject[] = [{ bearerAuth: [] }]
const cronAuth: OpenAPIV3.SecurityRequirementObject[] = [{ cronAuth: [] }]

export const openApiSpec: OpenAPIV3.Document = {
  openapi: '3.0.3',
  info: {
    title: 'NexaVest API',
    version: '1.0.0',
    description: [
      'Investment and 3-level referral platform API.',
      '',
      '**Auth:** click **Authorize** and paste a JWT from `/api/auth/login` or `/api/auth/register`.',
      '',
      '**Cron:** use `Bearer <CRON_SECRET>` for the ROI job endpoint.',
      '',
      'Success shape: `{ success: true, data }` · Error shape: `{ success: false, error: { code, message } }`.',
    ].join('\n'),
  },
  servers: [
    { url: 'http://127.0.0.1:3000', description: 'Local API' },
    { url: '/', description: 'Current host (Vercel / proxied Vite)' },
  ],
  tags: [
    { name: 'Health', description: 'Liveness checks' },
    { name: 'Auth', description: 'Register, login, password' },
    { name: 'Investments', description: 'Create and list investments' },
    { name: 'Dashboard', description: 'Summary metrics and earnings history' },
    { name: 'Referrals', description: 'Direct list and nested tree' },
    { name: 'Cron', description: 'Scheduled daily ROI' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT from login or register',
      },
      cronAuth: {
        type: 'http',
        scheme: 'bearer',
        description: 'Same value as the CRON_SECRET environment variable',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string', example: 'Invalid request body' },
            },
          },
        },
      },
      AuthUser: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          fullName: { type: 'string', example: 'Rajan Kumar' },
          email: { type: 'string', example: 'rajan@example.com' },
          mobileNumber: { type: 'string', example: '+919876543210' },
          referralCode: { type: 'string', example: 'NEXA-RK24' },
          accountStatus: { type: 'string', example: 'active' },
        },
      },
      AuthResult: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              token: { type: 'string' },
              user: { $ref: '#/components/schemas/AuthUser' },
            },
          },
        },
      },
      RegisterBody: {
        type: 'object',
        required: ['fullName', 'email', 'mobileNumber', 'password'],
        properties: {
          fullName: { type: 'string', minLength: 2, maxLength: 100, example: 'Rajan Kumar' },
          email: { type: 'string', format: 'email', example: 'rajan@example.com' },
          mobileNumber: {
            type: 'string',
            pattern: '^\\+?[1-9]\\d{7,14}$',
            example: '+919876543210',
          },
          password: {
            type: 'string',
            minLength: 8,
            description: 'Min 8 chars with upper, lower, and number',
            example: 'SecurePass1',
          },
          referralCode: {
            type: 'string',
            minLength: 5,
            maxLength: 20,
            example: 'NEXA24',
            description: 'Optional upline referral code',
          },
        },
      },
      LoginBody: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'rajan@example.com' },
          password: { type: 'string', example: 'SecurePass1' },
        },
      },
      ChangePasswordBody: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string' },
          newPassword: {
            type: 'string',
            minLength: 8,
            description: 'Min 8 chars with upper, lower, and number',
          },
        },
      },
      CreateInvestmentBody: {
        type: 'object',
        required: ['amount', 'planName', 'durationDays', 'dailyRoiPercentage'],
        properties: {
          amount: {
            type: 'number',
            minimum: 1000,
            maximum: 10_000_000,
            example: 100000,
            description: 'Amount in INR rupees (stored as paise)',
          },
          planName: { type: 'string', example: 'Evergreen Growth' },
          durationDays: { type: 'integer', minimum: 30, maximum: 1095, example: 180 },
          dailyRoiPercentage: { type: 'number', minimum: 0.01, maximum: 10, example: 1 },
        },
      },
      PaginationQuery: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        },
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        description: 'Does not open a database connection.',
        responses: {
          200: {
            description: 'Service is up',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: { status: { type: 'string', example: 'ok' } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/RegisterBody' } },
          },
        },
        responses: {
          201: {
            description: 'Account created',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/AuthResult' } },
            },
          },
          400: errorResponse,
          409: errorResponse,
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/LoginBody' } },
          },
        },
        responses: {
          200: {
            description: 'Authenticated',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/AuthResult' } },
            },
          },
          401: errorResponse,
        },
      },
    },
    '/api/auth/change-password': {
      post: {
        tags: ['Auth'],
        summary: 'Change password',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ChangePasswordBody' } },
          },
        },
        responses: {
          200: { description: 'Password updated' },
          401: errorResponse,
          400: errorResponse,
        },
      },
    },
    '/api/investments': {
      post: {
        tags: ['Investments'],
        summary: 'Create investment',
        description: 'Creates an investment and distributes level income (5% / 3% / 2%) in one transaction.',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CreateInvestmentBody' } },
          },
        },
        responses: {
          201: { description: 'Investment created' },
          401: errorResponse,
          400: errorResponse,
        },
      },
      get: {
        tags: ['Investments'],
        summary: 'List investments',
        security: bearerAuth,
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: { description: 'Paginated investments' },
          401: errorResponse,
        },
      },
    },
    '/api/dashboard/summary': {
      get: {
        tags: ['Dashboard'],
        summary: 'Portfolio summary',
        security: bearerAuth,
        responses: {
          200: {
            description: 'Totals for investments, ROI, level income, and wallet',
          },
          401: errorResponse,
        },
      },
    },
    '/api/dashboard/history': {
      get: {
        tags: ['Dashboard'],
        summary: 'Earnings history',
        description: 'ROI credits and referral income history.',
        security: bearerAuth,
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: { description: 'ROI + referral history' },
          401: errorResponse,
        },
      },
    },
    '/api/referrals/direct': {
      get: {
        tags: ['Referrals'],
        summary: 'Direct referrals',
        description: 'Flat list of level-1 referrals.',
        security: bearerAuth,
        responses: {
          200: { description: 'Direct referrals' },
          401: errorResponse,
        },
      },
    },
    '/api/referrals/tree': {
      get: {
        tags: ['Referrals'],
        summary: 'Referral tree',
        description: 'Nested downline tree (max depth 10).',
        security: bearerAuth,
        responses: {
          200: { description: 'Nested referral nodes' },
          401: errorResponse,
        },
      },
    },
    '/api/cron/daily-roi': {
      get: {
        tags: ['Cron'],
        summary: 'Run daily ROI',
        description: 'Idempotent daily ROI processor. Protected by CRON_SECRET.',
        security: cronAuth,
        responses: {
          200: { description: 'ROI processing result' },
          401: errorResponse,
        },
      },
    },
  },
}
