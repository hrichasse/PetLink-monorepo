"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "next/navigation";

import { useSession } from "@/context/session";
import { marketplaceApi, petsApi, ApiClientError } from "@/lib/api";
import type { BookingDto, PetDto } from "@/lib/api";

export default function BookingsPage() {
  const { token, isLoading: sessionLoading } = useSession();
  const searchParams = useSearchParams();

  // Data
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [pets, setPets] = useState<PetDto[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Create form state
  const [petId, setPetId] = useState("");
  const [serviceId, setServiceId] = useState(searchParams.get("serviceId") ?? "");
  const [bookingDate, setBookingDate] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);

  useEffect(() => {
    if (sessionLoading || token === null) return;

    setIsLoadingData(true);

    Promise.all([
      marketplaceApi.listMyBookings(token, "owner"),
      petsApi.listMyPets(token)
    ])
      .then(([bookingsData, petsData]) => {
        setBookings(bookingsData);
        setPets(petsData);
        // Pre-select first pet (noUncheckedIndexedAccess: petsData[0] may be undefined)
        const firstPet = petsData[0];
        if (firstPet !== undefined) {
          setPetId(firstPet.id);
        }
      })
      .catch((err: unknown) => {
        setLoadError(err instanceof ApiClientError ? err.message : "Error al cargar los datos.");
      })
      .finally(() => { setIsLoadingData(false); });
  }, [token, sessionLoading]);

  const handleCreate = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (token === null || petId === "" || serviceId === "" || bookingDate === "") return;

    setIsCreating(true);
    setCreateError(null);
    setCreateSuccess(false);

    try {
      const booking = await marketplaceApi.createBooking(token, {
        petId,
        serviceId,
        bookingDate: new Date(bookingDate).toISOString()
      });
      setBookings((prev) => [booking, ...prev]);
      setCreateSuccess(true);
      setServiceId("");
      setBookingDate("");
    } catch (err: unknown) {
      setCreateError(err instanceof ApiClientError ? err.message : "Error al crear la reserva.");
    } finally {
      setIsCreating(false);
    }
  };

  if (sessionLoading || isLoadingData) return <p>Cargando...</p>;
  if (loadError !== null) return <p role="alert">Error: {loadError}</p>;

  return (
    <main style={{ padding: "24px" }}>
      <h1>Reservas</h1>

      {/* ── Create form ── */}
      <section style={{ marginBottom: "32px", maxWidth: "480px" }}>
        <h2>Nueva reserva</h2>
        <form onSubmit={(e) => { void handleCreate(e); }}>
          <div style={{ marginBottom: "12px" }}>
            <label htmlFor="pet">Mascota</label>
            <br />
            <select
              id="pet"
              value={petId}
              onChange={(e) => setPetId(e.target.value)}
              required
              disabled={pets.length === 0}
              style={{ width: "100%" }}
            >
              {pets.length === 0 && <option value="">Sin mascotas registradas</option>}
              {pets.map((pet) => (
                <option key={pet.id} value={pet.id}>
                  {pet.name} ({pet.species})
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label htmlFor="serviceId">ID del servicio</label>
            <br />
            <input
              id="serviceId"
              type="text"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              required
              placeholder="UUID del servicio"
              style={{ width: "100%" }}
            />
            <small>
              Obtén el ID desde la sección{" "}
              <a href="/services">Servicios</a>.
            </small>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label htmlFor="bookingDate">Fecha y hora</label>
            <br />
            <input
              id="bookingDate"
              type="datetime-local"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              required
              style={{ width: "100%" }}
            />
          </div>

          {createError !== null && (
            <p role="alert" style={{ color: "red" }}>
              {createError}
            </p>
          )}
          {createSuccess && (
            <p style={{ color: "green" }}>Reserva creada correctamente.</p>
          )}
          <button
            type="submit"
            disabled={isCreating || pets.length === 0}
          >
            {isCreating ? "Creando..." : "Crear reserva"}
          </button>
        </form>
      </section>

      {/* ── Booking list ── */}
      <section>
        <h2>Historial</h2>
        {bookings.length === 0 ? (
          <p>No tienes reservas.</p>
        ) : (
          <ul>
            {bookings.map((booking) => (
              <li key={booking.id} style={{ marginBottom: "8px" }}>
                <strong>Servicio:</strong> {booking.serviceId}
                {" — "}
                <strong>Estado:</strong> {booking.status}
                {" — "}
                <strong>Fecha:</strong>{" "}
                {new Date(booking.bookingDate).toLocaleString("es-CL")}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
