#!/usr/bin/env node

/**
 * Production Environment Validation Script
 * Validates that all required environment variables and configurations are set
 */

const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY', 
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET',
  'FRONTEND_URL',
  'ALLOWED_ORIGINS'
];

const optionalEnvVars = [
  'NODE_ENV',
  'PORT',
  'HOST',
  'API_VERSION',
  'API_PREFIX',
  'RATE_LIMIT_WINDOW_MS',
  'RATE_LIMIT_MAX_REQUESTS',
  'LOG_LEVEL',
  'LOG_FORMAT',
  'HELMET_ENABLED',
  'CORS_ENABLED',
  'DATABASE_URL'
];

function validateEnvironment() {
  console.log('🔍 Validating production environment...\n');
  
  let hasErrors = false;
  
  // Check required environment variables
  console.log('📋 Required Environment Variables:');
  requiredEnvVars.forEach(envVar => {
    const value = process.env[envVar];
    if (!value) {
      console.log(`❌ ${envVar}: MISSING`);
      hasErrors = true;
    } else {
      // Mask sensitive values
      const maskedValue = envVar.includes('KEY') || envVar.includes('SECRET') 
        ? '*'.repeat(Math.min(value.length, 20))
        : value;
      console.log(`✅ ${envVar}: ${maskedValue}`);
    }
  });
  
  console.log('\n📋 Optional Environment Variables:');
  optionalEnvVars.forEach(envVar => {
    const value = process.env[envVar];
    if (value) {
      console.log(`✅ ${envVar}: ${value}`);
    } else {
      console.log(`⚠️  ${envVar}: Using default`);
    }
  });
  
  // Validate specific configurations
  console.log('\n🔧 Configuration Validation:');
  
  // Validate Supabase URL format
  const supabaseUrl = process.env.SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.match(/^https:\/\/[a-z0-9]+\.supabase\.co$/)) {
    console.log('❌ SUPABASE_URL: Invalid format (should be https://project-id.supabase.co)');
    hasErrors = true;
  } else if (supabaseUrl) {
    console.log('✅ SUPABASE_URL: Valid format');
  }
  
  // Validate JWT secret strength
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret && jwtSecret.length < 32) {
    console.log('⚠️  JWT_SECRET: Should be at least 32 characters for security');
  } else if (jwtSecret) {
    console.log('✅ JWT_SECRET: Adequate length');
  }
  
  // Validate CORS origins
  const allowedOrigins = process.env.ALLOWED_ORIGINS;
  if (allowedOrigins) {
    const origins = allowedOrigins.split(',');
    const validOrigins = origins.every(origin => 
      origin.trim().match(/^https?:\/\/[a-zA-Z0-9.-]+(?::[0-9]+)?$/)
    );
    if (validOrigins) {
      console.log(`✅ ALLOWED_ORIGINS: ${origins.length} valid origin(s)`);
    } else {
      console.log('❌ ALLOWED_ORIGINS: Contains invalid origin format');
      hasErrors = true;
    }
  }
  
  // Validate port
  const port = process.env.PORT;
  if (port && (isNaN(port) || parseInt(port) < 1 || parseInt(port) > 65535)) {
    console.log('❌ PORT: Invalid port number');
    hasErrors = true;
  } else if (port) {
    console.log(`✅ PORT: ${port}`);
  }
  
  console.log('\n🏁 Validation Summary:');
  if (hasErrors) {
    console.log('❌ Environment validation failed. Please fix the errors above.');
    process.exit(1);
  } else {
    console.log('✅ Environment validation passed. Ready for production deployment!');
    process.exit(0);
  }
}

// Run validation
validateEnvironment();