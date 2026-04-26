"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useSession } from "@/context/session";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const { session, isLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && session === null) {
      router.push("/login");
    }
  }, [session, isLoading, router]);

  if (isLoading) {
    return <p>Cargando sesión...</p>;
  }

  if (session === null) {
    return null;
  }

  return (
    <>
      <nav style={{ padding: "8px", borderBottom: "1px solid #ddd", display: "flex", gap: "16px" }}>
        <Link href="/profile">Perfil</Link>
        <Link href="/pets">Mascotas</Link>
        <Link href="/services">Servicios</Link>
        <Link href="/bookings">Reservas</Link>
      </nav>
      {children}
    </>
  );
}
