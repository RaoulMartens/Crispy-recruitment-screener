import type { Metadata } from "next";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/800.css";
import "./globals.css";

const siteUrl = "https://werkonderzoek-screener.vercel.app";
const title = "Denk mee over werk en personeel";
const description =
  "Raoul onderzoekt hoe mensen werk vinden, waarom ze blijven of overstappen en hoe kleinere werkgevers personeel aannemen. Help mee aan zijn afstudeeronderzoek bij Crispy; aanmelden duurt 1–2 minuten.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  openGraph: {
    type: "website",
    locale: "nl_NL",
    url: siteUrl,
    title,
    description,
    siteName: "Crispy afstudeeronderzoek",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  icons: {
    icon: "/icon.svg",
  },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="nl" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
