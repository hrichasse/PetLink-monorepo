"use client";

import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Store } from "lucide-react";
import { PublicNav } from "@/components/petlink/Layout";
import { PetlinkFooter } from "@/components/petlink/Footer";
import { ServiceCard } from "@/components/petlink/Cards";
import { SkeletonGrid } from "@/components/petlink/SkeletonGrid";
import { EmptyState } from "@/components/petlink/EmptyState";
import { marketplaceApi } from "@/lib/petlink-api";

export function ProviderProfilePage() {
  const { id = "" } = useParams();
  const { data: services = [], isLoading } = useQuery({
    queryKey: ["provider-profile", id],
    queryFn: () => marketplaceApi.services.list({ providerId: id, isActive: true }),
    enabled: Boolean(id)
  });

  const providerName = services[0]?.providerName ?? "Proveedor de PetLink";
  const providerCity = services[0]?.providerCity ?? services[0]?.city ?? null;

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <header className="mb-8 flex flex-col gap-4 rounded-card border bg-card p-6 shadow-soft sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Store className="h-8 w-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-primary">Proveedor verificado</p>
            <h1 className="text-3xl font-black">{providerName}</h1>
            {providerCity ? (
              <p className="mt-1 flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {providerCity}
              </p>
            ) : null}
            <p className="mt-1 text-sm font-bold text-muted-foreground">
              {services.length} servicio{services.length === 1 ? "" : "s"} publicado{services.length === 1 ? "" : "s"}
            </p>
          </div>
        </header>

        <h2 className="mb-4 text-2xl font-black">Servicios</h2>
        {isLoading ? (
          <SkeletonGrid />
        ) : services.length ? (
          <div className="grid gap-5 md:grid-cols-3">
            {services.map((service) => (
              <Link key={service.id} to={`/services/${service.id}`}>
                <ServiceCard service={service} />
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="Sin servicios publicados" description="Este proveedor aún no tiene servicios activos." />
        )}
      </main>
      <PetlinkFooter />
    </div>
  );
}
