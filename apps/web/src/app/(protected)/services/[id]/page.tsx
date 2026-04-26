"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { useSession } from "@/context/session";
import { marketplaceApi, ApiClientError } from "@/lib/api";
import type { ServiceDto } from "@/lib/api";

export default function ServiceDetailPage() {
  const { token, isLoading: sessionLoading } = useSession();
  const params = useParams();
  const serviceId = typeof params["id"] === "string" ? params["id"] : null;

  const [service, setService] = useState<ServiceDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionLoading || token === null || serviceId === null) return;

    setIsLoading(true);
    setError(null);

    marketplaceApi
      .getServiceById(token, serviceId)
      .then((data) => { setService(data); })
      .catch((err: unknown) => {
        setError(err instanceof ApiClientError ? err.message : "Error al cargar el servicio.");
      })
      .finally(() => { setIsLoading(false); });
  }, [token, sessionLoading, serviceId]);

  if (sessionLoading || isLoading) return <p>Cargando...</p>;
  if (error !== null) return <p role="alert">Error: {error}</p>;
  if (service === null) return null;

  return (
    <main style={{ padding: "24px" }}>
      <Link href="/services">← Volver a Servicios</Link>
      <h1>{service.title}</h1>
      <dl style={{ lineHeight: "2" }}>
        <dt>Tipo</dt>
        <dd>{service.type}</dd>
        <dt>Precio</dt>
        <dd>${service.price}</dd>
        {service.description.length > 0 && (
          <>
            <dt>Descripción</dt>
            <dd>{service.description}</dd>
          </>
        )}
        <dt>Ubicación</dt>
        <dd>{service.location}</dd>
      </dl>
      <div style={{ marginTop: "16px" }}>
        <Link href={`/bookings?serviceId=${service.id}`}>
          Reservar este servicio →
        </Link>
      </div>
    </main>
  );
}
