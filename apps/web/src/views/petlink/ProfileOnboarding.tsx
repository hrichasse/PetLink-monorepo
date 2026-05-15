import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { AddressAutocompleteInput } from "@/components/petlink/AddressAutocompleteInput";
import { LocationMap } from "@/components/petlink/LocationMap";
import { authApi } from "@/lib/petlink-api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const onboardingSchema = z.object({
  fullName: z.string().trim().min(2, "Ingresa tu nombre"),
  phone: z.string().trim().max(30, "Máximo 30 caracteres").optional(),
  city: z.string().trim().min(2, "Ingresa tu comuna"),
  location: z.string().trim().min(5, "Ingresa tu dirección")
});

type OnboardingValues = z.infer<typeof onboardingSchema>;

function isProfileComplete(profile: { fullName?: string | null; city?: string | null; location?: string | null } | null | undefined): boolean {
  return Boolean(profile?.fullName?.trim() && profile?.city?.trim() && profile?.location?.trim());
}

export function ProfileOnboardingPage() {
  const navigate = useNavigate();
  const { profile, refreshProfile, user } = useAuth();
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  // Get default name from profile or Google OAuth metadata
  const defaultFullName = profile?.fullName || (user?.user_metadata?.full_name as string | undefined) || "";
  const userEmail = user?.email || "";

  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      fullName: defaultFullName,
      phone: profile?.phone ?? "",
      city: profile?.city ?? "",
      location: profile?.location ?? ""
    }
  });

  useEffect(() => {
    form.reset({
      fullName: defaultFullName,
      phone: profile?.phone ?? "",
      city: profile?.city ?? "",
      location: profile?.location ?? ""
    });
  }, [profile, user, form, defaultFullName]);

  useEffect(() => {
    if (isProfileComplete(profile)) {
      navigate("/dashboard", { replace: true });
    }
  }, [profile, navigate]);

  const currentLocation = form.watch("location");
  const currentCity = form.watch("city");

  const mutation = useMutation({
    mutationFn: async (values: OnboardingValues) => {
      // Ensure profile exists before updating
      try {
        await authApi.getMe();
      } catch {
        // Profile doesn't exist, create it first
        await authApi.provisionUser({
          fullName: values.fullName,
          phone: null,
          city: null,
          location: null
        });
      }
      
      // Now update with complete data
      return authApi.updateMe({
        fullName: values.fullName,
        phone: values.phone?.trim() ? values.phone.trim() : null,
        city: values.city.trim(),
        location: values.location.trim()
      });
    },
    onSuccess: async () => {
      await refreshProfile();
      toast.success("Perfil completado correctamente");
      navigate("/dashboard", { replace: true });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No se pudo completar el perfil");
    }
  });

  return (
    <main className="grid min-h-screen place-items-center bg-background p-4">
      <section className="w-full max-w-2xl rounded-card border bg-card p-6 shadow-warm">
        <h1 className="text-2xl font-black">Completa tu perfil</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Para continuar, necesitamos tus datos básicos. Tu dirección tiene autocompletado con Google Maps.
        </p>

        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
          <label className="block text-sm font-bold">
            Correo
            <input className="input-shell mt-2 cursor-not-allowed bg-muted" type="email" value={userEmail} disabled readOnly />
            <span className="mt-1 block text-xs text-muted-foreground">Tu correo no puede cambiarse</span>
          </label>

          <label className="block text-sm font-bold">
            Nombre completo
            <input className="input-shell mt-2" {...form.register("fullName")} autoComplete="name" />
            {form.formState.errors.fullName ? <span className="mt-1 block text-xs text-destructive">{form.formState.errors.fullName.message}</span> : null}
          </label>

          <label className="block text-sm font-bold">
            Teléfono (opcional)
            <input className="input-shell mt-2" {...form.register("phone")} autoComplete="tel" />
            {form.formState.errors.phone ? <span className="mt-1 block text-xs text-destructive">{form.formState.errors.phone.message}</span> : null}
          </label>

          <label className="block text-sm font-bold">
            Comuna
            <input className="input-shell mt-2" {...form.register("city")} autoComplete="address-level2" />
            {form.formState.errors.city ? <span className="mt-1 block text-xs text-destructive">{form.formState.errors.city.message}</span> : null}
          </label>

          <AddressAutocompleteInput
            label="Dirección"
            value={currentLocation}
            onChange={(value) => form.setValue("location", value, { shouldDirty: true, shouldValidate: true })}
            onSelect={(selection) => {
              if (selection.city) {
                form.setValue("city", selection.city, { shouldDirty: true, shouldValidate: true });
              }
              setLat(selection.lat ?? null);
              setLng(selection.lng ?? null);
            }}
            required
          />

          {form.formState.errors.location ? <span className="-mt-2 block text-xs text-destructive md:col-span-2">{form.formState.errors.location.message}</span> : null}

          <LocationMap className="md:col-span-2" title="Vista previa de ubicación" address={currentLocation} city={currentCity || undefined} lat={lat ?? undefined} lng={lng ?? undefined} />

          <Button className="md:col-span-2" variant="hero" type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Guardando perfil..." : "Guardar y continuar"}
          </Button>
        </form>
      </section>
    </main>
  );
}
