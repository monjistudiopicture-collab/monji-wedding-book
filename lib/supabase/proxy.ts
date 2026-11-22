
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

const ADMIN_USER_ID = "7c0a6a73-47f7-49b8-bd7d-32026bb9320a";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  if (!hasEnvVars) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );

          supabaseResponse = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data, error } = await supabase.auth.getClaims();
  const user = error ? null : data?.claims;

  const isProtectedRoute =
    request.nextUrl.pathname === "/protected" ||
    request.nextUrl.pathname.startsWith("/protected/");

  if (isProtectedRoute) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      url.search = "";
      return NextResponse.redirect(url);
    }

    if (user.sub !== ADMIN_USER_ID) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
