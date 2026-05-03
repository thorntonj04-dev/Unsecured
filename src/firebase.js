// ─── FIREBASE / FIRESTORE + AUTH ─────────────────────────────────────────────
// Public reads come from the 'essays' Firestore collection.
// Admin writes require Firebase Auth (email/password).
//
// Required env vars in .env.local:
//   VITE_FIREBASE_API_KEY
//   VITE_FIREBASE_AUTH_DOMAIN
//   VITE_FIREBASE_PROJECT_ID
//   VITE_FIREBASE_STORAGE_BUCKET
//   VITE_FIREBASE_MESSAGING_SENDER_ID
//   VITE_FIREBASE_APP_ID

import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore, collection, getDocs, doc,
  setDoc, deleteDoc, query, orderBy, where,
} from "firebase/firestore";
import {
  getAuth, signInWithEmailAndPassword,
  signOut as fbSignOut, onAuthStateChanged,
} from "firebase/auth";
import { LOCAL_ESSAYS } from "./essays";

const {
  VITE_FIREBASE_API_KEY: apiKey,
  VITE_FIREBASE_AUTH_DOMAIN: authDomain,
  VITE_FIREBASE_PROJECT_ID: projectId,
  VITE_FIREBASE_STORAGE_BUCKET: storageBucket,
  VITE_FIREBASE_MESSAGING_SENDER_ID: messagingSenderId,
  VITE_FIREBASE_APP_ID: appId,
} = import.meta.env;

const CONFIGURED = !!(apiKey && projectId);

let _db = null;
let _auth = null;

function getApp() {
  if (!CONFIGURED) return null;
  return getApps().length > 0
    ? getApps()[0]
    : initializeApp({ apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId });
}

function getDB() {
  if (!CONFIGURED) return null;
  if (!_db) _db = getFirestore(getApp());
  return _db;
}

function getAuthInstance() {
  if (!CONFIGURED) return null;
  if (!_auth) _auth = getAuth(getApp());
  return _auth;
}

// ── ESSAY SCHEMA HELPER ───────────────────────────────────────────────────────
function normalizeEssay(data) {
  return {
    id: data.id,
    theme: data.theme || "Pressure",
    readTime: data.readTime || "",
    title: data.title || "",
    hook: data.hook || "",
    subhead: data.subhead || "",
    body: Array.isArray(data.body) ? data.body : [],
    bookTie: data.bookTie || "",
    related: Array.isArray(data.related) ? data.related : [],
    published: data.published !== false, // default true
  };
}

// ── PUBLIC: fetch published essays ───────────────────────────────────────────
// Returns sorted array or null (→ fallback to LOCAL_ESSAYS).
export async function fetchEssays() {
  const db = getDB();
  if (!db) return null;
  try {
    const q = query(
      collection(db, "essays"),
      where("published", "!=", false),
      orderBy("published"),
      orderBy("id", "asc")
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs.map(d => normalizeEssay(d.data()));
  } catch (err) {
    console.warn("Firestore fetch failed, using local essays:", err.message);
    return null;
  }
}

// ── ADMIN: fetch ALL essays (including drafts) ────────────────────────────────
export async function fetchAllEssays() {
  const db = getDB();
  if (!db) return LOCAL_ESSAYS;
  try {
    const q = query(collection(db, "essays"), orderBy("id", "asc"));
    const snap = await getDocs(q);
    if (snap.empty) return LOCAL_ESSAYS;
    return snap.docs.map(d => normalizeEssay(d.data()));
  } catch (err) {
    console.warn("fetchAllEssays failed:", err.message);
    return LOCAL_ESSAYS;
  }
}

// ── ADMIN: save (create or update) an essay ──────────────────────────────────
export async function saveEssay(essay) {
  const db = getDB();
  if (!db) throw new Error("Firebase not configured");
  await setDoc(doc(db, "essays", String(essay.id)), normalizeEssay(essay));
}

// ── ADMIN: delete an essay ────────────────────────────────────────────────────
export async function deleteEssay(id) {
  const db = getDB();
  if (!db) throw new Error("Firebase not configured");
  await deleteDoc(doc(db, "essays", String(id)));
}

// ── AUTH ──────────────────────────────────────────────────────────────────────
export async function signIn(email, password) {
  const auth = getAuthInstance();
  if (!auth) throw new Error("Firebase not configured");
  await signInWithEmailAndPassword(auth, email, password);
}

export async function signOut() {
  const auth = getAuthInstance();
  if (auth) await fbSignOut(auth);
}

export function onAuthChange(callback) {
  const auth = getAuthInstance();
  if (!auth) { callback(null); return () => {}; }
  return onAuthStateChanged(auth, callback);
}

export { LOCAL_ESSAYS };
