import { auth, signOut } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session = null;
  try {
    session = await auth();
  } catch (err) {
    console.error("Auth error in admin layout:", err);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <Link href="/admin/produtos" className="font-semibold text-lg">
              Admin · Produtos
            </Link>
            <div className="flex items-center gap-4">
              {session?.user && (
                <>
                  <span className="text-sm text-gray-600 hidden sm:inline">
                    {session.user.email}
                  </span>
                  <form
                    action={async () => {
                      "use server";
                      await signOut();
                      redirect("/admin/login");
                    }}
                  >
                    <Button type="submit" variant="outline" size="sm">
                      Sair
                    </Button>
                  </form>
                </>
              )}
              <Link href="/" target="_blank">
                <Button variant="ghost" size="sm">
                  Ver Loja
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
