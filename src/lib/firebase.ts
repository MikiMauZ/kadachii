import { initializeApp } from 'firebase/app';
import { getAuth, deleteUser } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: 'kadichii',
  appId: '1:447127729837:web:ba632a569f7198137e7824',
  storageBucket: 'kadichii.firebasestorage.app',
  apiKey: 'AIzaSyAU8sJzr7GYrVve1t2itIiMD_RdLrAOKeM',
  authDomain: 'kadichii.firebaseapp.com',
  messagingSenderId: '447127729837',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
