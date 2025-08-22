import { Router, Request, Response } from 'express';
import { testDatabaseConnection, verifyServiceRole } from '../services/supabaseClient';
import { SuccessResponse, HttpStatusCode } from '../types';

const router = Router();

// Basic health check
router.get('/', async (req: Request, res: Response) => {
  try {
    // Quick database ping for basic health check
    const dbConnected = await testDatabaseConnection();
    
    const healthCheck: SuccessResponse<any> = {
      success: true,
      data: {
        status: dbConnected ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env['NODE_ENV'] || 'development',
        version: process.env['npm_package_version'] || '1.0.0',
        node_version: process.version,
        database: dbConnected ? 'connected' : 'disconnected',
      },
      timestamp: new Date().toISOString(),
    };

    const statusCode = dbConnected ? HttpStatusCode.OK : HttpStatusCode.SERVICE_UNAVAILABLE;
    res.status(statusCode).json(healthCheck);
  } catch (error) {
    res.status(HttpStatusCode.SERVICE_UNAVAILABLE).json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: 'Basic health check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      timestamp: new Date().toISOString(),
    });
  }
});

// Detailed health check with database connectivity
router.get('/detailed', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    // Test database connection
    const dbConnected = await testDatabaseConnection();
    
    // Test service role access
    const serviceRoleValid = await verifyServiceRole();
    
    const responseTime = Date.now() - startTime;
    
    const detailedHealth: SuccessResponse<any> = {
      success: true,
      data: {
        status: dbConnected && serviceRoleValid ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env['NODE_ENV'] || 'development',
        version: process.env['npm_package_version'] || '1.0.0',
        node_version: process.version,
        response_time_ms: responseTime,
        checks: {
          database: {
            status: dbConnected ? 'healthy' : 'unhealthy',
            message: dbConnected ? 'Database connection successful' : 'Database connection failed',
          },
          supabase_auth: {
            status: serviceRoleValid ? 'healthy' : 'unhealthy',
            message: serviceRoleValid ? 'Service role access verified' : 'Service role access failed',
          },
        },
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024),
        },
      },
      timestamp: new Date().toISOString(),
    };

    const statusCode = (dbConnected && serviceRoleValid) 
      ? HttpStatusCode.OK 
      : HttpStatusCode.SERVICE_UNAVAILABLE;

    res.status(statusCode).json(detailedHealth);
  } catch (error) {
    const errorHealth = {
      success: false,
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      timestamp: new Date().toISOString(),
    };

    res.status(HttpStatusCode.SERVICE_UNAVAILABLE).json(errorHealth);
  }
});

// Readiness probe (for Kubernetes/Docker)
router.get('/ready', async (req: Request, res: Response) => {
  try {
    const dbConnected = await testDatabaseConnection();
    
    if (dbConnected) {
      res.status(HttpStatusCode.OK).json({
        success: true,
        data: { status: 'ready' },
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(HttpStatusCode.SERVICE_UNAVAILABLE).json({
        success: false,
        error: {
          code: 'NOT_READY',
          message: 'Service not ready - database connection failed',
        },
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    res.status(HttpStatusCode.SERVICE_UNAVAILABLE).json({
      success: false,
      error: {
        code: 'NOT_READY',
        message: 'Service not ready',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      timestamp: new Date().toISOString(),
    });
  }
});

// Liveness probe (for Kubernetes/Docker)
router.get('/live', (req: Request, res: Response) => {
  res.status(HttpStatusCode.OK).json({
    success: true,
    data: { status: 'alive' },
    timestamp: new Date().toISOString(),
  });
});

// Database-specific health check
router.get('/database', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const dbConnected = await testDatabaseConnection();
    const responseTime = Date.now() - startTime;
    
    if (dbConnected) {
      res.status(HttpStatusCode.OK).json({
        success: true,
        data: {
          status: 'connected',
          response_time_ms: responseTime,
          database_url: process.env['SUPABASE_URL'] ? 'configured' : 'not_configured',
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(HttpStatusCode.SERVICE_UNAVAILABLE).json({
        success: false,
        error: {
          code: 'DATABASE_CONNECTION_FAILED',
          message: 'Database connection failed',
          response_time_ms: responseTime,
        },
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    res.status(HttpStatusCode.SERVICE_UNAVAILABLE).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Database health check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        response_time_ms: responseTime,
      },
      timestamp: new Date().toISOString(),
    });
  }
});

// Authentication system health check
router.get('/auth', async (req: Request, res: Response) => {
  try {
    const serviceRoleValid = await verifyServiceRole();
    
    const authStatus = {
      supabase_url: process.env['SUPABASE_URL'] ? 'configured' : 'not_configured',
      service_role_key: process.env['SUPABASE_SERVICE_ROLE_KEY'] ? 'configured' : 'not_configured',
      anon_key: process.env['SUPABASE_ANON_KEY'] ? 'configured' : 'not_configured',
      jwt_secret: process.env['JWT_SECRET'] ? 'configured' : 'not_configured',
    };
    
    const allConfigured = Object.values(authStatus).every(status => status === 'configured');
    
    if (serviceRoleValid && allConfigured) {
      res.status(HttpStatusCode.OK).json({
        success: true,
        data: {
          status: 'configured',
          provider: 'supabase',
          service_role_access: 'verified',
          configuration: authStatus,
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(HttpStatusCode.SERVICE_UNAVAILABLE).json({
        success: false,
        error: {
          code: 'AUTH_MISCONFIGURED',
          message: 'Authentication system is not properly configured',
          configuration: authStatus,
          service_role_access: serviceRoleValid ? 'verified' : 'failed',
        },
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    res.status(HttpStatusCode.SERVICE_UNAVAILABLE).json({
      success: false,
      error: {
        code: 'AUTH_CHECK_FAILED',
        message: 'Authentication health check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;