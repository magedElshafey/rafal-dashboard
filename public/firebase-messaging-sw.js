/* global firebase */
importScripts('https://www.gstatic.com/firebasejs/12.17.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/12.17.1/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyAM_JjiZVymLI3k5M8j4TlICd0orybr3vA',
  authDomain: 'smart-hub-7fd07.firebaseapp.com',
  projectId: 'smart-hub-7fd07',
  storageBucket: 'smart-hub-7fd07.firebasestorage.app',
  messagingSenderId: '171585738303',
  appId: '1:171585738303:web:1358d0711c565a4f944a8a',
})

// Firebase displays standard notification payloads in the background. Data-only
// payload presentation and deep-link routing remain backend-contract dependent.
firebase.messaging()
