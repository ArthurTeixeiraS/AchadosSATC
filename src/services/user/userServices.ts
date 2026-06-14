import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

import { db } from "../firebase/firebaseConfig";

export interface UpdateProfileDTO {
  telefone: string | null;
 
}

export async function updateUserProfile(
  userId: string,
  data: UpdateProfileDTO 
): Promise<void> {
  const userRef = doc(db, "usuarios", userId);

  await updateDoc(userRef, {
    ...data, 
    updatedAt: serverTimestamp(),
  });
}