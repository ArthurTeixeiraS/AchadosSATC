import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

import { db } from "../firebase/firebaseConfig";

export async function updateUserProfile(
  userId: string,
  data: { emailInstitucional: string; telefone: string | null }
): Promise<void> {
  const userRef = doc(db, "usuarios", userId);

  await updateDoc(userRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}
