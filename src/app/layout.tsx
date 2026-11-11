import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "Karen's Tic-tac-toe",
  description: "Simple design, instant gameplay, and endless mini matches. Play Karen's Tic-tac-toe with Rabbit and Carrot.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased min-h-screen transition-colors duration-300`}>
        {children}
      </body>
    </html>
  );
}
