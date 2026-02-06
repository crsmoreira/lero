import Link from "next/link";

export function StoreFooter() {
  return (
    <footer className="mt-6 w-full border-y-2 border-b-green-600 border-t-gray-200 py-6">
      <div className="relative mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="space-y-4">
            <h3 className="font-bold text-black text-base">Compre</h3>
            <ul className="space-y-1 text-gray-600 text-sm">
              <li>
                <Link href="/produtos" className="hover:text-green-700 hover:underline">
                  Produtos
                </Link>
              </li>
              <li>
                <Link href="/produtos" className="hover:text-green-700 hover:underline">
                  Ofertas
                </Link>
              </li>
              <li>
                <Link href="/produtos" className="hover:text-green-700 hover:underline">
                  Loja
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="font-bold text-black text-base">Ajuda</h3>
            <ul className="space-y-1 text-gray-600 text-sm">
              <li>
                <Link href="/fale-conosco" className="hover:text-green-700 hover:underline">
                  Fale conosco
                </Link>
              </li>
              <li>
                <Link href="/troca-devolucao" className="hover:text-green-700 hover:underline">
                  Troca e devolução
                </Link>
              </li>
              <li>
                <Link href="/entregas" className="hover:text-green-700 hover:underline">
                  Entregas
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="font-bold text-black text-base">Institucional</h3>
            <ul className="space-y-1 text-gray-600 text-sm">
              <li>
                <Link href="/sobre" className="hover:text-green-700 hover:underline">
                  Sobre nós
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-green-700 hover:underline">
                  Área admin
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-200 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} Loja - Todos os direitos reservados
        </div>
      </div>
    </footer>
  );
}
