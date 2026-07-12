import { Calendar, MapPin, PawPrint, Phone, Star, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/petlink/StatusBadge";
import { LocationMap } from "@/components/petlink/LocationMap";
import { normalizeBookingStatus, type Announcement, type Booking, type Pet, type Service, type Vet } from "@/lib/petlink-data";

const SERVICE_TYPE_LABELS: Record<string, string> = {
  WALKING: "Paseo",
  DAYCARE: "Hospedaje diario",
  BOARDING: "Hospedaje",
  TRAINING: "Entrenamiento",
  GROOMING: "Peluqueria",
  PET_SITTING: "Cuidado a domicilio",
  VETERINARY: "Veterinaria",
  ONLINE_STORE: "Tienda en linea",
  SPA: "Spa",
  PET_TAXI: "Transporte",
  OTHER: "Otros"
};

// Distinct visual per service type so cards don't all show the same image.
const SERVICE_TYPE_EMOJI: Record<string, string> = {
  WALKING: "🦮",
  DAYCARE: "☀️",
  BOARDING: "🏠",
  TRAINING: "🎓",
  GROOMING: "✂️",
  PET_SITTING: "🏡",
  VETERINARY: "🩺",
  ONLINE_STORE: "🛍️",
  SPA: "💆",
  PET_TAXI: "🚕",
  OTHER: "🐾"
};

const ANNOUNCEMENT_TYPE_LABELS: Record<string, string> = {
  LOST_PET: "Perdido",
  FOUND_PET: "Encontrado",
  ADOPTION: "Adopción",
  ADVERTISING: "Publicidad",
  GENERAL: "General"
};

function formatCLP(value: number): string {
  return new Intl.NumberFormat("es-CL").format(Math.trunc(value));
}

type PetCardProps = {
  pet: Pet;
  size?: "default" | "large";
  onImageClick?: () => void;
};

export function PetCard({ pet, size = "default", onImageClick }: PetCardProps) {
  const isLarge = size === "large";
  const image = pet.imageUrl ?? pet.image_url;

  return <article className={`group rounded-card border bg-card p-5 shadow-soft transition-all hover:-translate-y-1 hover:shadow-warm ${isLarge ? "md:p-7" : ""}`}><div className={`mb-4 flex items-center justify-center overflow-hidden rounded-2xl bg-petal text-5xl ${isLarge ? "h-56 md:h-72" : "h-40"}`}>{image ? onImageClick ? <button type="button" aria-label={`Ver foto de ${pet.name} en grande`} className="h-full w-full" onClick={(event) => { event.preventDefault(); event.stopPropagation(); onImageClick(); }}><img src={image} alt={pet.name} className="h-full w-full cursor-zoom-in rounded-2xl object-cover transition-transform duration-300 group-hover:scale-[1.02]" /></button> : <img src={image} alt={pet.name} className="h-full w-full rounded-2xl object-cover" /> : "🐾"}</div><div className="flex items-start justify-between gap-3"><div><h3 className={`font-extrabold ${isLarge ? "text-4xl" : "text-xl"}`}>{pet.name}</h3><p className={`text-muted-foreground ${isLarge ? "mt-2 text-lg" : "text-sm"}`}>{pet.species} · {pet.breed} · {pet.age} año{pet.age === 1 ? "" : "s"}</p></div><PawPrint className={`text-primary ${isLarge ? "h-7 w-7" : "h-5 w-5"}`} /></div><div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">{pet.sex === "FEMALE" ? "Hembra" : "Macho"}</span><span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">{pet.weight} kg</span><span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">{pet.isVaccinated ? "Vacunas al día" : "Vacunas pendientes"}</span></div><p className={`mt-4 line-clamp-3 text-muted-foreground ${isLarge ? "text-lg" : "text-sm"}`}>{pet.description ?? pet.notes ?? "Sin descripción"}</p></article>;
}

export function ServiceCard({ service }: { service: Service }) {
  return <article className="group overflow-hidden rounded-card border bg-card shadow-soft transition-all hover:-translate-y-1 hover:shadow-warm"><div className="flex h-36 items-center justify-center bg-gradient-hero text-6xl">{service.image ?? SERVICE_TYPE_EMOJI[service.type] ?? "🐾"}</div><div className="p-5"><div className="mb-2 flex items-center justify-between"><span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">{service.category ?? SERVICE_TYPE_LABELS[service.type] ?? service.type}</span><span className="flex items-center gap-1 text-sm font-bold"><Star className="h-4 w-4 fill-current text-primary" />{service.rating ?? "Nuevo"}</span></div><h3 className="text-lg font-extrabold">{service.title}</h3><p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{service.city ?? service.location} · {service.providerName ?? "Proveedor"}</p><p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{service.description}</p><div className="mt-4 flex items-center justify-between"><strong className="text-xl">${formatCLP(service.price)}<span className="text-xs text-muted-foreground">/servicio</span></strong><Button size="sm" variant="hero">Reservar</Button></div></div></article>;
}

export function BookingCard({ booking, onStatus, onCancel }: { booking: Booking; onStatus?: (status: Booking["status"]) => void; onCancel?: () => void }) {
  const status = normalizeBookingStatus(booking.status);
  const canCancel = Boolean(onCancel) && status !== "cancelled" && status !== "completed";
  return <article className="rounded-card border bg-card p-5 shadow-soft"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><StatusBadge status={status} /><h3 className="mt-3 text-lg font-extrabold">{booking.serviceTitle ?? `Servicio ${booking.serviceId.slice(0, 8)}`}</h3><p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><Calendar className="h-4 w-4" />{booking.date ?? new Date(booking.bookingDate).toLocaleString()} · {booking.petName ?? `Mascota ${booking.petId.slice(0, 8)}`}</p></div><div className="flex items-center gap-2"><strong>{booking.total ? `$${booking.total}` : `${booking.durationHours ?? 1}h`}</strong>{canCancel && <Button size="sm" variant="outline" onClick={onCancel}>Cancelar</Button>}{onStatus && status === "pending" && <><Button size="sm" variant="outline" onClick={() => onStatus("CANCELLED")}>Rechazar</Button><Button size="sm" variant="hero" onClick={() => onStatus("CONFIRMED")}>Aceptar</Button></>}</div></div></article>;
}

export function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  return <article className="overflow-hidden rounded-card border bg-card p-5 shadow-soft"><span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">{ANNOUNCEMENT_TYPE_LABELS[announcement.type] ?? announcement.type}</span><h3 className="mt-4 text-lg font-extrabold">{announcement.title}</h3><p className="mt-1 flex items-start gap-1 text-sm text-muted-foreground"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{announcement.location ?? announcement.city ?? "Sin ubicación"}</p><p className="mt-3 text-sm text-muted-foreground">{announcement.description}</p>{announcement.contactPhone ? <p className="mt-2 flex items-center gap-1 text-sm font-bold text-primary"><Phone className="h-4 w-4" />{announcement.contactPhone}</p> : null}<LocationMap bare className="mt-4" address={announcement.location} city={announcement.city} lat={announcement.lat} lng={announcement.lng} /></article>;
}

export function VetCard({ vet }: { vet: Vet }) {
  return <article className="overflow-hidden rounded-card border bg-card p-5 shadow-soft"><div className="flex items-start justify-between"><div className="rounded-full bg-teal-soft p-3 text-info-foreground"><Stethoscope className="h-6 w-6" /></div><div className="flex gap-2">{vet.isPartner ? <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">Partner</span> : null}<span className="rounded-full bg-success/15 px-3 py-1 text-xs font-bold text-success-foreground">{vet.isActive ? "Activa" : "Inactiva"}</span></div></div><h3 className="mt-4 text-lg font-extrabold">{vet.name}</h3><p className="mt-2 flex items-start gap-1 text-sm text-muted-foreground"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{[vet.address, vet.city].filter(Boolean).join(", ") || "Dirección no indicada"}</p>{vet.phone ? <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><Phone className="h-4 w-4" />{vet.phone}</p> : null}{vet.specialties?.length ? <div className="mt-3 flex flex-wrap gap-1.5">{vet.specialties.slice(0, 4).map((s) => <span key={s} className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-bold text-secondary-foreground">{s}</span>)}</div> : null}<LocationMap bare className="mt-4" address={vet.address} city={vet.city} lat={vet.lat} lng={vet.lng} /></article>;
}
