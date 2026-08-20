import { initializeApp, getApps, type FirebaseOptions } from 'firebase/app';
import { getStorage } from 'firebase/storage';

import { getClientEnv } from '@c1rcle/config';

const env = getClientEnv();

const firebaseConfig: FirebaseOptions = {
  ...(env.NEXT_PUBLIC_FIREBASE_API_KEY && { apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY }),
  projectId: 'thec1rcle-india',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export function getFirebaseStorage() {
  return getStorage(app);
}
