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
        schemas: {
            AuthRegister: {
                type: 'object',
                required: ['name', 'email', 'phone', 'password'],
                properties: {
                    name: { type: 'string', example: 'John Doe' },
                    email: { type: 'string', example: 'john@example.com' },
                    phone: { type: 'string', example: '9876543210' },
                    password: { type: 'string', example: 'Strong@123' }
                }
            },
            AuthLogin: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: { type: 'string', example: 'john@example.com' },
                    password: { type: 'string', example: 'Strong@123' }
                }
            },
            UserUpdate: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    phone: { type: 'string' },
                    city: { type: 'string' },
                    state: { type: 'string' },
                    address: { type: 'string' }
                }
            },
            ChangePassword: {
                type: 'object',
                required: ['currentPassword', 'newPassword'],
                properties: {
                    currentPassword: { type: 'string', example: 'OldPass@1' },
                    newPassword: { type: 'string', example: 'NewPass@2' }
                }
            },
            VenueCreate: {
                type: 'object',
                required: ['businessName', 'venueType', 'description', 'capacity', 'areaSqft', 'location', 'amenities', 'pricing', 'termsAccepted'],
                properties: {
                    businessName: { type: 'string', example: 'ABC Conference Hall' },
                    venueType: { type: 'array', items: { type: 'string' }, example: ['Meeting Hall'] },
                    description: { type: 'string' },
                    capacity: { type: 'string', example: '100-200' },
                    areaSqft: { type: 'number', example: 2500 },
                    location: {
                        type: 'object',
                        required: ['address', 'landmark', 'city', 'area', 'pincode', 'googleMapLink', 'parkingAvailability'],
                        properties: {
                            address: { type: 'string' },
                            landmark: { type: 'string' },
                            city: { type: 'string' },
                            area: { type: 'string' },
                            pincode: { type: 'string' },
                            googleMapLink: { type: 'string' },
                            parkingAvailability: { type: 'string', enum: ['Free', 'Paid', 'Limited', 'None'] }
                        }
                    },
                    amenities: { type: 'object' },
                    pricing: { type: 'object' },
                    images: { type: 'array', items: { type: 'object' } },
                    documents: { type: 'object' },
                    bankDetails: { type: 'object' },
                    termsAccepted: { type: 'boolean', example: true }
                }
            },
            VenueUpdate: { $ref: '#/components/schemas/VenueCreate' },
            VenueCustomSettingsUpdate: {
                type: 'object',
                properties: {
                    customPlatformFee: {
                        type: 'object',
                        properties: {
                            enabled: { type: 'boolean' },
                            feeType: { type: 'string', enum: ['fixed', 'percentage'] },
                            feeValue: { type: 'number' }
                        }
                    },
                    customGST: {
                        type: 'object',
                        properties: {
                            enabled: { type: 'boolean' },
                            rate: { type: 'number' }
                        }
                    }
                }
            },
            PlatformSettingsUpdate: {
                type: 'object',
                properties: {
                    gstRate: { type: 'number', example: 18 },
                    platformFeeType: { type: 'string', enum: ['fixed', 'percentage'], example: 'percentage' },
                    platformFeeValue: { type: 'number', example: 5 }
                }
            },
            BookingCreate: {
                type: 'object',
                required: ['venue', 'bookingDate', 'startTime', 'endTime', 'bookingType', 'amount'],
                properties: {
                    venue: { type: 'string', example: '65f0c1...' },
                    bookingDate: { type: 'string', format: 'date', example: '2026-03-20' },
                    startTime: { type: 'string', example: '10:00 AM' },
                    endTime: { type: 'string', example: '02:00 PM' },
                    bookingType: { type: 'string', enum: ['hourly', 'halfday', 'fullday'] },
                    amount: { type: 'number', example: 11800 },
                    selectedAmenities: { type: 'object' },
                    amenitiesTotal: { type: 'number', example: 800 },
                    priceBreakdown: {
                        type: 'object',
                        properties: {
                            basePrice: { type: 'number' },
                            amenitiesTotal: { type: 'number' },
                            subtotal: { type: 'number' },
                            gstRate: { type: 'number' },
                            gst: { type: 'number' },
                            platformFee: { type: 'number' },
                            total: { type: 'number' }
                        }
                    },
                    customerDetails: {
                        type: 'object',
                        properties: {
                            name: { type: 'string' },
                            email: { type: 'string' },
                            phone: { type: 'string' },
                            eventType: { type: 'string' },
                            guestCount: { type: 'number' },
                            specialRequirements: { type: 'string' }
                        }
                    }
                }
            },
            BookingUpdateStatus: {
                type: 'object',
                required: ['status'],
                properties: {
                    status: { type: 'string', enum: ['pending', 'confirmed', 'cancelled', 'completed'] }
                }
            },
            BookingCancel: {
                type: 'object',
                properties: { reason: { type: 'string' } }
            },
            UploadBase64: {
                type: 'object',
                required: ['file'],
                properties: {
                    file: { type: 'string', description: 'base64 encoded data URL' },
                    folder: { type: 'string', example: 'documents' }
                }
            }
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

