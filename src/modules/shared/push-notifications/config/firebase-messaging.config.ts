import type { FirebaseOptions } from 'firebase/app'

import env from '@/config/env'

export type FirebaseMessagingConfig = {
  firebaseOptions: FirebaseOptions
  vapidKey: string
}

function hasValue(value: string | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export function getFirebaseMessagingConfig(): FirebaseMessagingConfig | null {
  const firebase = env.FIREBASE
  const requiredValues = [
    firebase.API_KEY,
    firebase.AUTH_DOMAIN,
    firebase.PROJECT_ID,
    firebase.STORAGE_BUCKET,
    firebase.MESSAGING_SENDER_ID,
    firebase.APP_ID,
    firebase.VAPID_KEY,
  ]

  if (!requiredValues.every(hasValue)) return null

  return {
    firebaseOptions: {
      apiKey: firebase.API_KEY,
      authDomain: firebase.AUTH_DOMAIN,
      projectId: firebase.PROJECT_ID,
      storageBucket: firebase.STORAGE_BUCKET,
      messagingSenderId: firebase.MESSAGING_SENDER_ID,
      appId: firebase.APP_ID,
      ...(hasValue(firebase.MEASUREMENT_ID) ? { measurementId: firebase.MEASUREMENT_ID } : {}),
    },
    vapidKey: firebase.VAPID_KEY,
  }
}
