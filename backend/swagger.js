const swaggerAutogen = require('swagger-autogen')({ openapi: '3.0.0' });
const fs = require('fs');

const doc = {
    info: {
        title: 'Venue Booking API',
        version: '1.0.0',
        description: 'Auto-generated API documentation for the Venue Booking platform',
        contact: { name: 'API Support' },
    },
    servers: [
        { url: 'http://localhost:5000', description: 'Development Server' },
        { url: 'https://your-production-url.com', description: 'Production Server' },
    ],

    components: {
        securitySchemes: {
            bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
    },

    security: [{ bearerAuth: [] }],

    tags: [
        { name: 'Auth', description: 'Authentication & registration' },
        { name: 'Venues', description: 'Public venue browsing' },
        { name: 'Bookings', description: 'Booking management' },
        { name: 'Owner', description: 'Venue owner operations' },
        { name: 'Admin', description: 'Admin panel operations' },
        { name: 'Upload', description: 'File / image uploads' },
    ],
};

// ─── Prefix → Tag (longest first to avoid partial matches) ───────────────────
const TAG_MAP = [
    { prefix: '/api/bookings', tag: 'Bookings' },
    { prefix: '/api/venues', tag: 'Venues' },
    { prefix: '/api/upload', tag: 'Upload' },
    { prefix: '/api/owner', tag: 'Owner' },
    { prefix: '/api/admin', tag: 'Admin' },
    { prefix: '/api/auth', tag: 'Auth' },
];

function assignTagsFromPaths(outputFile) {
    const spec = JSON.parse(fs.readFileSync(outputFile, 'utf8'));

    for (const [routePath, methods] of Object.entries(spec.paths || {})) {
        const match = TAG_MAP.find(({ prefix }) => routePath.startsWith(prefix));
        if (!match) continue;

        for (const operation of Object.values(methods)) {
            if (typeof operation !== 'object' || Array.isArray(operation)) continue;
            operation.tags = [match.tag];
        }
    }

    fs.writeFileSync(outputFile, JSON.stringify(spec, null, 2));
    console.log('🏷️   Tags auto-assigned from URL prefixes');
}

// ─────────────────────────────────────────────────────────────────────────────

const outputFile = './swagger-output.json';
const routes = ['./server.js'];

swaggerAutogen(outputFile, routes, doc).then(() => {
    assignTagsFromPaths(outputFile);
    console.log('✅  swagger-output.json generated successfully');
});