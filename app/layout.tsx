import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme";
import { ConnectionProvider } from "@/components/connection-provider";
import { DebugBanner } from "@/components/debug-banner";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f59e0b",
}

export const metadata: Metadata = {
  title: "mujAnon - Anonymous Chat for MUJians",
  description: "One-tap anonymous chat for Manipal University Jaipur students. No names, real talks.",
  keywords: ["MUJ", "Manipal", "anonymous", "chat", "college"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "mujAnon",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          <ConnectionProvider>
            {children}
            <DebugBanner />
          </ConnectionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
