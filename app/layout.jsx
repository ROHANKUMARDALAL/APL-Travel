import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display-family",
  display: "swap",
});

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body-family",
  display: "swap",
});

export const metadata = {
  title: "APL Travel | Flights, Hotels & Buses",
  description:
    "Global B2C travel platform to search flights, hotels, and buses worldwide — with curated deals and a fast booking experience.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full`}>
      <body className="site-shell antialiased">{children}</body>
    </html>
  );
}
