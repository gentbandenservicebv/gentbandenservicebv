import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Bestelling | Gent Bandenservice BV",
  robots: {
    index: false,
    follow: false,
  },
};

export default function BestellingLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
