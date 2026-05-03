import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  // This will show up in Expo logs if the env var isn't set
  console.warn('EXPO_PUBLIC_API_URL is not set; backend auth calls will fail.');
}

export async function syncClerkUserToBackend(token: string) {
  if (!API_URL) throw new Error('EXPO_PUBLIC_API_URL is not configured');
  const res = await axios.post(
    `${API_URL}/api/auth/clerk/sync`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.data;
}

export async function fetchBackendUser(token: string) {
  if (!API_URL) throw new Error('EXPO_PUBLIC_API_URL is not configured');

  const res = await axios.get(`${API_URL}/api/auth/clerk/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
}
