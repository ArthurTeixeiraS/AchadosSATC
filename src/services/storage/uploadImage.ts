import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { storage } from "../firebase/firebaseConfig";

export async function uploadImageAsync(
  uri: string,
  path: string
): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();

  const imageRef = ref(storage, path);

  await uploadBytes(imageRef, blob);

  return await getDownloadURL(imageRef);
}