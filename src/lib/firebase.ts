
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  arrayUnion,
  arrayRemove,
  onSnapshot
} from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBmT5Vx3VC9ATFt2i7QgcQC1yGnW5foJMY",
  authDomain: "cookeasy-recipe-app.firebaseapp.com",
  projectId: "cookeasy-recipe-app",
  storageBucket: "cookeasy-recipe-app.appspot.com",
  messagingSenderId: "397391164766",
  appId: "1:397391164766:web:57d0ef8aa234d3f53fd8df"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize stats collection with default values if it doesn't exist
const initializeStats = async () => {
  const statRef = doc(db, "stats", "app_stats");
  const statSnap = await getDoc(statRef);
  
  if (!statSnap.exists()) {
    await setDoc(statRef, {
      stat_id: "app_stats",
      searchCount: 0,
      favoriteCount: 0
    });
  }
};

initializeStats();

// Update stats counters
const updateSearchCount = async () => {
  const statRef = doc(db, "stats", "app_stats");
  await updateDoc(statRef, {
    searchCount: increment(1)
  });
};

const updateFavoriteCount = async () => {
  const statRef = doc(db, "stats", "app_stats");
  await updateDoc(statRef, {
    favoriteCount: increment(1)
  });
};

export { 
  auth, 
  db, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  updateSearchCount,
  updateFavoriteCount
};
