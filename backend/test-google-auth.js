import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';

dotenv.config();

async function testGoogleAuth() {
  console.log('Testing Google OAuth Configuration...\n');
  
  // Check environment variables
  console.log('Environment Variables:');
  console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Set ✅' : 'Missing ❌');
  console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Set ✅' : 'Missing ❌');
  
  if (!process.env.GOOGLE_CLIENT_ID) {
    console.log('\n❌ GOOGLE_CLIENT_ID is missing from .env file');
    return;
  }
  
  // Test OAuth2Client initialization
  try {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    console.log('\n✅ OAuth2Client initialized successfully');
    console.log('Client ID format looks valid:', process.env.GOOGLE_CLIENT_ID.endsWith('.apps.googleusercontent.com'));
  } catch (error) {
    console.log('\n❌ Failed to initialize OAuth2Client:', error.message);
  }
}

testGoogleAuth();