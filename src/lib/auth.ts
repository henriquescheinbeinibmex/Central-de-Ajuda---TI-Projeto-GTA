import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Usuário", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { username: (credentials.username as string).trim().toLowerCase() },
          include: { setor: true },
        });

        if (!user) return null;

        const senhaValida = await compare(
          credentials.password as string,
          user.senha
        );
        if (!senhaValida) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.nome,
          role: user.role,
          setorId: user.setorId,
          setorNome: user.setor?.nome ?? null,
        };
      },
    }),
  ],
});
