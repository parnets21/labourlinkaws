const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Job Portal API Documentation',
            version: '1.0.0',
            description: 'API documentation for Patheya IBH Private Limited Job Portal',
            contact: {
                name: 'API Support',
                email: 'support@patheya.com'
            }
        },
        servers: [
            {
                url: process.env.API_URL || 'http://localhost:3000',
                description: 'Development server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [{
            bearerAuth: []
        }]
    },
    apis: ['./Routes/*.js', './docs/*.yaml']
};

module.exports = swaggerJsdoc(options);
