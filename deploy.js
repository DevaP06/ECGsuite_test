#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting ECGenius deployment process...\n');

// Check if we're in the right directory
if (!fs.existsSync('vercel.json')) {
  console.error('❌ vercel.json not found. Please run this script from the project root.');
  process.exit(1);
}

try {
  // Install frontend dependencies
  console.log('📦 Installing frontend dependencies...');
  execSync('npm run install-frontend', { stdio: 'inherit' });

  // Install API dependencies
  console.log('📦 Installing API dependencies...');
  execSync('npm run install-api', { stdio: 'inherit' });

  // Build frontend
  console.log('🔨 Building frontend...');
  execSync('npm run build', { stdio: 'inherit' });

  // Check if Vercel CLI is installed
  try {
    execSync('vercel --version', { stdio: 'pipe' });
  } catch (error) {
    console.log('📥 Installing Vercel CLI...');
    execSync('npm install -g vercel', { stdio: 'inherit' });
  }

  // Deploy to Vercel
  console.log('🚀 Deploying to Vercel...');
  execSync('vercel --prod', { stdio: 'inherit' });

  console.log('\n✅ Deployment completed successfully!');
  console.log('🌐 Your app should be available at your Vercel domain.');
  console.log('📋 Don\'t forget to:');
  console.log('   1. Set environment variables in Vercel dashboard');
  console.log('   2. Update CORS origins in api/index.js with your domain');
  console.log('   3. Test all functionality after deployment');

} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}