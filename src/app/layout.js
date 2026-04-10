import { IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  title: "Arthur Alves — Desenvolvedor Fullstack",
  description:
    "Portfólio pessoal de Arthur Alves. Desenvolvedor Fullstack especializado em aplicações web modernas com React, Next.js e Node.js.",
  keywords: [
    "desenvolvedor",
    "fullstack",
    "react",
    "next.js",
    "portfólio",
    "frontend",
    "backend",
  ],
  authors: [{ name: "Arthur Alves" }],
  openGraph: {
    title: "Arthur Alves — Desenvolvedor Fullstack",
    description:
      "Portfólio pessoal de Arthur Alves. Desenvolvedor Fullstack especializado em aplicações web modernas.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="pt-BR"
      className={`${ibmPlexSans.variable} h-full antialiased`}
    >
      <body className="noise-overlay min-h-full flex flex-col">{children}</body>
    </html>
  );
}
