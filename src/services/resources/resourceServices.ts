import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  doc, 
  updateDoc
} from "firebase/firestore";

import { db } from "../firebase/firebaseConfig";
import { CreateResourceDTO, Resource } from "../../types/Resources";

const COLLECTION_NAME = "recursos";

export async function createResource(data: CreateResourceDTO): Promise<string> {
  const recursosRef = collection(db, COLLECTION_NAME);

  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  );

  const docRef = await addDoc(recursosRef, {
    ...cleanData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function listResources(): Promise<Resource[]> {
  const recursosRef = collection(db, "recursos");

  const snapshot = await getDocs(recursosRef);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Resource[];
}