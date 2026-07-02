import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role={session.user.role} nome={session.user.name ?? ""} />
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  );
}
