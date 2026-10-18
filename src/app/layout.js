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

export const metadata = {
  title: "Editor | Workspace",
  description:
    "Software de modelagem 3D.",
  keywords: [
    "3d",
    "cad",
    "software",
    "gratis",
    "online",
    "gratuito"
  ],
  authors: [{ name: "Arthur Alves" }],
  openGraph: {
    title: "Editor",
    description:
      "Software de modelagem 3D.",
    type: "website",
  },
};


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
