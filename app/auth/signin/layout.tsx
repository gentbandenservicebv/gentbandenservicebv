import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Inloggen | Gent Bandenservice BV",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignInLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
