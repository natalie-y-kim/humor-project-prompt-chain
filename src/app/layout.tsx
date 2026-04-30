import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Sidebar } from "@/components/Sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Humor Project Prompt Chain",
  description: "Prompt chain application with Supabase auth",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        <ThemeProvider>
          <div className="flex">
            <Sidebar />
            <div className="flex-1 ml-16 md:ml-56 transition-all duration-300">
              {children}
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
