import "~/styles/globals.css";

import { type Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import { Toaster } from "sonner";

import { TRPCReactProvider } from "~/trpc/react";
import { NavBar } from "~/components/nav-bar";
import { ThemeProvider } from "~/components/theme-provider";

export const metadata: Metadata = {
  title: "The Vault",
  description: "Custom designer trading community and marketplace",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('vault-theme');document.body.className=t==='light'?'light':'dark'}catch(e){document.body.className='dark'}})()`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <TRPCReactProvider>
            <NavBar />
            {children}
          </TRPCReactProvider>
          <Toaster position="bottom-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
