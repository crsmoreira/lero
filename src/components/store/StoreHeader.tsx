import Link from "next/link";
import { Search, ShoppingCart } from "lucide-react";

export function StoreHeader() {
  return (
    <header className="relative z-50 antialiased shadow-sm bg-white">
      {/* Top bar - LM style */}
      <div className="relative py-2 bg-green-700 lg:bg-blue-900">
        <div className="relative mx-auto max-w-6xl px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-white text-sm">
            <div className="flex items-center gap-3">
              <button type="button" className="hover:underline">
                Onde você está?
              </button>
              <span>|</span>
              <Link href="/produtos" className="hover:underline">
                Produtos
              </Link>
            </div>
            <span className="font-bold text-xs sm:text-sm">
              Compre pelo telefone: 0800-000-0000
            </span>
            <Link href="/admin" className="hover:underline text-xs sm:text-sm">
              Admin
            </Link>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="relative mx-auto max-w-7xl px-4 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Link href="/produtos" className="flex items-center">
            <span className="font-bold text-xl text-green-700 lg:text-blue-900">
              Loja
            </span>
          </Link>

          <div className="flex-1 max-w-xl hidden md:block">
            <form action="/produtos" method="get" className="relative">
              <input
                type="text"
                name="busca"
                placeholder="Buscar produtos..."
                className="w-full border border-gray-300 rounded-lg py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                <Search size={20} />
              </button>
            </form>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/produtos"
              className="text-gray-600 hover:text-gray-900 text-sm font-medium hidden sm:block"
            >
              Catálogo
            </Link>
            <button
              type="button"
              className="relative flex items-center gap-2 text-gray-600 hover:text-gray-900"
              aria-label="Carrinho"
            >
              <ShoppingCart size={24} />
              <span className="text-sm hidden sm:inline">Carrinho</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
