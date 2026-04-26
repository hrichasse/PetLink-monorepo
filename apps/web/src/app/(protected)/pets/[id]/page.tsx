"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { useSession } from "@/context/session";
import { petsApi, ApiClientError } from "@/lib/api";
import type { PetDto } from "@/lib/api";

export default function PetDetailPage() {
  const { token, isLoading: sessionLoading } = useSession();
  const params = useParams();
  // noUncheckedIndexedAccess: params["id"] is string | string[] | undefined
  const petId = typeof params["id"] === "string" ? params["id"] : null;

  const [pet, setPet] = useState<PetDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionLoading || token === null || petId === null) return;

    setIsLoading(true);
    setError(null);

    petsApi
      .getPetById(token, petId)
      .then((data) => { setPet(data); })
      .catch((err: unknown) => {
        setError(err instanceof ApiClientError ? err.message : "Error al cargar la mascota.");
      })
      .finally(() => { setIsLoading(false); });
  }, [token, sessionLoading, petId]);

  if (sessionLoading || isLoading) return <p>Cargando...</p>;
  if (error !== null) return <p role="alert">Error: {error}</p>;
  if (pet === null) return null;

  return (
    <main style={{ padding: "24px" }}>
      <Link href="/pets">← Volver a Mascotas</Link>
      <h1>{pet.name}</h1>
      <dl style={{ lineHeight: "2" }}>
        <dt>Especie</dt>
        <dd>{pet.species}</dd>
        <dt>Raza</dt>
        <dd>{pet.breed}</dd>
        <dt>Edad</dt>
        <dd>{pet.age} años</dd>
        <dt>Peso</dt>
        <dd>{pet.weight} kg</dd>
        <dt>Sexo</dt>
        <dd>{pet.sex}</dd>
        <dt>Esterilizado</dt>
        <dd>{pet.isSterilized ? "Sí" : "No"}</dd>
        <dt>Vacunado</dt>
        <dd>{pet.isVaccinated ? "Sí" : "No"}</dd>
        {pet.description !== null && (
          <>
            <dt>Descripción</dt>
            <dd>{pet.description}</dd>
          </>
        )}
      </dl>
    </main>
  );
}
