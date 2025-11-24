import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCCR1HIUedcjh3ExCbRwIc27j251ISZM6M",
  authDomain: "barakasoft.firebaseapp.com",
  projectId: "barakasoft",
  storageBucket: "barakasoft.firebasestorage.app",
  messagingSenderId: "1048701693921",
  appId: "1:1048701693921:web:b373c92ba9efabb5436ca0"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Activation de la persistance hors-ligne
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        // Probablement plusieurs onglets ouverts
        console.warn("La persistance hors-ligne nécessite un seul onglet ouvert.");
    } else if (err.code == 'unimplemented') {
        // Le navigateur ne supporte pas la fonctionnalité
        console.warn("Le navigateur actuel ne supporte pas la persistance hors-ligne.");
    }
});