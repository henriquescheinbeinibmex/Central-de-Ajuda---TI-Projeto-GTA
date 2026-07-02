import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  if (pathname.startsWith("/login")) {
    if (session) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = session.user.role;

  // Rotas exclusivas para CONSULTOR_TI
  const rotasTI = ["/validacao", "/admin", "/base-conhecimento/novo", "/chamados/ligacao"];
  if (rotasTI.some((r) => pathname.startsWith(r)) && role !== "CONSULTOR_TI") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
