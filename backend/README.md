# POS Backend API

Express.js backend API for the POS (Point of Sale) application with Supabase integration.

## 🚀 Production Deployment

**Status**: Ready for production deployment to Render.com

### Quick Deploy
1. **Prerequisites**: Supabase project with database schema deployed
2. **Deploy**: Use `render.yaml` configuration for one-click deployment
3. **Configure**: Set environment variables in Render dashboard
4. **Verify**: Test health endpoints and API functionality

📖 **Full deployment guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)  
✅ **Deployment checklist**: [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)

## Features

- **Product Management**: CRUD operations for products with barcode scanning support
- **Order Management**: Complete order processing with line items and payment tracking
- **POS Terminal Management**: Terminal configuration and management
- **Authentication**: JWT-based authentication with Supabase Auth integration
- **Real-time Data**: Supabase real-time subscriptions for live updates
- **Security**: Comprehensive security middleware (Helmet, CORS, rate limiting)
- **Validation**: Request validation and sanitization
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Health Checks**: Multiple health check endpoints for monitoring
- **TypeScript**: Full TypeScript support with strict type checking
- **Production Ready**: Docker support, environment validation, monitoring

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Language**: TypeScript
- **Validation**: express-validator
- **Security**: Helmet, CORS, rate limiting
- **Logging**: Winston, Morgan
- **Deployment**: Render.com, Docker

## API Endpoints

### Health Checks
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health with database connectivity
- `GET /health/ready` - Readiness probe (Kubernetes/Docker)
- `GET /health/live` - Liveness probe (Kubernetes/Docker)

### Products API (`/api/v1/products`)
- `GET /` - List all products with pagination and filtering
- `GET /:id` - Get product by ID
- `GET /barcode/:barcode` - Get product by barcode (for scanning)
- `POST /` - Create new product (auth required)
- `PUT /:id` - Update product (auth required)
- `DELETE /:id` - Delete product (auth required)

### Orders API (`/api/v1/orders`)
- `GET /` - List orders with pagination and filtering
- `GET /:id` - Get order details with line items
- `GET /terminal/:terminalId` - Get orders by POS terminal
- `POST /` - Create new order with line items
- `PUT /:id` - Update order status

### POS Terminals API (`/api/v1/pos-terminals`)
- `GET /` - List POS terminals
- `GET /:id` - Get terminal details and configuration
- `POST /` - Create terminal (auth required)
- `PUT /:id` - Update terminal configuration (auth required)
- `DELETE /:id` - Delete terminal (auth required)

### Authentication API (`/api/v1/auth`)
- `POST /login` - User login with JWT token
- `POST /logout` - User logout
- `GET /me` - Get current user information

## Quick Start

### Prerequisites
- Node.js 18 or higher
- npm or yarn
- Supabase project with database schema deployed

### Local Development

1. **Clone and install**:
```bash
git clone <repository-url>
cd backend
npm install
```

2. **Environment setup**:
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

3. **Validate and start**:
```bash
npm run pre-deploy  # Validates everything
npm run dev         # Start development server
```

The API will be available at `http://localhost:5000`

### Production Deployment

1. **Pre-deployment validation**:
```bash
npm run pre-deploy
```

2. **Deploy to Render.com**:
   - Connect GitHub repository
   - Use `render.yaml` configuration
   - Set environment variables
   - Deploy

3. **Post-deployment verification**:
   - Test health endpoints
   - Verify API functionality
   - Check logs and monitoring

## Environment Variables

### Required (Production):
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-secure-jwt-secret-32-chars-min
FRONTEND_URL=https://your-frontend.onrender.com
ALLOWED_ORIGINS=https://your-frontend.onrender.com
```

### Optional (with defaults):
```bash
NODE_ENV=production
PORT=10000
HOST=0.0.0.0
API_VERSION=v1
API_PREFIX=/api
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
HELMET_ENABLED=true
CORS_ENABLED=true
```

## Development Scripts

```bash
# Development
npm run dev              # Start with hot reload
npm run start:dev        # Start with ts-node

# Building
npm run build            # TypeScript compilation
npm run type-check       # Type checking only

# Quality
npm run lint             # ESLint
npm run lint:fix         # Fix linting issues
npm test                 # Run tests
npm run test:watch       # Tests in watch mode

# Deployment
npm run validate:env     # Validate environment variables
npm run deploy:check     # Pre-deployment validation
npm run pre-deploy       # Complete pre-deployment check
npm start                # Production server
```

## Project Structure

```
backend/
├── src/
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Express middleware
│   ├── routes/         # API routes
│   ├── services/       # Business logic & Supabase
│   ├── types/          # TypeScript definitions
│   ├── utils/          # Utility functions
│   └── app.ts          # Express app configuration
├── scripts/            # Deployment & validation scripts
├── dist/              # Compiled JavaScript (generated)
├── render.yaml        # Render.com deployment config
├── Dockerfile         # Docker configuration
├── DEPLOYMENT.md      # Deployment guide
└── DEPLOYMENT_CHECKLIST.md  # Deployment checklist
```

## Security Features

- **🔐 Authentication**: JWT-based with Supabase Auth
- **🛡️ Authorization**: Role-based access control
- **🌐 CORS**: Configurable cross-origin policies
- **⚡ Rate Limiting**: Configurable request throttling
- **✅ Input Validation**: Request validation & sanitization
- **🔒 Security Headers**: Helmet.js protection
- **🔑 Environment Security**: Sensitive data in env vars
- **🚫 SQL Injection**: Parameterized queries via Supabase

## Monitoring & Health

- **📊 Health Checks**: `/health`, `/health/detailed`, `/health/ready`, `/health/live`
- **📝 Logging**: Structured logging with Winston & Morgan
- **🚨 Error Tracking**: Centralized error handling
- **📈 Performance**: Request timing and monitoring
- **🔍 Database Health**: Connection and query monitoring

## Testing

```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode
```

Test coverage includes:
- API endpoint testing
- Authentication flows
- Database operations
- Error handling
- Security middleware

## Docker Support

```bash
# Build image
docker build -t pos-backend .

# Run container
docker run -p 10000:10000 --env-file .env pos-backend
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Run validation (`npm run pre-deploy`)
6. Commit changes (`git commit -m 'Add amazing feature'`)
7. Push to branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## Troubleshooting

### Common Issues:
- **CORS errors**: Check `ALLOWED_ORIGINS` configuration
- **Database connection**: Verify Supabase credentials
- **Build failures**: Ensure Node.js 18+ and dependencies
- **Health check failures**: Check environment variables

### Getting Help:
1. Check the logs in Render dashboard
2. Test health endpoints: `/api/health/detailed`
3. Validate environment: `npm run validate:env`
4. Review deployment checklist

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.