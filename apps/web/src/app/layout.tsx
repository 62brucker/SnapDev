import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://snapdev.dev"),
  title: "SnapDev — Show your AI coder what is on your phone",
  description: "Triple-tap your iPhone to send a real-device screenshot directly to your AI coding workflow. Private, instant, and built for mobile developers.",
  openGraph: {
    title: "SnapDev — Triple-tap your phone. Show your AI coder.",
    description: "Real-device screenshots delivered directly to your AI coding workflow, without AirDrop or cloud screenshot storage.",
    type: "website",
    images: ["/og.png"]
  },
  twitter: {
    card: "summary_large_image",
    title: "SnapDev — Triple-tap your phone. Show your AI coder.",
    description: "Real-device screenshots delivered directly to your AI coding workflow.",
    images: ["/og.png"]
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
