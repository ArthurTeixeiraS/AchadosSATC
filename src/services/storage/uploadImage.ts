import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { storage } from "../firebase/firebaseConfig";

export async function uploadImageAsync(
  uri: string,
  path: string
): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();

  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, blob, {
    contentType: blob.type || "image/jpeg",
  });

  const downloadURL = await getDownloadURL(storageRef);

  return downloadURL;
}
