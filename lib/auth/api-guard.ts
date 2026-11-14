
import { NextRequest, NextResponse } from "next/server";

import {
  getAuthenticatedAdmin,
  SESSION_COOKIE_NAME,
} from "./session";

export async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(
    SESSION_COOKIE_NAME
  )?.value;

  if (!token) {
    return {
      admin: null,
      response: NextResponse.json(
        { message: "Authentication required." },
        { status: 401 }
      ),
    };
  }

  const admin = await getAuthenticatedAdmin(token);

  if (!admin) {
    return {
      admin: null,
      response: NextResponse.json(
        { message: "Your session has expired." },
        { status: 401 }
      ),
    };
  }

  return {
    admin,
    response: null,
  };
}
