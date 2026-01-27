import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";



export const metadata: Metadata = {
  title: "Chatterly",
  description: "Chatterly – Connect instantly. Chat effortlessly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
       
      >
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
