import type { Metadata, Viewport } from "next";
import { Noto_Sans_SC, Noto_Sans_Tamil } from "next/font/google";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { UserProfileProvider } from "@/components/auth/UserProfileProvider";
import "./globals.css";

const notoSansSC = Noto_Sans_SC({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-noto-sc",
});

const notoSansTamil = Noto_Sans_Tamil({
  weight: ["400", "700"],
  subsets: ["tamil"],
  display: "swap",
  preload: false,
  variable: "--font-noto-tamil",
});

export const metadata: Metadata = {
  applicationName: "Physio-Aid",
  title: "Physio-Aid",
  description:
    "A web-based physiotherapy support platform for ability-confidence screening.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Physio-Aid",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1F6B5B",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`h-full antialiased ${notoSansSC.variable} ${notoSansTamil.variable}`}
      lang="en"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <UserProfileProvider>
            <LanguageProvider>{children}</LanguageProvider>
          </UserProfileProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
