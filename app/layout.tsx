import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0f",
}

export const metadata: Metadata = {
  title: "mujAnon - Anonymous Chat for MUJians",
  description: "One-tap anonymous chat for Manipal University Jaipur students. No names, real talks.",
  keywords: ["MUJ", "Manipal", "anonymous", "chat", "college"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
