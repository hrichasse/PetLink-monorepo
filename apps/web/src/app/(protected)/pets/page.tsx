"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { useSession } from "@/context/session";
import { petsApi, ApiClientError } from "@/lib/api";
import type { PetDto } from "@/lib/api";

export default function PetsPage() {
  const { token, isLoading: sessionLoading } = useSession();
  const [pets, setPets] = useState<PetDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionLoading || token === null) return;

    setIsLoading(true);
    setError(null);

    petsApi
      .listMyPets(token)
      .then((data) => { setPets(data); })
      .catch((err: unknown) => {
        setError(err instanceof ApiClientError ? err.message : "Error al cargar las mascotas.");
      })
      .finally(() => { setIsLoading(false); });
  }, [token, sessionLoading]);

  if (sessionLoading || isLoading) return <p>Cargando mascotas...</p>;
  if (error !== null) return <p role="alert">Error: {error}</p>;

  return (
    <main style={{ padding: "24px" }}>
      <h1>Mis Mascotas</h1>
      {pets.length === 0 ? (
        <p>No tienes mascotas registradas.</p>
      ) : (
        <ul>
          {pets.map((pet) => (
            <li key={pet.id} style={{ marginBottom: "8px" }}>
              <Link href={`/pets/${pet.id}`}>
                <strong>{pet.name}</strong> — {pet.species} ({pet.breed})
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
