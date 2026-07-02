import "next-auth";

declare module "next-auth" {
  interface User {
    role: string;
    setorId: string | null;
    setorNome: string | null;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      setorId: string | null;
      setorNome: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    setorId: string | null;
    setorNome: string | null;
  }
}
