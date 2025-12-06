import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { ptSans, sourceCodePro } from "@/lib/typography";
import { SkipLink } from "@/components/skip-link";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: {
    default: "VSU SmartMap",
    template: "%s | VSU SmartMap",
  },
  description:
    "Interactive campus map for Visayas State University. Find buildings, facilities, and get directions with AI-powered assistance.",
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
          <SkipLink />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
