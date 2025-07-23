'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { name: 'プロジェクト', href: '/' },
  { name: '投稿者キャラクター', href: '/characters' },
  { name: 'ターゲットペルソナ', href: '/targets' }, // ★★★ この行を追加 ★★★
  { name: 'プロンプト設定', href: '/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex-shrink-0">
      <div className="h-full flex flex-col">
        <div className="h-16 flex items-center justify-center px-4 border-b">
          <Link href="/" className="text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors">
            X Post App
          </Link>
        </div>
        <nav className="flex-grow p-4">
          <ul className="space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {link.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
}