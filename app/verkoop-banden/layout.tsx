import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tweedehands banden verkopen | Gent Bandenservice",
  description:
    "Heeft u tweedehands banden te koop? Vul ons formulier in en ontvang een bod van Gent Bandenservice. Wij kopen banden van alle merken en maten in goede staat.",
};

export default function VerkoopBandenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
