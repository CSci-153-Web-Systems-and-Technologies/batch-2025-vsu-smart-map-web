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
import "./globals.css";

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
    default: "VSU SmartMap",
    template: "%s | VSU SmartMap",
  },
  description:
    "Interactive campus map for Visayas State University. Find buildings, facilities, and get directions with AI-powered assistance.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VSU SmartMap",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: defaultUrl,
    title: "VSU SmartMap",
    description: "Interactive campus map for Visayas State University. Find buildings, facilities, and get directions with AI-powered assistance.",
    siteName: "VSU SmartMap",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "VSU SmartMap preview showing the campus map and search",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VSU SmartMap",
    description: "Interactive campus map for Visayas State University. AI-powered navigation and facility directory.",
    images: ["/og-image.png"],
    creator: "@VSU", // or remove if not applicable, keeping generic for now or user handle
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
            <Script
              src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
              strategy="afterInteractive"
            />
            <NavigationProgress />
            <Toaster />
            <ServiceWorkerRegistration />
            <SkipLink />
            {children}
            <Analytics />
          </MapStyleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
