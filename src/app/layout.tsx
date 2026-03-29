import type { Metadata } from "next";
import { Noto_Sans_Arabic, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { SessionSync } from "@/components/auth/SessionSync";
import ErrorBoundary from "@/components/ErrorBoundary";
import WhatsAppButton from "@/components/store/WhatsAppButton";
import { ScrollToTopButton } from "@/components/store/ScrollToTopButton";
import { StoreStructuredData, WebsiteStructuredData, BreadcrumbStructuredData } from "@/components/store/StructuredData";

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
        <meta name="theme-color" content="#ffffff" />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow, max-video-preview:-1, max-image-preview:large, max-snippet:-1" />
        <link rel="canonical" href="https://kamal-saad.vercel.app" />
        {/* Structured Data for SEO */}
        <StoreStructuredData />
        <WebsiteStructuredData />
        <BreadcrumbStructuredData />
        {/* Theme initialization - respect user choice */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedTheme = localStorage.getItem('kamal-saad-store');
                  var isDark = false;

                  if (savedTheme) {
                    var parsed = JSON.parse(savedTheme);
                    if (parsed.state && parsed.state.theme) {
                      isDark = parsed.state.theme === 'dark';
                    }
                  } else {
                    // No saved preference - default to light
                    isDark = false;
                  }

                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
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
