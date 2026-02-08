import { auth, signOut } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { AdminThemeProvider } from "@/components/admin/AdminThemeProvider";
import { AdminThemeToggle } from "@/components/admin/AdminThemeToggle";

export const dynamic = "force-dynamic";

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
    <AdminThemeProvider>
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){var k='admin-dark-mode';var v=localStorage.getItem(k);if(v==='dark'||(v===null&&window.matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark');else document.documentElement.classList.remove('dark');})();`,
        }}
      />
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-14">
              <div className="flex items-center gap-4">
                <Link href="/admin/produtos" className="font-semibold text-lg text-foreground">
                  Produtos
                </Link>
                <Link href="/admin/domains" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Domínios
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <AdminThemeToggle />
                {session?.user && (
                  <>
                    <span className="text-sm text-muted-foreground hidden sm:inline">
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
    </AdminThemeProvider>
  );
}
