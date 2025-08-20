import { Router, Request, Response } from 'express';
import { testDatabaseConnection, verifyServiceRole } from '../services/supabaseClient';
import { SuccessResponse, HttpStatusCode } from '../types';

const router = Router();

// Basic health check
router.get('/', async (req: Request, res: Response) => {
  const healthCheck: SuccessResponse<any> = {
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env['NODE_ENV'] || 'development',
      version: process.env['npm_package_version'] || '1.0.0',
      node_version: process.version,
    },
    timestamp: new Date().toISOString(),
  };

  res.status(HttpStatusCode.OK).json(healthCheck);
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

export default router;