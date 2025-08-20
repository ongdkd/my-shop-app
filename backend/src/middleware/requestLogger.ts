import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  // Log request
  console.log(`📥 ${req.method} ${req.path}`, {
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    ...(Object.keys(req.query).length > 0 && { query: req.query }),
    ...(req.body && Object.keys(req.body).length > 0 && { 
      body: sanitizeBody(req.body) 
    }),
  });

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(body: any) {
    const duration = Date.now() - startTime;
    
    console.log(`📤 ${req.method} ${req.path} - ${res.statusCode}`, {
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      statusCode: res.statusCode,
      ...(body?.error && { error: body.error.code }),
    });
    
    return originalJson.call(this, body);
  };

  next();
};

// Sanitize request body to avoid logging sensitive data
const sanitizeBody = (body: any): any => {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
  const sanitized = { ...body };

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
};