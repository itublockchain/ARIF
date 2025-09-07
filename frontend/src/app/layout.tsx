import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "@/components/ui/toaster";
import "@rainbow-me/rainbowkit/styles.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className="min-h-dvh bg-slate-900 text-slate-100 dark"
        suppressHydrationWarning
      >
        <Providers>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
