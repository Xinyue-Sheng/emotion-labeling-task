// Firebase project configuration + shared SDK handles.
//
// This config is a *client* config, not a secret: Firebase web apps are
// designed to ship this in the browser bundle, and access control is
// enforced separately by the Firestore security rules (see
// firestore.rules), not by hiding this object.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDHh-pO92LwbvxNXPqIaao795n_5w50qDU",
  authDomain: "emotion-label-task.firebaseapp.com",
  projectId: "emotion-label-task",
  storageBucket: "emotion-label-task.firebasestorage.app",
  messagingSenderId: "500292021686",
  appId: "1:500292021686:web:9fba2434ee756bc1c6a517",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
