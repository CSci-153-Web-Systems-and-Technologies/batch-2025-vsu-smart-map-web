import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "next-themes";
import { ptSans, sourceCodePro } from "@/lib/typography";
import { SkipLink } from "@/components/skip-link";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import { NavigationProgress } from "@/components/navigation-progress";
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
          <NavigationProgress />
          <ServiceWorkerRegistration />
          <SkipLink />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
