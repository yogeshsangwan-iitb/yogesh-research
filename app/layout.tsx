import type { Metadata } from "next";
import { Schibsted_Grotesk } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ViewSwitch from "@/components/ViewSwitch";

// Runs before the page is shown: if a phone visitor picked "Desktop", widen the viewport
// so the laptop layout is used. Must match components/ViewSwitch.tsx.
const viewModeScript = `try{if(localStorage.getItem("view-mode")==="desktop"&&Math.min(screen.width,screen.height)<=767&&window.self===window.top){var m=document.querySelector('meta[name="viewport"]');if(m){var z=Math.min(1,screen.width/1280).toFixed(3);m.setAttribute("content","width=1280, initial-scale="+z+", minimum-scale="+z)}}}catch(e){}`;

const grotesk = Schibsted_Grotesk({
  variable: "--font-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Yogesh Sangwan — Research",
    template: "%s — Yogesh Sangwan",
  },
  description:
    "Independent research on startups, industries and markets, plus a daily brief of VC and startup news in plain English.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${grotesk.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <script dangerouslySetInnerHTML={{ __html: viewModeScript }} />
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        <Nav />
        {children}
        <Footer />
        <ViewSwitch />
      </body>
    </html>
  );
}
