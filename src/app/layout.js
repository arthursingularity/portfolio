import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

{/*
export const metadata = {
  title: "Arthur Development Workspace",
  description:
    "Portfólio pessoal de Arthur Alves. Desenvolvedor Fullstack especializado em JavaScript.",
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
    title: "Arthur Development Workspace",
    description:
      "Portfólio pessoal de Arthur Alves. Desenvolvedor Fullstack especializado em aplicações web modernas.",
    type: "website",
  },
};

*/}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="noise-overlay min-h-full flex flex-col">{children}</body>
    </html>
  );
}
