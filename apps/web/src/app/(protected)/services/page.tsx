"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { useSession } from "@/context/session";
import { marketplaceApi, ApiClientError } from "@/lib/api";
import type { ServiceDto } from "@/lib/api";

export default function ServicesPage() {
  const { token, isLoading: sessionLoading } = useSession();
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionLoading || token === null) return;

    setIsLoading(true);
    setError(null);

    marketplaceApi
      .listServices(token)
      .then((data) => { setServices(data); })
      .catch((err: unknown) => {
        setError(err instanceof ApiClientError ? err.message : "Error al cargar los servicios.");
      })
      .finally(() => { setIsLoading(false); });
  }, [token, sessionLoading]);

  if (sessionLoading || isLoading) return <p>Cargando servicios...</p>;
  if (error !== null) return <p role="alert">Error: {error}</p>;

  return (
    <main style={{ padding: "24px" }}>
      <h1>Servicios Disponibles</h1>
      {services.length === 0 ? (
        <p>No hay servicios disponibles.</p>
      ) : (
        <ul>
          {services.map((svc) => (
            <li key={svc.id} style={{ marginBottom: "8px" }}>
              <Link href={`/services/${svc.id}`}>
                <strong>{svc.title}</strong> — {svc.type} — ${svc.price}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
