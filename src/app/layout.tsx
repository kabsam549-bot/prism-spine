import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PRISM | Prognostic Index for Spinal Metastases",
  description:
    "Calculate the PRISM score for patients receiving spinal stereotactic radiosurgery. A validated prognostic index stratifying survival into four groups based on performance status, disease burden, and treatment history.",
  keywords: ["PRISM", "spine SBRT", "spinal metastases", "prognostic index", "stereotactic radiosurgery", "survival stratification"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
