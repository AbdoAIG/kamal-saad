import type { Metadata } from "next";
import { Noto_Sans_Arabic, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { SessionSync } from "@/components/auth/SessionSync";
import ErrorBoundary from "@/components/ErrorBoundary";

const notoSansArabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-english",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Kamal Saad | كمال سعد - Office & School Supplies",
  description: "متجرك الإلكتروني الأول لجميع المستلزمات المدرسية والمكتبية بأفضل الأسعار في مصر. أقلام، دفاتر، حقائب، أدوات فنية ومكتبية.",
  keywords: ["كمال سعد", "مستلزمات مدرسية", "مستلزمات مكتبية", "أقلام", "دفاتر", "حقائب مدرسية", "أدوات فنية", "Kamal Saad", "school supplies", "office supplies", "Egypt"],
  authors: [{ name: "Kamal Saad" }],
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Kamal Saad | كمال سعد - Office & School Supplies",
    description: "متجرك الإلكتروني الأول لجميع المستلزمات المدرسية والمكتبية بأفضل الأسعار في مصر",
    type: "website",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body
        className={`${notoSansArabic.variable} ${inter.variable} font-sans antialiased bg-background text-foreground`}
        style={{ fontFamily: 'var(--font-arabic), var(--font-english), system-ui, sans-serif' }}
      >
        <ErrorBoundary>
          <AuthProvider>
            <SessionSync />
            {children}
          </AuthProvider>
        </ErrorBoundary>
        <Toaster />
      </body>
    </html>
  );
}
