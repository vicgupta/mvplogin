import PocketBase from "pocketbase";

const pb = new PocketBase(
  process.env.NEXT_PUBLIC_POCKETBASE_URL || process.env.PB_URL || "http://127.0.0.1:8090"
);

// Disable auto-cancellation so multiple requests can run concurrently
pb.autoCancellation(false);

/**
 * Authenticate as admin using env credentials.
 * Call this in server-side code (API routes, server components) when you need
 * admin-level access to PocketBase.
 */
export async function authenticateAdmin() {
  const email = process.env.PB_USEREMAIL;
  const password = process.env.PB_USERPASSWORD;

  if (!email || !password) {
    throw new Error("Missing PB_USEREMAIL or PB_USERPASSWORD environment variables");
  }

  await pb.collection("_superusers").authWithPassword(email, password);
  return pb;
}

export default pb;
