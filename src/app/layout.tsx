import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { createClient } from "@/lib/supabase/server";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Barc — Pet telehealth for dogs",
  description:
    "AI-powered guidance and licensed veterinarian support for your dog’s health.",
  openGraph: {
    title: "Barc — Pet telehealth for dogs",
    description:
      "AI-powered guidance and licensed veterinarian support for your dog’s health.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Barc — Pet telehealth for dogs",
    description:
      "AI-powered guidance and licensed veterinarian support for your dog’s health.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en" className={`${manrope.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <SiteHeader user={user} />
        <div className="flex flex-1 flex-col">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
