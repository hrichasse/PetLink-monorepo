import { Calendar, MapPin, PawPrint, Star, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/petlink/StatusBadge";
import { normalizeBookingStatus, type Announcement, type Booking, type Pet, type Service, type Vet } from "@/lib/petlink-data";

export function PetCard({ pet }: { pet: Pet }) {
  const image = pet.imageUrl ?? pet.image_url;
  return <article className="group rounded-card border bg-card p-5 shadow-soft transition-all hover:-translate-y-1 hover:shadow-warm"><div className="mb-4 flex h-28 items-center justify-center rounded-2xl bg-petal text-5xl">{image ? <img src={image} alt={pet.name} className="h-full w-full rounded-2xl object-cover" /> : "🐾"}</div><div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-extrabold">{pet.name}</h3><p className="text-sm text-muted-foreground">{pet.species} · {pet.breed} · {pet.age} año{pet.age === 1 ? "" : "s"}</p></div><PawPrint className="h-5 w-5 text-primary" /></div><p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{pet.description ?? pet.notes ?? "Sin descripción"}</p></article>;
}

export function ServiceCard({ service }: { service: Service }) {
  return <article className="group overflow-hidden rounded-card border bg-card shadow-soft transition-all hover:-translate-y-1 hover:shadow-warm"><div className="flex h-36 items-center justify-center bg-gradient-hero text-6xl">{service.image ?? "🐕"}</div><div className="p-5"><div className="mb-2 flex items-center justify-between"><span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">{service.category ?? service.type}</span><span className="flex items-center gap-1 text-sm font-bold"><Star className="h-4 w-4 fill-current text-primary" />{service.rating ?? "Nuevo"}</span></div><h3 className="text-lg font-extrabold">{service.title}</h3><p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{service.city ?? service.location} · {service.providerName ?? "Proveedor"}</p><p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{service.description}</p><div className="mt-4 flex items-center justify-between"><strong className="text-xl">${service.price}<span className="text-xs text-muted-foreground">/servicio</span></strong><Button size="sm" variant="hero">Reservar</Button></div></div></article>;
}

export function BookingCard({ booking, onStatus, onCancel }: { booking: Booking; onStatus?: (status: Booking["status"]) => void; onCancel?: () => void }) {
  const status = normalizeBookingStatus(booking.status);
  const canCancel = Boolean(onCancel) && status !== "cancelled" && status !== "completed";
  return <article className="rounded-card border bg-card p-5 shadow-soft"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><StatusBadge status={status} /><h3 className="mt-3 text-lg font-extrabold">{booking.serviceTitle ?? `Servicio ${booking.serviceId.slice(0, 8)}`}</h3><p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><Calendar className="h-4 w-4" />{booking.date ?? new Date(booking.bookingDate).toLocaleString()} · {booking.petName ?? `Mascota ${booking.petId.slice(0, 8)}`}</p></div><div className="flex items-center gap-2"><strong>{booking.total ? `$${booking.total}` : `${booking.durationHours ?? 1}h`}</strong>{canCancel && <Button size="sm" variant="outline" onClick={onCancel}>Cancelar</Button>}{onStatus && status === "pending" && <><Button size="sm" variant="outline" onClick={() => onStatus("CANCELLED")}>Rechazar</Button><Button size="sm" variant="hero" onClick={() => onStatus("CONFIRMED")}>Aceptar</Button></>}</div></div></article>;
}

export function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  return <article className="rounded-card border bg-card p-5 shadow-soft"><span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">{announcement.type}</span><h3 className="mt-4 text-lg font-extrabold">{announcement.title}</h3><p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{announcement.location ?? announcement.city ?? "Sin ubicación"}</p><p className="mt-3 text-sm text-muted-foreground">{announcement.description}</p></article>;
}

export function VetCard({ vet }: { vet: Vet }) {
  return <article className="rounded-card border bg-card p-5 shadow-soft"><div className="flex items-start justify-between"><div className="rounded-full bg-teal-soft p-3 text-info-foreground"><Stethoscope className="h-6 w-6" /></div><span className="rounded-full bg-success/15 px-3 py-1 text-xs font-bold text-success-foreground">{vet.isActive ? "Activa" : "Inactiva"}</span></div><h3 className="mt-4 text-lg font-extrabold">{vet.name}</h3><p className="mt-1 text-sm text-muted-foreground">{vet.city ?? "Ciudad no indicada"} · {vet.phone ?? "Sin teléfono"}</p><p className="mt-2 flex items-center gap-1 text-sm font-bold"><Star className="h-4 w-4 fill-current text-primary" />{vet.isPartner ? "Partner" : "Directorio"}</p></article>;
}
