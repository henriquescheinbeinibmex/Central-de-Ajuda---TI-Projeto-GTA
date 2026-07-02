import type { NextAuthConfig } from "next-auth";

// Configuração "leve", sem acesso a banco de dados — usada pelo middleware (Edge Runtime)
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.setorId = (user as any).setorId;
        token.setorNome = (user as any).setorNome;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.setorId = token.setorId as string | null;
        session.user.setorNome = token.setorNome as string | null;
      }
      return session;
    },
  },
};
