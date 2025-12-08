import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { logger } from "@/lib/logger";

export async function verifyAuth(
  request: NextRequest
): Promise<{ uid: string; email: string | null } | null> {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      logger.warn("Missing or invalid authorization header", {
        hasHeader: !!authHeader,
        url: request.url,
      });
      return null;
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    logger.debug("Auth verification successful", {
      uid: decodedToken.uid,
      email: decodedToken.email,
    });

    return {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
    };
  } catch (error) {
    logger.error("Error verifying auth token", error, {
      url: request.url,
      method: request.method,
    });
    return null;
  }
}
