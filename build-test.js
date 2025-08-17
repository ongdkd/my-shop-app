// Simple build test script
const { execSync } = require('child_process');

try {
  console.log('Running Next.js build...');
  execSync('npx next build', { stdio: 'inherit' });
  console.log('✅ Build successful!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}