function augmentSpec(outputFile) {
    const spec = JSON.parse(fs.readFileSync(outputFile, 'utf8'));

    // Public endpoints (no auth)
    const publicEndpoints = new Set([
        'get /api/venues',
        'get /api/venues/sku/{sku}',
        'get /api/venues/locations/all',
        'get /api/venues/platform-settings/public',
        'post /api/auth/register',
        'post /api/auth/login',
        'get /api/terms',
        'get /api/hero-slides',
        'get /api/contact-settings',
        'get /health'
    ]);

    // Operation summaries and request bodies
    const opMap = {
        'post /api/auth/register': {
            summary: 'Register new user',
            requestBody: { $ref: '#/components/schemas/AuthRegister' }
        },
        'post /api/auth/login': {
            summary: 'Login user',
            requestBody: { $ref: '#/components/schemas/AuthLogin' }
        },
        'put /api/auth/update-profile': {
            summary: 'Update profile',
            requestBody: { $ref: '#/components/schemas/UserUpdate' }
        },
        'put /api/auth/change-password': {
            summary: 'Change password',
            requestBody: { $ref: '#/components/schemas/ChangePassword' }
        },
        'post /api/venues': {
            summary: 'Create new venue',
            requestBody: { $ref: '#/components/schemas/VenueCreate' }
        },
        'put /api/venues/{id}': {
            summary: 'Update venue',
            requestBody: { $ref: '#/components/schemas/VenueUpdate' }
        },
        'post /api/bookings': {
            summary: 'Create booking',
            requestBody: { $ref: '#/components/schemas/BookingCreate' }
        },
        'put /api/bookings/{id}/status': {
            summary: 'Update booking status',
            requestBody: { $ref: '#/components/schemas/BookingUpdateStatus' }
        },
        'put /api/bookings/{id}/cancel': {
            summary: 'Cancel booking',
            requestBody: { $ref: '#/components/schemas/BookingCancel' }
        },
        'put /api/admin/platform-settings': {
            summary: 'Update GST & Platform Fee',
            requestBody: { $ref: '#/components/schemas/PlatformSettingsUpdate' }
        },
        'put /api/admin/venues/{id}/settings': {
            summary: 'Update custom GST/Platform Fee for venue',
            requestBody: { $ref: '#/components/schemas/VenueCustomSettingsUpdate' }
        },
        'post /api/upload/image': {
            summary: 'Upload image (base64)',
            requestBody: { $ref: '#/components/schemas/UploadBase64' }
        },
        'post /api/upload/document': {
            summary: 'Upload document (base64)',
            requestBody: { $ref: '#/components/schemas/UploadBase64' }
        },
        'post /api/upload': {
            summary: 'Upload file (multipart/form-data)',
            multipart: true
        }
    };

    for (const [path, methods] of Object.entries(spec.paths || {})) {
        for (const [method, operation] of Object.entries(methods)) {
            if (typeof operation !== 'object' || Array.isArray(operation)) continue;
            const key = `${method.toLowerCase()} ${path}`;

            // Remove security for public endpoints
            if (publicEndpoints.has(key)) {
                operation.security = [];
            }

            // Add summary & requestBody
            const conf = opMap[key];
            if (conf) {
                if (conf.summary) operation.summary = conf.summary;
                if (conf.requestBody) {
                    operation.requestBody = {
                        required: true,
                        content: {
                            'application/json': {
                                schema: conf.requestBody
                            }
                        }
                    };
                }
                if (conf.multipart) {
                    operation.requestBody = {
                        required: true,
                        content: {
                            'multipart/form-data': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        file: { type: 'string', format: 'binary' },
                                        folder: { type: 'string' }
                                    },
                                    required: ['file']
                                }
                            }
                        }
                    };
                }
            }
        }
    }

    fs.writeFileSync(outputFile, JSON.stringify(spec, null, 2));
    console.log('🧩  Spec augmented with summaries, request bodies and security rules');
}

// ─────────────────────────────────────────────────────────────────────────────

const outputFile = './swagger-output.json';
const routes = ['./server.js'];

swaggerAutogen(outputFile, routes, doc).then(() => {
    assignTagsFromPaths(outputFile);
    augmentSpec(outputFile);
    console.log('✅  swagger-output.json generated successfully');
});
