import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  doc,
  updateDoc,
  where
} from "firebase/firestore";

import { db } from "../firebase/firebaseConfig";
import { CreateResourceDTO, Resource } from "../../types/Resources";

import { } from "firebase/firestore";

const COLLECTION_NAME = "recursos";

function removeUndefinedFields<T extends Record<string, any>>(data: T) {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  );
}


export async function createResource(data: CreateResourceDTO): Promise<string> {
  const recursosRef = collection(db, COLLECTION_NAME);

  const cleanData = removeUndefinedFields(data);

  const docRef = await addDoc(recursosRef, {
    ...cleanData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateResource(
  id: string,
  data: Partial<CreateResourceDTO>
): Promise<void> {
  const resourceRef = doc(db, COLLECTION_NAME, id);

  const cleanData = removeUndefinedFields(data);

  await updateDoc(resourceRef, {
    ...cleanData,
    updatedAt: serverTimestamp(),
  });
}

export async function listResources(): Promise<Resource[]> {
  const recursosRef = collection(db, "recursos");

  const snapshot = await getDocs(recursosRef);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Resource[];
}

export async function listLaboratories(): Promise<Resource[]> {
  const recursosRef = collection(db, COLLECTION_NAME);

  const q = query(
    recursosRef,
    where("tipo", "==", "LABORATORIO")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Resource[];
}