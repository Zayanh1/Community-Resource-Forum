export default async function getFileDetails(file: File) {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  const contentHash = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return {
    contentHash,
    name: file.name,
    size: file.size,
    type: file.type,
  };
}
