import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Mijn Account | Gent Bandenservice BV",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AccountLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
