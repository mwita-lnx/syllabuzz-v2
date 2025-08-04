import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotesProvider } from "@/contexts/NotesContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SyllaBuzz - AI-Powered University Learning Platform",
  description: "Comprehensive learning platform for universities with AI-powered content analysis and collaborative study tools",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <ErrorBoundary>
          <AuthProvider>
            <NotesProvider>
              {children}
              <Toaster position="top-right" />
            </NotesProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
