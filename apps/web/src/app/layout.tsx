import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SessionProvider } from "@/context/session";

export const metadata: Metadata = {
  title: "PetLink",
  description: "PetLink — La plataforma de servicios para mascotas."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
