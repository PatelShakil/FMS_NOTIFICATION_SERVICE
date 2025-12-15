/**
 * Swagger/OpenAPI Configuration
 * API documentation setup
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BoloIndia Notification Service API',
      version: '1.0.0',
      description: 'REST API documentation for notification-service - Email notification management system',
      contact: {
        name: 'CipherCrew',
        email: 'support@boloindia.in',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:8092',
        description: 'Development server',
      },
      {
        url: 'https://api.boloindia.in/notification',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token from auth-service',
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'API key for webhook endpoints',
        },
      },
      schemas: {
        Notification: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            eventType: {
              type: 'string',
              example: 'org.approved',
            },
            recipientEmail: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            recipientName: {
              type: 'string',
              example: 'John Doe',
            },
            subject: {
              type: 'string',
              example: 'Welcome to BoloIndia - Organization Approved!',
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'SENT', 'FAILED', 'RETRY'],
              example: 'SENT',
            },
            priority: {
              type: 'string',
              enum: ['HIGH', 'MEDIUM', 'LOW'],
              example: 'HIGH',
            },
            deliveryAttempts: {
              type: 'number',
              example: 1,
            },
            sentAt: {
              type: 'string',
              format: 'date-time',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        NotificationPreference: {
          type: 'object',
          properties: {
            userId: {
              type: 'number',
              example: 123,
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            emailEnabled: {
              type: 'boolean',
              example: true,
            },
            emailOnResponseSubmitted: {
              type: 'boolean',
              example: true,
            },
            emailOnResponseResolved: {
              type: 'boolean',
              example: true,
            },
            emailOnQrAssigned: {
              type: 'boolean',
              example: true,
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
            error: {
              type: 'string',
              example: 'Detailed error description',
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Operation successful',
            },
            data: {
              type: 'object',
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false,
                  },
                  message: {
                    type: 'string',
                    example: 'Validation error',
                  },
                  errors: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        field: {
                          type: 'string',
                        },
                        message: {
                          type: 'string',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Notifications',
        description: 'Notification management endpoints',
      },
      {
        name: 'Preferences',
        description: 'User notification preference endpoints',
      },
      {
        name: 'Webhook',
        description: 'Manual notification trigger endpoints',
      },
      {
        name: 'Health',
        description: 'Health check and monitoring endpoints',
      },
      {
        name: 'Metrics',
        description: 'Prometheus metrics endpoint',
      },
    ],
  },
  apis: ['./src/routes/*.js'], // Path to route files with JSDoc annotations
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
