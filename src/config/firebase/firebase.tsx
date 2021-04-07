import * as firebaseRaw from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';
import 'firebase/functions';

const firebase = firebaseRaw.default.initializeApp({ 
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID
 });

const firestoreInstance = firebase.firestore();
const authInstance = firebase.auth();
const functionsInstance = firebase.functions();

export const firestore = () => firestoreInstance;
export const auth = () => authInstance;
export const functions = () => functionsInstance;

export const firestoreRaw = firebaseRaw.default.firestore;
export const authRaw = firebaseRaw.default.auth;
export const functionsRaw = firebaseRaw.default.functions;
