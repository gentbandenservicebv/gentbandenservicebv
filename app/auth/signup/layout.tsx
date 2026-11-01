import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Account Registreren | Gent Bandenservice BV",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignUpLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
