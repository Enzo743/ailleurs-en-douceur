import type { Metadata } from "next";
import {Instrument_Sans, Inter, Libre_Baskerville, Lora, Sacramento} from "next/font/google";
import "@/styles/globals.scss";
import BannerWrapper from "@/components/BannerWrapper";

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

const inter = Inter({
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  subsets: ["latin"],
});

const instrument = Instrument_Sans({
  weight: ["400", "600"],
  variable: "--font-instrument",
  subsets: ["latin"],
})

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
      className={`${lora.variable} ${libreBaskerville.variable} ${sacramento.variable} ${inter.variable} ${instrument.variable}`}
    >
      <body>
        <BannerWrapper />
        {children}
      </body>
    </html>
  );
}
