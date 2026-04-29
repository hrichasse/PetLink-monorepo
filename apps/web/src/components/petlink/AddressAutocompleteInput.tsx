import { useEffect, useRef, useState } from "react";

type PlaceSelection = {
  address: string;
  city?: string | null;
  lat?: number | null;
  lng?: number | null;
};

type AddressAutocompleteInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSelect?: (selection: PlaceSelection) => void;
  placeholder?: string;
  required?: boolean;
};

type GoogleWindow = Window & {
  google?: {
    maps?: {
      places?: {
        Autocomplete: new (input: HTMLInputElement, options?: Record<string, unknown>) => {
          addListener: (event: string, handler: () => void) => void;
          getPlace: () => {
            formatted_address?: string;
            address_components?: Array<{ long_name: string; types: string[] }>;
            geometry?: { location?: { lat: () => number; lng: () => number } };
          };
        };
      };
    };
  };
};

const GOOGLE_SCRIPT_ID = "petlink-google-maps-places";

function getCityFromComponents(components?: Array<{ long_name: string; types: string[] }>) {
  if (!components) return null;
  const city =
    components.find((component) => component.types.includes("locality"))?.long_name ??
    components.find((component) => component.types.includes("administrative_area_level_2"))?.long_name ??
    null;
  return city;
}

export function AddressAutocompleteInput({ label, value, onChange, onSelect, placeholder = "Ingresa una dirección", required }: AddressAutocompleteInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!apiKey) return;

    const attachAutocomplete = () => {
      const googleWindow = window as GoogleWindow;
      if (!googleWindow.google?.maps?.places?.Autocomplete || !inputRef.current) return;

      const autocomplete = new googleWindow.google.maps.places.Autocomplete(inputRef.current, {
        fields: ["formatted_address", "address_components", "geometry"],
        componentRestrictions: { country: "cl" }
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        const nextAddress = place.formatted_address ?? inputRef.current?.value ?? "";
        const city = getCityFromComponents(place.address_components);
        const lat = place.geometry?.location?.lat?.();
        const lng = place.geometry?.location?.lng?.();

        onChange(nextAddress);
        onSelect?.({
          address: nextAddress,
          city,
          lat: typeof lat === "number" ? lat : null,
          lng: typeof lng === "number" ? lng : null
        });
      });

      setIsReady(true);
    };

    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      if ((window as GoogleWindow).google?.maps?.places?.Autocomplete) {
        attachAutocomplete();
        return;
      }

      existingScript.addEventListener("load", attachAutocomplete);
      return () => existingScript.removeEventListener("load", attachAutocomplete);
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=es&region=CL`;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", attachAutocomplete);
    document.head.appendChild(script);

    return () => script.removeEventListener("load", attachAutocomplete);
  }, [apiKey, onChange, onSelect]);

  return (
    <label className="block text-sm font-bold">
      {label}
      <input
        ref={inputRef}
        className="input-shell mt-2"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
      />
      {apiKey && !isReady ? <span className="mt-1 block text-xs font-normal text-muted-foreground">Cargando autocompletado de direcciones...</span> : null}
      {!apiKey ? <span className="mt-1 block text-xs font-normal text-muted-foreground">Sin API key de Google Maps: puedes ingresar la dirección manualmente.</span> : null}
    </label>
  );
}
