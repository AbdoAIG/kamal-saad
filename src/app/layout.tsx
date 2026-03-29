import type { Metadata } from "next";
import { Noto_Sans_Arabic, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { SessionSync } from "@/components/auth/SessionSync";
import ErrorBoundary from "@/components/ErrorBoundary";
import WhatsAppButton from "@/components/store/WhatsAppButton";
import { ScrollToTopButton } from "@/components/store/ScrollToTopButton";

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
    <html lang="ar" className="light" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        {/* Force light mode - dark mode disabled */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                document.documentElement.classList.remove('dark');
                document.documentElement.classList.add('light');
                // Clear any stale dark theme from localStorage
                try {
                  var saved = localStorage.getItem('kamal-saad-store');
                  if (saved) {
                    var parsed = JSON.parse(saved);
                    if (parsed.state && parsed.state.theme === 'dark') {
                      parsed.state.theme = 'light';
                      localStorage.setItem('kamal-saad-store', JSON.stringify(parsed));
                    }
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${notoSansArabic.variable} ${inter.variable} font-sans antialiased bg-background text-foreground`}
        style={{ fontFamily: 'var(--font-arabic), var(--font-english), system-ui, sans-serif' }}
      >
        <ErrorBoundary>
          <AuthProvider>
            <SessionSync />
            {children}
            {/* WhatsApp Contact Button */}
            <WhatsAppButton />
            {/* Scroll to Top */}
            <ScrollToTopButton />
          </AuthProvider>
        </ErrorBoundary>
        <Toaster />
      </body>
    </html>
  );
}
