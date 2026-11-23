import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GOAT VFX | Visual Effects, CGI & Creative Production",
  description: "Explore cinematic visual effects, CGI, animation and creative production by GOAT VFX.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
