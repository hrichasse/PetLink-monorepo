type LocationMapProps = {
  address?: string | null;
  city?: string | null;
  lat?: number | null;
  lng?: number | null;
  title?: string;
  className?: string;
};

function buildMapSrc({ address, city, lat, lng }: Pick<LocationMapProps, "address" | "city" | "lat" | "lng">) {
  if (typeof lat === "number" && typeof lng === "number") {
    return `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}&z=15&output=embed`;
  }

  const query = [address, city].filter(Boolean).join(", ").trim();
  if (!query) return null;
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;
}

export function LocationMap({ address, city, lat, lng, title = "Ubicación", className = "" }: LocationMapProps) {
  const src = buildMapSrc({ address, city, lat, lng });
  if (!src) return null;

  return (
    <section className={`rounded-card border bg-card p-3 shadow-soft ${className}`.trim()}>
      <p className="mb-2 text-sm font-bold">{title}</p>
      <div className="overflow-hidden rounded-xl border">
        <iframe
          title={title}
          src={src}
          className="h-56 w-full"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </section>
  );
}
