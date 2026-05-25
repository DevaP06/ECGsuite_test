import { OAuth2Client } from 'google-auth-library';

let client = null;

export function getGoogleClient() {
  const id = process.env.GOOGLE_CLIENT_ID;
  if (!id) return null; // caller can handle missing config
  if (!client) client = new OAuth2Client(id);
  return client;
}