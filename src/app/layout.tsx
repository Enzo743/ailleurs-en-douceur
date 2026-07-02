import type { Metadata } from "next";
import { Libre_Baskerville, Lora, Sacramento } from "next/font/google";
import "@/styles/globals.scss";

const libreBaskerville = Libre_Baskerville({
  weight: ["400", "500", "600", "700"],
  variable: "--font-libre",
  subsets: ["latin"],
});

const lora = Lora({
  weight: ["400", "500", "600", "700"],
  variable: "--font-lora",
  subsets: ["latin"],
});

const sacramento = Sacramento({
  weight: "400",
  variable: "--font-sacramento",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ailleurs en Douceur - L'art de voyager autrement",
  description:
    "Ailleurs en Douceur vous propose des voyages sur mesure, des escapades en douceur et des expériences uniques pour découvrir le monde autrement.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${lora.variable} ${libreBaskerville.variable} ${sacramento.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
