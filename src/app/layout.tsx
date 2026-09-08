import type { Metadata } from "next";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/800.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Denk mee over werk vinden en medewerkers werven",
  description:
    "Voor mijn afstudeeronderzoek bij Crispy zoek ik werkzoekenden en mensen die betrokken zijn bij het werven van medewerkers voor een kort interview.",
  openGraph: {
    type: "website",
    locale: "nl_NL",
    title: "Denk mee over werk vinden en medewerkers werven",
    description:
      "Voor mijn afstudeeronderzoek bij Crispy zoek ik werkzoekenden en mensen die betrokken zijn bij het werven van medewerkers voor een kort interview.",
    siteName: "Crispy afstudeeronderzoek",
  },
  twitter: {
    card: "summary",
    title: "Denk mee over werk vinden en medewerkers werven",
    description:
      "Voor mijn afstudeeronderzoek bij Crispy zoek ik werkzoekenden en mensen die betrokken zijn bij het werven van medewerkers voor een kort interview.",
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
