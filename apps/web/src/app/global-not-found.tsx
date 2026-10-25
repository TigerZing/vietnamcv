import Link from "next/link";

import { DEFAULT_THEME, themeInitScript } from "@/lib/theme";

import "./globals.css";

// Rendered for URLs that match no route at all (the locale proxy redirects most paths
// to /vi or /en first). It bypasses layouts, so it imports its own styles.
export default function GlobalNotFound() {
  return (
    <html lang="vi" data-theme={DEFAULT_THEME} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-screen items-center justify-center p-6 font-sans">
        <main className="text-center">
          <h1 className="text-2xl font-semibold">404</h1>
          <p className="mt-2">Không tìm thấy trang · Page not found</p>
          <Link className="mt-4 inline-block text-accent underline" href="/vi">
            VietnamCV
          </Link>
        </main>
      </body>
    </html>
  );
}
