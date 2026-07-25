import type { Express } from 'express'
import swaggerUi from 'swagger-ui-express'
import { openApiSpec } from './openapi.js'

export function mountSwagger(app: Express): void {
  app.get('/api/docs.json', (_request, response) => {
    response.json(openApiSpec)
  })

  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, {
      customSiteTitle: 'NexaVest API Docs',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        tryItOutEnabled: true,
        filter: true,
      },
    }),
  )
}
