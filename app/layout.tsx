import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "next-themes";
import { ptSans, sourceCodePro } from "@/lib/typography";
import { SkipLink } from "@/components/skip-link";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import { NavigationProgress } from "@/components/navigation-progress";
import { Toaster } from "@/components/ui/sonner";
import { MapStyleProvider } from "@/lib/context/map-style-context";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import { SyncProvider } from "@/components/providers/sync-provider";
import { ProjectDisclaimerDialog } from "@/components/project-disclaimer-dialog";
import "./globals.css";

const siteTitle = "Campus SmartMap for VSU";
const siteDescription =
  "Unofficial student-led campus map for Visayas State University, with building search, facility details, and campus navigation help.";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#166534",
};

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: {
    default: siteTitle,
    template: `%s | ${siteTitle}`,
  },
  description: siteDescription,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: siteTitle,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: defaultUrl,
    title: siteTitle,
    description: siteDescription,
    siteName: siteTitle,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Campus SmartMap for VSU preview with an unofficial student-led campus map disclaimer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/og-image.png"],
  },
  verification: {
    google: "QEaVt0p58N8prtIVnsV9aIZV3Ezp_Q1JycBe2A81hR8",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${ptSans.variable} ${sourceCodePro.variable} antialiased`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <MapStyleProvider>
            <SyncProvider>
              <Script
                src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
                strategy="afterInteractive"
              />
              <NavigationProgress />
              <Toaster />
              <ServiceWorkerRegistration />
              <SkipLink />
              <ProjectDisclaimerDialog />
              {children}
            </SyncProvider>
            <Analytics />
          </MapStyleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
