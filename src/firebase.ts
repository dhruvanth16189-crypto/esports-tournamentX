import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCXZskEshIvh_GrmxFPbe2cMwhv9HFov6M",
  authDomain: "esports-tournamentx.firebaseapp.com",
  projectId: "esports-tournamentx",
  storageBucket: "esports-tournamentx.firebasestorage.app",
  messagingSenderId: "153967754678",
  appId: "1:153967754678:web:020bd1edb54f6347455517",
  measurementId: "G-3XHKQGJE0Z"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { app, auth, provider, signInWithRedirect, getRedirectResult };
