// Trigger redeploy

import type { Metadata } from "next";
// ... (残りのコード)

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "react-datepicker/dist/react-datepicker.css";
import Sidebar from "@/components/Sidebar"; // ★★★ Headerの代わりにSidebarを読み込む ★★★

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "X Post App",
  description: "AI Powered Post Generation and Scheduling Tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${inter.className} bg-gray-100`}>
        {/* ★★★ ここからレイアウトを大きく変更 ★★★ */}
        <div className="flex h-screen">
          <Sidebar />
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}