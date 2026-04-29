import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { Bell, CalendarCheck, Heart, ImagePlus, Plus, Search, Sparkles, Trash2, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddressAutocompleteInput } from "@/components/petlink/AddressAutocompleteInput";
import { AnnouncementCard, BookingCard, PetCard, ServiceCard, VetCard } from "@/components/petlink/Cards";
import { EmptyState } from "@/components/petlink/EmptyState";
import { LocationMap } from "@/components/petlink/LocationMap";
import { SkeletonGrid } from "@/components/petlink/SkeletonGrid";
import { authApi, marketplaceApi, petsApi } from "@/lib/petlink-api";
import { normalizeBookingStatus, type Booking, type BookingStatus, type PetSex } from "@/lib/petlink-data";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const petSchema = z.object({ name: z.string().min(2, "Nombre requerido"), species: z.string().min(2, "Especie requerida"), breed: z.string().min(2, "Raza requerida"), age: z.coerce.number().int().min(0).max(100), weight: z.coerce.number().positive("Peso requerido"), sex: z.enum(["MALE", "FEMALE"]), description: z.string().max(400).optional(), isSterilized: z.boolean().optional(), isVaccinated: z.boolean().optional() });
const profileSchema = z.object({ fullName: z.string().min(2, "Ingresa tu nombre").max(120), phone: z.string().max(30).optional(), city: z.string().max(80).optional(), location: z.string().max(255).optional() });
const serviceSchema = z.object({ type: z.string().min(2, "Tipo requerido"), title: z.string().min(3, "Título requerido").max(160), description: z.string().min(10, "Describe el servicio").max(2000), price: z.coerce.number().positive("Precio requerido"), location: z.string().min(2, "Ubicación requerida"), availabilityNotes: z.string().optional(), isActive: z.boolean().optional() });
const bookingSchema = z.object({ petId: z.string().min(1, "Selecciona una mascota"), bookingDate: z.string().min(1, "Selecciona una fecha"), durationHours: z.coerce.number().int().positive().optional(), notes: z.string().optional() });

type PetValues = z.infer<typeof petSchema>;
type ProfileValues = z.infer<typeof profileSchema>;
type ServiceValues = z.infer<typeof serviceSchema>;
type BookingValues = z.infer<typeof bookingSchema>;
type MatchFormValues = {
  useRegisteredPet: boolean;
  petId: string;
  petName: string;
  petSpecies: string;
  petBreed: string;
  petAge: string;
  petWeight: string;
  petSex: "MALE" | "FEMALE";
  petDescription: string;
  preferredCity: string;
  preferredBreed: string;
  preferredSex: "" | "MALE" | "FEMALE";
  minAge: string;
  maxAge: string;
  preferredLocation: string;
  healthRequirements: string;
};

function useApiError() {
  const { signOut } = useAuth();
  return async (error: unknown) => {
    const status = typeof error === "object" && error && "status" in error ? Number((error as { status: unknown }).status) : 0;
    if (status === 401) {
      toast.error("Tu sesión expiró. Vuelve a ingresar.");
      await signOut();
      return;
    }
    toast.error(error instanceof Error ? error.message : "No se pudo completar la operación");
  };
}

export function DashboardPage() {
  const { role } = useAuth();
  const bookings = useQuery({ queryKey: ["bookings", role], queryFn: () => marketplaceApi.bookings.list(role === "PROVIDER" ? "provider" : "owner") });
  const pets = useQuery({ queryKey: ["pets"], queryFn: petsApi.list, enabled: role === "OWNER" });
  return <Page title={role === "OWNER" ? "Hola, tu familia peluda te espera" : "Panel de proveedor"} action={role === "OWNER" ? <Button asChild variant="hero"><Link to="/services"><Search />Buscar servicio</Link></Button> : <Button asChild variant="hero"><Link to="/my-services/new"><Plus />Nuevo servicio</Link></Button>}><div className="grid gap-4 md:grid-cols-3"><Stat icon={<Heart />} label={role === "OWNER" ? "Mascotas" : "Perfil proveedor"} value={role === "OWNER" ? String(pets.data?.length ?? "—") : "Activo"} /><Stat icon={<CalendarCheck />} label="Reservas" value={String(bookings.data?.length ?? "—")} /><Stat icon={<WalletCards />} label={role === "OWNER" ? "Servicios" : "Estado"} value={role === "OWNER" ? "Real" : "Online"} /></div><section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_.8fr]"><div><h2 className="mb-4 text-2xl font-black">Próximas reservas</h2>{bookings.isLoading ? <SkeletonGrid /> : bookings.data?.length ? <div className="space-y-4">{bookings.data.slice(0, 2).map((booking) => <BookingCard key={booking.id} booking={booking} />)}</div> : <EmptyState title="Sin reservas" description="Cuando tengas reservas activas, aparecerán aquí." />}</div><div><h2 className="mb-4 text-2xl font-black">Recomendaciones</h2><div className="rounded-card border bg-card p-6 shadow-soft"><Sparkles className="h-8 w-8 text-primary" /><h3 className="mt-4 text-xl font-extrabold">Servicios conectados</h3><p className="mt-2 text-muted-foreground">Explora proveedores reales y reserva con tus mascotas registradas.</p><Button asChild className="mt-5" variant="soft"><Link to="/services">Ver servicios</Link></Button></div></div></section></Page>;
}

export function PetsPage() { const { data, isLoading, error } = useQuery({ queryKey: ["pets"], queryFn: petsApi.list }); return <Page title="Mis mascotas" action={<Button asChild variant="hero"><Link to="/pets/new"><Plus />Nueva mascota</Link></Button>}>{isLoading ? <SkeletonGrid /> : error ? <EmptyState title="No se pudieron cargar las mascotas" description={error instanceof Error ? error.message : "Intenta nuevamente."} /> : data?.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{data.map((pet) => <Link key={pet.id} to={`/pets/${pet.id}`}><PetCard pet={pet} /></Link>)}</div> : <EmptyState title="Aún no tienes mascotas" description="Agrega tu primera mascota para reservar servicios personalizados." action="Crear mascota" />}</Page>; }

export function PetFormPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const form = useForm<PetValues>({ resolver: zodResolver(petSchema), defaultValues: { name: "", species: "", breed: "", age: 1, weight: 1, sex: "FEMALE", description: "", isSterilized: false, isVaccinated: true } });
  const [file, setFile] = useState<File | null>(null);
  const mutation = useMutation({ mutationFn: (values: PetValues) => petsApi.create({ name: values.name, species: values.species, breed: values.breed, age: values.age, weight: values.weight, sex: values.sex as PetSex, description: values.description || null, isSterilized: values.isSterilized, isVaccinated: values.isVaccinated }), onSuccess: async (pet) => { let imageUploadFailed = false; if (file) { try { await petsApi.uploadImage(pet.id, file); } catch { imageUploadFailed = true; } } await queryClient.invalidateQueries({ queryKey: ["pets"] }); if (imageUploadFailed) { toast.success("Mascota guardada. La foto no se pudo subir; puedes intentarlo de nuevo más tarde."); } else { toast.success("Mascota guardada correctamente"); } navigate(`/pets/${pet.id}`); }, onError: (error) => { toast.error(error instanceof Error ? error.message : "No se pudo guardar la mascota"); } });
  return <Page title="Nueva mascota"><form className="grid gap-5 rounded-card border bg-card p-6 shadow-soft md:grid-cols-2" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}><Input label="Nombre" error={form.formState.errors.name?.message} props={form.register("name")} /><Input label="Especie" error={form.formState.errors.species?.message} props={form.register("species")} /><Input label="Raza" error={form.formState.errors.breed?.message} props={form.register("breed")} /><Input label="Edad" type="number" error={form.formState.errors.age?.message} props={form.register("age")} /><Input label="Peso" type="number" error={form.formState.errors.weight?.message} props={form.register("weight")} /><label className="block text-sm font-bold">Sexo<select className="input-shell mt-2" {...form.register("sex")}><option value="FEMALE">Hembra</option><option value="MALE">Macho</option></select></label><label className="md:col-span-2 block text-sm font-bold">Imagen de mascota<div className="mt-2 flex items-center gap-3 rounded-card border border-dashed p-4"><ImagePlus className="text-primary" /><input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(e) => setFile(e.target.files?.[0] ?? null)} aria-label="Subir imagen de mascota" /></div><span className="mt-2 block text-xs font-normal text-muted-foreground">En celular podrás tomar la foto con la cámara o elegirla desde tu galería.</span></label><label className="md:col-span-2 block text-sm font-bold">Descripción<textarea className="input-shell mt-2 min-h-28" {...form.register("description")} /></label><label className="font-bold"><input type="checkbox" className="mr-2" {...form.register("isSterilized")} />Esterilizada</label><label className="font-bold"><input type="checkbox" className="mr-2" {...form.register("isVaccinated")} />Vacunas al día</label><Button className="md:col-span-2" variant="hero" type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Guardando…" : "Guardar mascota"}</Button></form></Page>;
}

export function PetDetailPage() { const { id } = useParams(); const navigate = useNavigate(); const queryClient = useQueryClient(); const handleError = useApiError(); const { data: pet, isLoading, error } = useQuery({ queryKey: ["pets", id], queryFn: () => petsApi.get(id ?? ""), enabled: Boolean(id) }); const deleteMutation = useMutation({ mutationFn: (petId: string) => petsApi.remove(petId), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["pets"] }); toast.success("Mascota eliminada correctamente"); navigate("/pets"); }, onError: handleError }); return <Page title={pet?.name ?? "Mascota"} action={<div className="flex gap-3"><Button asChild variant="outline"><Link to="/pets">Volver</Link></Button><Button variant="outline" disabled={deleteMutation.isPending || !id} onClick={() => { if (!id) return; if (!window.confirm("¿Seguro que quieres eliminar esta mascota?")) return; deleteMutation.mutate(id); }}><Trash2 className="h-4 w-4" />{deleteMutation.isPending ? "Eliminando..." : "Eliminar"}</Button></div>}>{isLoading ? <SkeletonGrid /> : error || !pet ? <EmptyState title="Mascota no encontrada" description={error instanceof Error ? error.message : "No pudimos cargar el detalle."} /> : <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]"><PetCard pet={pet} /><section className="rounded-card border bg-card p-6 shadow-soft"><h2 className="text-2xl font-black">Detalle</h2><div className="mt-5 grid gap-3 text-sm"><p><strong>Peso:</strong> {pet.weight} kg</p><p><strong>Sexo:</strong> {pet.sex === "FEMALE" ? "Hembra" : "Macho"}</p><p><strong>Esterilizada:</strong> {pet.isSterilized ? "Sí" : "No"}</p><p><strong>Vacunas:</strong> {pet.isVaccinated ? "Al día" : "Pendientes"}</p></div></section></div>}</Page>; }

export function ServicesPage() { const [location, setLocation] = useState(""); const [type, setType] = useState(""); const { data = [], isLoading, error } = useQuery({ queryKey: ["services", type, location], queryFn: () => marketplaceApi.services.list({ type, location, isActive: true }) }); return <Page title="Explorar servicios" action={<Button variant="soft"><Search />Filtros</Button>}><div className="mb-5 grid gap-3 md:grid-cols-4"><input className="input-shell md:col-span-2" placeholder="Ciudad" value={location} onChange={(e) => setLocation(e.target.value)} aria-label="Buscar servicios por ciudad" /><input className="input-shell" placeholder="Tipo" value={type} onChange={(e) => setType(e.target.value)} aria-label="Categoría" /><select className="input-shell" aria-label="Orden"><option>Disponibles</option></select></div>{isLoading ? <SkeletonGrid /> : error ? <EmptyState title="No se pudieron cargar los servicios" description={error instanceof Error ? error.message : "Intenta nuevamente."} /> : data.length ? <div className="grid gap-5 md:grid-cols-3">{data.map((service) => <Link key={service.id} to={`/services/${service.id}`}><ServiceCard service={service} /></Link>)}</div> : <EmptyState title="Sin servicios" description="No hay servicios disponibles con esos filtros." />}</Page>; }

export function MatchPage() {
  const queryClient = useQueryClient();
  const handleError = useApiError();
  const [submittedPetId, setSubmittedPetId] = useState<string>("");
  const [matchPhotoFiles, setMatchPhotoFiles] = useState<File[]>([]);
  const [matchPhotoPreviewUrls, setMatchPhotoPreviewUrls] = useState<string[]>([]);
  const [preferredLat, setPreferredLat] = useState<number | null>(null);
  const [preferredLng, setPreferredLng] = useState<number | null>(null);
  const [createdProfile, setCreatedProfile] = useState<{
    name: string;
    species: string;
    breed: string;
    age: number;
    sex: "MALE" | "FEMALE";
    imageUrl: string | null;
    location: string | null;
    city: string | null;
    lat: number | null;
    lng: number | null;
  } | null>(null);

  const form = useForm<MatchFormValues>({
    defaultValues: {
      useRegisteredPet: true,
      petId: "",
      petName: "",
      petSpecies: "",
      petBreed: "",
      petAge: "",
      petWeight: "",
      petSex: "FEMALE",
      petDescription: "",
      preferredCity: "",
      preferredBreed: "",
      preferredSex: "",
      minAge: "",
      maxAge: "",
      preferredLocation: "",
      healthRequirements: ""
    }
  });

  const pets = useQuery({ queryKey: ["pets"], queryFn: petsApi.list });
  const useRegisteredPet = form.watch("useRegisteredPet");
  const preferredLocation = form.watch("preferredLocation");
  const preferredCity = form.watch("preferredCity");
  const hasRegisteredPets = (pets.data?.length ?? 0) > 0;

  const matches = useQuery({
    queryKey: ["match", submittedPetId],
    queryFn: () => petsApi.match.findCompatible({ petId: submittedPetId, limit: 20 }),
    enabled: Boolean(submittedPetId)
  });
  const matchResults = matches.data ?? [];
  const averageScore = matchResults.length ? Math.round(matchResults.reduce((acc, item) => acc + item.compatibilityScore, 0) / matchResults.length) : 0;
  const topMatch = matchResults[0] ?? null;
  const secondaryMatches = topMatch ? matchResults.slice(1) : [];

  const savePreferences = useMutation({
    mutationFn: async (values: MatchFormValues) => {
      const shouldUseRegisteredPet = values.useRegisteredPet && hasRegisteredPets;
      let selectedPetId = values.petId;
      let selectedPetSummary = {
        name: "",
        species: "",
        breed: "",
        age: 0,
        sex: "FEMALE" as "MALE" | "FEMALE",
        imageUrl: null as string | null
      };

      if (shouldUseRegisteredPet) {
        if (!values.petId) throw new Error("Selecciona una mascota.");
        const sourcePet = pets.data?.find((pet) => pet.id === values.petId);
        if (!sourcePet) throw new Error("La mascota seleccionada no existe.");
        selectedPetSummary = {
          name: sourcePet.name,
          species: sourcePet.species,
          breed: sourcePet.breed,
          age: sourcePet.age,
          sex: sourcePet.sex,
          imageUrl: sourcePet.imageUrl ?? sourcePet.image_url ?? null
        };
      } else {
        const age = Number(values.petAge);
        const weight = Number(values.petWeight);

        if (!values.petName.trim()) throw new Error("Ingresa el nombre de la mascota para match.");
        if (!values.petSpecies.trim()) throw new Error("Ingresa la especie de la mascota para match.");
        if (!values.petBreed.trim()) throw new Error("Ingresa la raza de la mascota para match.");
        if (Number.isNaN(age) || age < 0 || age > 100) throw new Error("Edad de mascota inválida.");
        if (Number.isNaN(weight) || weight <= 0) throw new Error("Peso de mascota inválido.");

        const createdPet = await petsApi.create({
          name: values.petName.trim(),
          species: values.petSpecies.trim(),
          breed: values.petBreed.trim(),
          age,
          weight,
          sex: values.petSex,
          description: values.petDescription.trim() || null,
          isSterilized: false,
          isVaccinated: true
        });

        selectedPetId = createdPet.id;
        selectedPetSummary = {
          name: createdPet.name,
          species: createdPet.species,
          breed: createdPet.breed,
          age: createdPet.age,
          sex: createdPet.sex,
          imageUrl: createdPet.imageUrl ?? createdPet.image_url ?? null
        };

        if (matchPhotoFiles.length > 0) {
          try {
            const uploaded = await petsApi.uploadImage(createdPet.id, matchPhotoFiles[0]);
            selectedPetSummary.imageUrl = uploaded.url;
            if (matchPhotoFiles.length > 1) {
              toast.success("Se subió la foto principal. Las fotos extra quedan como vista previa por ahora.");
            }
          } catch {
            toast.error("La mascota se creó, pero la foto no se pudo subir.");
          }
        }

        await queryClient.invalidateQueries({ queryKey: ["pets"] });
      }

      const minAge = values.minAge.trim() ? Number(values.minAge) : null;
      const maxAge = values.maxAge.trim() ? Number(values.maxAge) : null;

      if (minAge !== null && (Number.isNaN(minAge) || minAge < 0 || minAge > 100)) {
        throw new Error("Edad mínima inválida.");
      }

      if (maxAge !== null && (Number.isNaN(maxAge) || maxAge < 0 || maxAge > 100)) {
        throw new Error("Edad máxima inválida.");
      }

      if (minAge !== null && maxAge !== null && maxAge < minAge) {
        throw new Error("La edad máxima no puede ser menor que la mínima.");
      }

      await petsApi.match.savePreferences({
        petId: selectedPetId,
        preferredBreed: values.preferredBreed.trim() || null,
        preferredSex: values.preferredSex || null,
        minAge,
        maxAge,
        preferredLocation: values.preferredLocation.trim() || null,
        healthRequirements: values.healthRequirements.trim() || null
      });

      return {
        petId: selectedPetId,
        summary: selectedPetSummary,
        location: values.preferredLocation.trim() || null,
        city: values.preferredCity.trim() || null,
        lat: preferredLat,
        lng: preferredLng
      };
    },
    onError: handleError,
    onSuccess: (result) => {
      setSubmittedPetId(result.petId);
      setCreatedProfile({
        ...result.summary,
        location: result.location,
        city: result.city,
        lat: result.lat,
        lng: result.lng
      });
      toast.success("Preferencias guardadas. Buscando mascotas compatibles...");
    }
  });

  return (
    <Page title="Match de mascotas">
      <section className="rounded-card border bg-card p-6 shadow-soft">
        <div className="rounded-card border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4">
          <h2 className="text-xl font-black">Preferencias de compatibilidad</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Crea un perfil rápido o usa una mascota registrada para encontrar matches recomendados.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-full bg-secondary px-3 py-1 text-secondary-foreground">Mascota base: {submittedPetId ? "Definida" : "Pendiente"}</span>
            <span className="rounded-full bg-primary-soft px-3 py-1 text-primary">Resultados: {matchResults.length}</span>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">Compatibilidad media: {averageScore}%</span>
          </div>
        </div>

        <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit((values) => savePreferences.mutate(values))}>
          <div className="md:col-span-2 rounded-card border p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Modo de búsqueda</p>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              <button
                type="button"
                onClick={() => form.setValue("useRegisteredPet", true)}
                disabled={!hasRegisteredPets}
                className={`rounded-card border px-4 py-3 text-left text-sm font-bold transition-colors ${useRegisteredPet && hasRegisteredPets ? "border-primary bg-primary-soft text-primary" : "hover:bg-accent"}`}
              >
                Usar mascota registrada
                <span className="mt-1 block text-xs font-normal text-muted-foreground">Ideal si ya tienes su ficha creada.</span>
              </button>
              <button
                type="button"
                onClick={() => form.setValue("useRegisteredPet", false)}
                className={`rounded-card border px-4 py-3 text-left text-sm font-bold transition-colors ${!useRegisteredPet || !hasRegisteredPets ? "border-primary bg-primary-soft text-primary" : "hover:bg-accent"}`}
              >
                Perfil rápido de match
                <span className="mt-1 block text-xs font-normal text-muted-foreground">Para usuarios sin mascota registrada.</span>
              </button>
            </div>
            {!hasRegisteredPets ? <p className="mt-2 text-xs text-muted-foreground">No hay mascotas registradas todavía, usarás perfil rápido automáticamente.</p> : null}
          </div>

          {useRegisteredPet && hasRegisteredPets ? (
            <label className="md:col-span-2 block text-sm font-bold">
              Mascota
              <select className="input-shell mt-2" {...form.register("petId")}>
                <option value="">Selecciona una mascota</option>
                {pets.data?.map((pet) => <option key={pet.id} value={pet.id}>{pet.name} ({pet.species})</option>)}
              </select>
            </label>
          ) : (
            <>
              <Input label="Nombre mascota" props={form.register("petName")} />
              <Input label="Especie" props={form.register("petSpecies")} />
              <Input label="Raza" props={form.register("petBreed")} />
              <label className="block text-sm font-bold">Sexo<select className="input-shell mt-2" {...form.register("petSex")}><option value="FEMALE">Hembra</option><option value="MALE">Macho</option></select></label>
              <Input label="Edad" type="number" props={form.register("petAge")} />
              <Input label="Peso (kg)" type="number" props={form.register("petWeight")} />

              <label className="md:col-span-2 block text-sm font-bold">
                Descripción
                <textarea className="input-shell mt-2 min-h-20" {...form.register("petDescription")} />
              </label>

              <label className="md:col-span-2 block text-sm font-bold">
                Foto de mascota match
                <div className="mt-2 rounded-card border border-dashed p-4">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <ImagePlus className="text-primary" />
                    <span>Sube una foto para que el perfil de match se vea más completo.</span>
                  </div>
                  <input
                    className="mt-3 block w-full text-sm"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={(event) => {
                      const files = Array.from(event.target.files ?? []);
                      setMatchPhotoFiles(files);
                      setMatchPhotoPreviewUrls(files.map((file) => URL.createObjectURL(file)));
                    }}
                  />
                </div>
              </label>

              {matchPhotoPreviewUrls.length ? (
                <div className="md:col-span-2">
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {matchPhotoPreviewUrls.map((url, index) => (
                      <img key={`${url}-${index}`} src={url} alt={`Vista previa ${index + 1}`} className="h-24 w-24 flex-none rounded-2xl border object-cover" />
                    ))}
                  </div>
                  <img src={matchPhotoPreviewUrls[0]} alt="Foto principal mascota match" className="mt-3 h-48 w-full rounded-card border object-cover" />
                </div>
              ) : null}
            </>
          )}

          <div className="md:col-span-2 mt-2 border-t pt-4">
            <h3 className="text-lg font-black">Preferencias del match</h3>
          </div>

          <Input label="Raza preferida" props={form.register("preferredBreed")} />
          <label className="block text-sm font-bold">Sexo preferido<select className="input-shell mt-2" {...form.register("preferredSex")}><option value="">Cualquiera</option><option value="FEMALE">Hembra</option><option value="MALE">Macho</option></select></label>

          <AddressAutocompleteInput
            label="Ubicación preferida"
            value={preferredLocation}
            onChange={(value) => form.setValue("preferredLocation", value, { shouldDirty: true, shouldValidate: true })}
            onSelect={(selection) => {
              form.setValue("preferredLocation", selection.address, { shouldDirty: true, shouldValidate: true });
              form.setValue("preferredCity", selection.city ?? "", { shouldDirty: true });
              setPreferredLat(selection.lat ?? null);
              setPreferredLng(selection.lng ?? null);
            }}
          />
          <Input label="Ciudad / Comuna" props={form.register("preferredCity")} />

          <Input label="Edad mínima" type="number" props={form.register("minAge")} />
          <Input label="Edad máxima" type="number" props={form.register("maxAge")} />

          <label className="md:col-span-2 block text-sm font-bold">
            Requisitos de salud
            <textarea className="input-shell mt-2 min-h-24" {...form.register("healthRequirements")} placeholder="Ejemplo: vacunas al día, esterilizada, sin condiciones crónicas" />
          </label>

          <LocationMap className="md:col-span-2" title="Ubicación preferida" address={preferredLocation || undefined} city={preferredCity || undefined} lat={preferredLat ?? undefined} lng={preferredLng ?? undefined} />

          <Button className="md:col-span-2" variant="hero" disabled={savePreferences.isPending || pets.isLoading}>
            {savePreferences.isPending ? "Guardando y buscando..." : "Guardar preferencias y buscar"}
          </Button>
        </form>
      </section>

      {createdProfile ? (
        <section className="mt-6 rounded-card border bg-card p-6 shadow-soft">
          <h2 className="text-xl font-black">Perfil match creado</h2>
          <div className="mt-4 grid gap-5 md:grid-cols-[1fr_1.2fr]">
            {createdProfile.imageUrl ? <img src={createdProfile.imageUrl} alt="Foto perfil match" className="h-64 w-full rounded-card border object-cover" /> : <div className="grid h-64 place-items-center rounded-card border text-sm text-muted-foreground">Sin foto</div>}
            <div className="rounded-card border bg-background p-4">
              <p className="text-sm"><strong>Nombre:</strong> {createdProfile.name}</p>
              <p className="mt-1 text-sm"><strong>Especie:</strong> {createdProfile.species}</p>
              <p className="mt-1 text-sm"><strong>Raza:</strong> {createdProfile.breed}</p>
              <p className="mt-1 text-sm"><strong>Edad:</strong> {createdProfile.age} años</p>
              <p className="mt-1 text-sm"><strong>Sexo:</strong> {createdProfile.sex === "FEMALE" ? "Hembra" : "Macho"}</p>
              <p className="mt-1 text-sm"><strong>Ubicación:</strong> {createdProfile.location ?? "No definida"}</p>
              <div className="mt-4 flex gap-2">
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">{createdProfile.species}</span>
                <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">{createdProfile.breed}</span>
              </div>
            </div>
          </div>
          {createdProfile.location ? <LocationMap className="mt-4" title="Mapa del perfil match" address={createdProfile.location || undefined} city={createdProfile.city || undefined} lat={createdProfile.lat ?? undefined} lng={createdProfile.lng ?? undefined} /> : null}
        </section>
      ) : null}

      <section className="mt-6">
        <h2 className="mb-4 text-2xl font-black">Resultados compatibles</h2>

        {topMatch ? (
          <article className="mb-5 rounded-card border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 shadow-soft">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Top Match</p>
            <div className="mt-2 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black">{topMatch.pet.name}</h3>
                <p className="text-sm text-muted-foreground">{topMatch.pet.species} · {topMatch.pet.breed} · {topMatch.pet.age} años</p>
              </div>
              <span className="rounded-full bg-primary px-4 py-2 text-sm font-black text-primary-foreground">{topMatch.compatibilityScore}%</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-background">
              <div className="h-2 rounded-full bg-primary transition-all duration-700" style={{ width: `${Math.max(10, Math.min(100, topMatch.compatibilityScore))}%` }} />
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <p className="grow text-sm text-muted-foreground">
                {topMatch.reasons[0] ?? "Alta compatibilidad detectada."}
              </p>
              <button
                type="button"
                onClick={() => toast.success(`Interés en ${topMatch.pet.name} registrado. Pronto podrás contactar al dueño.`)}
                className="shrink-0 rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Contactar dueño
              </button>
            </div>
          </article>
        ) : null}

        {matches.isLoading ? (
          <SkeletonGrid />
        ) : matches.error ? (
          <EmptyState title="No se pudieron cargar los matches" description={matches.error instanceof Error ? matches.error.message : "Intenta nuevamente."} />
        ) : !submittedPetId ? (
          <EmptyState title="Aún no has buscado" description="Guarda las preferencias para ver mascotas compatibles." />
        ) : matchResults.length ? (
          secondaryMatches.length ? (
            <div className="grid gap-5 md:grid-cols-2">
              {secondaryMatches.map((item) => (
                <article key={item.pet.id} className="rounded-card border bg-card p-5 shadow-soft">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-lg font-extrabold">{item.pet.name}</h3>
                    <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">{item.compatibilityScore}%</span>
                  </div>

                  <div className="mt-3 h-2 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.max(8, Math.min(100, item.compatibilityScore))}%` }} />
                  </div>

                  <p className="mt-3 text-sm text-muted-foreground">{item.pet.species} · {item.pet.breed} · {item.pet.age} años · {item.pet.sex === "FEMALE" ? "Hembra" : "Macho"}</p>

                  <div className="mt-4 rounded-card border bg-background p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Motivos de compatibilidad</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                      {item.reasons.map((reason, index) => (
                        <li key={`${item.pet.id}-${index}`}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-card border bg-card p-4 text-sm text-muted-foreground">Solo hay un resultado y ya está resaltado como Top Match.</div>
          )
        ) : (
          <EmptyState title="Sin resultados" description="No encontramos matches con estos criterios. Prueba ampliar las preferencias." />
        )}
      </section>
    </Page>
  );
}

export function ServiceDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const handleError = useApiError();
  const { data: service, isLoading, error } = useQuery({ queryKey: ["services", id], queryFn: () => marketplaceApi.services.get(id ?? ""), enabled: Boolean(id) });
  const pets = useQuery({ queryKey: ["pets"], queryFn: petsApi.list });
  const form = useForm<BookingValues>({ resolver: zodResolver(bookingSchema), defaultValues: { petId: "", bookingDate: "", durationHours: 1, notes: "" } });
  const mutation = useMutation({ mutationFn: (values: BookingValues) => marketplaceApi.bookings.create({ petId: values.petId, serviceId: id ?? "", bookingDate: new Date(values.bookingDate).toISOString(), durationHours: values.durationHours, notes: values.notes || null }), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["bookings"] }); toast.success("Reserva creada correctamente"); }, onError: handleError });
  return <Page title={service?.title ?? "Servicio"} action={<Button asChild variant="outline"><Link to="/services">Volver</Link></Button>}>{isLoading ? <SkeletonGrid /> : error || !service ? <EmptyState title="Servicio no encontrado" description={error instanceof Error ? error.message : "No pudimos cargar el servicio."} /> : <div className="grid gap-6 lg:grid-cols-[1fr_360px]"><div className="space-y-4"><ServiceCard service={service} /><LocationMap title="Ubicación del servicio" address={service.location} city={service.city ?? null} /></div><aside className="rounded-card border bg-card p-6 shadow-soft"><h2 className="text-2xl font-black">Reserva rápida</h2><form onSubmit={form.handleSubmit((values) => mutation.mutate(values))}><label className="mt-4 block text-sm font-bold">Fecha<input type="datetime-local" className="input-shell mt-2" {...form.register("bookingDate")} /></label><label className="mt-4 block text-sm font-bold">Mascota<select className="input-shell mt-2" {...form.register("petId")}><option value="">Selecciona</option>{pets.data?.map((pet) => <option key={pet.id} value={pet.id}>{pet.name}</option>)}</select></label><Input label="Horas" type="number" error={form.formState.errors.durationHours?.message} props={form.register("durationHours")} /><Button className="mt-5 w-full" variant="hero" disabled={mutation.isPending}>{mutation.isPending ? "Reservando…" : "Confirmar reserva"}</Button></form></aside></div>}</Page>;
}

export function BookingsPage({ provider = false }: { provider?: boolean }) { const queryClient = useQueryClient(); const handleError = useApiError(); const { data = [], isLoading, error } = useQuery({ queryKey: ["bookings", provider ? "provider" : "owner"], queryFn: () => marketplaceApi.bookings.list(provider ? "provider" : "owner") }); const mutation = useMutation({ mutationFn: ({ id, status }: { id: string; status: BookingStatus | Booking["status"] }) => marketplaceApi.bookings.updateStatus(id, { status: String(status).toUpperCase() as Uppercase<BookingStatus> }), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["bookings"] }); toast.success("Estado actualizado"); }, onError: handleError }); const cancelMutation = useMutation({ mutationFn: (id: string) => marketplaceApi.bookings.cancel(id), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["bookings"] }); toast.success("Reserva cancelada correctamente"); }, onError: handleError }); return <Page title={provider ? "Reservas entrantes" : "Mis reservas"}>{isLoading ? <SkeletonGrid /> : error ? <EmptyState title="No se pudieron cargar las reservas" description={error instanceof Error ? error.message : "Intenta nuevamente."} /> : data.length ? <div className="space-y-4">{data.map((booking) => <div key={booking.id} className="space-y-3"><BookingCard booking={booking} onStatus={provider && normalizeBookingStatus(booking.status) === "pending" ? (status) => mutation.mutate({ id: booking.id, status }) : undefined} onCancel={!provider && normalizeBookingStatus(booking.status) !== "cancelled" && normalizeBookingStatus(booking.status) !== "completed" ? () => { if (!window.confirm("¿Seguro que quieres cancelar esta reserva?")) return; cancelMutation.mutate(booking.id); } : undefined} />{booking.serviceLocation ? <LocationMap title="Ubicación de la reserva" address={booking.serviceLocation} /> : null}</div>)}</div> : <EmptyState title="Sin reservas" description="Cuando reserves un servicio, aparecerá aquí." />}</Page>; }

export function AnnouncementsPage() { const queryClient = useQueryClient(); const [showForm, setShowForm] = useState(false); const [type, setType] = useState("LOST_PET"); const [title, setTitle] = useState(""); const [description, setDescription] = useState(""); const [city, setCity] = useState(""); const [location, setLocation] = useState(""); const [lat, setLat] = useState<number | null>(null); const [lng, setLng] = useState<number | null>(null); const { data = [], isLoading, error } = useQuery({ queryKey: ["announcements"], queryFn: () => marketplaceApi.announcements.list({ isActive: true }) }); const createMutation = useMutation({ mutationFn: () => marketplaceApi.announcements.create({ type, title: title.trim(), description: description.trim(), city: city.trim() || undefined, location: location.trim() || undefined, lat: lat ?? undefined, lng: lng ?? undefined }), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["announcements"] }); toast.success("Anuncio publicado correctamente"); setShowForm(false); setType("LOST_PET"); setTitle(""); setDescription(""); setCity(""); setLocation(""); setLat(null); setLng(null); }, onError: (createError) => { toast.error(createError instanceof Error ? createError.message : "No se pudo publicar el anuncio"); } }); return <Page title="Anuncios" action={<Button variant="hero" onClick={() => setShowForm((prev) => !prev)}><Plus />{showForm ? "Cerrar" : "Publicar"}</Button>}>{showForm && <section className="mb-5 rounded-card border bg-card p-5 shadow-soft"><h2 className="text-xl font-extrabold">Nuevo anuncio</h2><div className="mt-4 grid gap-3 md:grid-cols-2"><label className="block text-sm font-bold">Tipo<select className="input-shell mt-2" value={type} onChange={(event) => setType(event.target.value)}><option value="LOST_PET">Mascota perdida</option><option value="FOUND_PET">Mascota encontrada</option><option value="ADOPTION">Adopción</option><option value="ADVERTISING">Publicidad</option><option value="GENERAL">General</option></select></label><label className="block text-sm font-bold">Título<input className="input-shell mt-2" name="announcement-title" value={title} onChange={(event) => setTitle(event.target.value)} />{title.trim().length > 0 && title.trim().length < 3 ? <span className="mt-1 block text-xs text-destructive">Mínimo 3 caracteres</span> : null}</label></div><label className="mt-3 block text-sm font-bold">Descripción<textarea className="input-shell mt-2 min-h-28" value={description} onChange={(event) => setDescription(event.target.value)} /></label><div className="mt-3 grid gap-3 md:grid-cols-2"><label className="block text-sm font-bold">Ciudad<input className="input-shell mt-2" value={city} onChange={(event) => setCity(event.target.value)} /></label><AddressAutocompleteInput label="Ubicación" value={location} onChange={setLocation} onSelect={(selection) => { if (selection.city) setCity(selection.city); setLat(selection.lat ?? null); setLng(selection.lng ?? null); }} /></div><LocationMap className="mt-4" title="Vista previa de ubicación" address={location || undefined} city={city || undefined} lat={lat ?? undefined} lng={lng ?? undefined} /><div className="mt-4 flex justify-end"><Button disabled={createMutation.isPending || title.trim().length < 3 || description.trim().length < 10} onClick={() => createMutation.mutate()}>{createMutation.isPending ? "Publicando..." : "Publicar anuncio"}</Button></div></section>}{isLoading ? <SkeletonGrid /> : error ? <EmptyState title="No se pudieron cargar los anuncios" description={error instanceof Error ? error.message : "Intenta nuevamente."} /> : data.length ? <div className="grid gap-5 md:grid-cols-2">{data.map((item) => <div key={item.id} className="space-y-3"><AnnouncementCard announcement={item} /><LocationMap title="Ubicación del anuncio" address={item.location ?? undefined} city={item.city ?? undefined} lat={item.lat ?? undefined} lng={item.lng ?? undefined} /></div>)}</div> : <EmptyState title="Sin anuncios" description="No hay anuncios activos por ahora." />}</Page>; }
export function VetsPage() {
  const queryClient = useQueryClient();
  const handleError = useApiError();
  const [cityFilter, setCityFilter] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("");
  const [showForm, setShowForm] = useState(false);

  const SPECIALTY_LABELS: Record<string, string> = {
    GENERAL: "General", SURGERY: "Cirugía", DERMATOLOGY: "Dermatología",
    CARDIOLOGY: "Cardiología", OPHTHALMOLOGY: "Oftalmología", NEUROLOGY: "Neurología",
    ONCOLOGY: "Oncología", DENTISTRY: "Odontología", NUTRITION: "Nutrición",
    EXOTIC_PETS: "Animales exóticos", EMERGENCY: "Urgencias", OTHER: "Otros",
  };
  const specialtyOptions = Object.entries(SPECIALTY_LABELS);

  const vetFormSchema = z.object({
    name: z.string().min(2, "Nombre requerido").max(200),
    address: z.string().min(3, "Dirección requerida"),
    city: z.string().min(2, "Ciudad requerida").max(100),
    phone: z.string().max(30).optional(),
    description: z.string().max(2000).optional(),
    specialties: z.array(z.string()),
  });
  type VetCreateValues = z.infer<typeof vetFormSchema>;

  const form = useForm<VetCreateValues>({
    resolver: zodResolver(vetFormSchema),
    defaultValues: { name: "", address: "", city: "", phone: "", description: "", specialties: [] },
  });
  const currentAddress = form.watch("address");
  const selectedSpecialties = form.watch("specialties");

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["vets", cityFilter, specialtyFilter],
    queryFn: () => marketplaceApi.vets.list({
      isActive: true,
      ...(cityFilter ? { city: cityFilter } : {}),
      ...(specialtyFilter ? { specialty: specialtyFilter } : {}),
    }),
  });

  const createMutation = useMutation({
    mutationFn: (values: VetCreateValues) =>
      marketplaceApi.vets.create({
        name: values.name,
        address: values.address,
        city: values.city,
        phone: values.phone || null,
        description: values.description || null,
        ...(values.specialties.length > 0 ? { specialties: values.specialties } : {}),
        isActive: true,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["vets"] });
      toast.success("Veterinaria agregada correctamente");
      setShowForm(false);
      form.reset();
    },
    onError: handleError,
  });

  return (
    <Page
      title="Veterinarias"
      action={
        <Button variant="hero" onClick={() => setShowForm((s) => !s)}>
          <Plus />{showForm ? "Cancelar" : "Nueva veterinaria"}
        </Button>
      }
    >
      {showForm && (
        <section className="mb-6 rounded-card border bg-card p-6 shadow-soft">
          <h2 className="mb-4 text-lg font-black">Agregar veterinaria</h2>
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}
          >
            <Input label="Nombre de la clínica" error={form.formState.errors.name?.message} props={form.register("name")} />
            <Input label="Teléfono" error={form.formState.errors.phone?.message} props={form.register("phone")} />
            <AddressAutocompleteInput
              label="Dirección"
              value={currentAddress}
              onChange={(val) => form.setValue("address", val, { shouldDirty: true, shouldValidate: true })}
            />
            <Input label="Ciudad / Comuna" error={form.formState.errors.city?.message} props={form.register("city")} />
            <label className="md:col-span-2 block text-sm font-bold">
              Descripción
              <textarea className="input-shell mt-2 min-h-24" {...form.register("description")} />
            </label>
            <div className="md:col-span-2">
              <p className="mb-2 text-sm font-bold">Especialidades</p>
              <div className="flex flex-wrap gap-2">
                {specialtyOptions.map(([key, label]) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition-colors hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:checked]:text-primary"
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      value={key}
                      checked={selectedSpecialties.includes(key)}
                      onChange={(e) => {
                        const cur = form.getValues("specialties");
                        form.setValue("specialties", e.target.checked ? [...cur, key] : cur.filter((s) => s !== key));
                      }}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <LocationMap className="md:col-span-2" title="Vista previa de ubicación" address={currentAddress} city={form.watch("city") || undefined} />
            <Button className="md:col-span-2" variant="hero" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Guardando…" : "Guardar veterinaria"}
            </Button>
          </form>
        </section>
      )}

      <div className="mb-5 flex flex-wrap gap-3">
        <input
          className="input-shell w-44"
          placeholder="Filtrar por ciudad"
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          aria-label="Filtrar veterinarias por ciudad"
        />
        <select
          className="input-shell w-56"
          value={specialtyFilter}
          onChange={(e) => setSpecialtyFilter(e.target.value)}
          aria-label="Filtrar por especialidad"
        >
          <option value="">Todas las especialidades</option>
          {specialtyOptions.map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        {(cityFilter || specialtyFilter) && (
          <button
            className="text-xs font-bold text-muted-foreground underline"
            onClick={() => { setCityFilter(""); setSpecialtyFilter(""); }}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {isLoading ? (
        <SkeletonGrid />
      ) : error ? (
        <EmptyState title="No se pudieron cargar las veterinarias" description={error instanceof Error ? error.message : "Intenta nuevamente."} />
      ) : data.length ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {data.map((vet) => (
            <div key={vet.id} className="space-y-3">
              <VetCard vet={vet} />
              {(vet.address || vet.city) && (
                <LocationMap title="Cómo llegar" address={vet.address} city={vet.city} lat={vet.lat ?? undefined} lng={vet.lng ?? undefined} />
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Sin veterinarias"
          description={cityFilter || specialtyFilter ? "No hay veterinarias con esos filtros." : "No hay veterinarias registradas. ¡Agrega la primera!"}
        />
      )}
    </Page>
  );
}

export function ProviderServicesPage() { const { profile } = useAuth(); const { data = [], isLoading, error } = useQuery({ queryKey: ["provider-services", profile?.userId], queryFn: () => marketplaceApi.services.list({ providerId: profile?.userId }), enabled: Boolean(profile?.userId) }); return <Page title="Mis servicios" action={<Button asChild variant="hero"><Link to="/my-services/new"><Plus />Nuevo</Link></Button>}>{isLoading ? <SkeletonGrid /> : error ? <EmptyState title="No se pudieron cargar tus servicios" description={error instanceof Error ? error.message : "Intenta nuevamente."} /> : data.length ? <div className="grid gap-5 md:grid-cols-3">{data.map((service) => <Link key={service.id} to={`/my-services/${service.id}/edit`}><ServiceCard service={service} /></Link>)}</div> : <EmptyState title="Aún no tienes servicios" description="Crea tu primer servicio para recibir reservas." />}</Page>; }
export function ProviderServiceFormPage() { const { id } = useParams(); const navigate = useNavigate(); const queryClient = useQueryClient(); const handleError = useApiError(); const editing = Boolean(id); const { data: service } = useQuery({ queryKey: ["services", id], queryFn: () => marketplaceApi.services.get(id ?? ""), enabled: editing }); const form = useForm<ServiceValues>({ resolver: zodResolver(serviceSchema), values: service ? { type: service.type, title: service.title, description: service.description, price: service.price, location: service.location, availabilityNotes: service.availabilityNotes ?? "", isActive: service.isActive } : { type: "", title: "", description: "", price: 1, location: "", availabilityNotes: "", isActive: true } }); const currentLocation = form.watch("location"); const mutation = useMutation({ mutationFn: (values: ServiceValues) => editing ? marketplaceApi.services.update(id ?? "", { type: values.type, title: values.title, description: values.description, price: values.price, location: values.location, availabilityNotes: values.availabilityNotes || null, isActive: values.isActive }) : marketplaceApi.services.create({ type: values.type, title: values.title, description: values.description, price: values.price, location: values.location, availabilityNotes: values.availabilityNotes || null, isActive: values.isActive }), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["provider-services"] }); toast.success("Servicio guardado correctamente"); navigate("/my-services"); }, onError: handleError }); return <Page title={editing ? "Editar servicio" : "Nuevo servicio"}><form className="grid gap-5 rounded-card border bg-card p-6 shadow-soft md:grid-cols-2" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}><Input label="Tipo" error={form.formState.errors.type?.message} props={form.register("type")} /><Input label="Título" error={form.formState.errors.title?.message} props={form.register("title")} /><Input label="Precio" type="number" error={form.formState.errors.price?.message} props={form.register("price")} /><AddressAutocompleteInput label="Ubicación" value={currentLocation} onChange={(value) => form.setValue("location", value, { shouldDirty: true, shouldValidate: true })} /><LocationMap className="md:col-span-2" title="Vista previa de ubicación" address={currentLocation} /><label className="md:col-span-2 block text-sm font-bold">Descripción<textarea className="input-shell mt-2 min-h-28" {...form.register("description")} /></label><label className="md:col-span-2 block text-sm font-bold">Disponibilidad<textarea className="input-shell mt-2" {...form.register("availabilityNotes")} /></label><label className="font-bold"><input type="checkbox" className="mr-2" {...form.register("isActive")} />Activo</label><Button className="md:col-span-2" variant="hero" disabled={mutation.isPending}>{mutation.isPending ? "Guardando…" : "Guardar servicio"}</Button></form></Page>; }
export function ProfilePage() { const { profile, refreshProfile } = useAuth(); const handleError = useApiError(); const form = useForm<ProfileValues>({ resolver: zodResolver(profileSchema), values: { fullName: profile?.fullName ?? "", phone: profile?.phone ?? "", city: profile?.city ?? "", location: profile?.location ?? "" } }); const currentLocation = form.watch("location"); const mutation = useMutation({ mutationFn: (values: ProfileValues) => authApi.updateMe({ fullName: values.fullName, phone: values.phone || null, city: values.city || null, location: values.location || null }), onSuccess: async () => { await refreshProfile(); toast.success("Perfil actualizado"); }, onError: handleError }); return <Page title="Perfil"><section className="rounded-card border bg-card p-6 shadow-soft"><div className="flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-2xl">👤</div><div><h2 className="text-xl font-black">{profile?.fullName ?? "Usuario PetLink"}</h2><p className="text-muted-foreground">{profile?.role === "PROVIDER" ? "Proveedor" : "Dueño"}</p></div></div><form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}><Input label="Nombre" error={form.formState.errors.fullName?.message} props={form.register("fullName")} /><Input label="Teléfono" error={form.formState.errors.phone?.message} props={form.register("phone")} /><Input label="Ciudad" error={form.formState.errors.city?.message} props={form.register("city")} /><AddressAutocompleteInput label="Dirección" value={currentLocation} onChange={(value) => form.setValue("location", value, { shouldDirty: true, shouldValidate: true })} /><LocationMap className="md:col-span-2" title="Ubicación de perfil" address={currentLocation} city={form.watch("city") || undefined} /><Button className="md:col-span-2" variant="hero" disabled={mutation.isPending}>{mutation.isPending ? "Guardando…" : "Guardar perfil"}</Button></form></section></Page>; }
export function SubscriptionsPage() { const queryClient = useQueryClient(); const handleError = useApiError(); const [provider, setProvider] = useState<"MERCADOPAGO" | "TRANSBANK">("MERCADOPAGO"); const [selectedPlan, setSelectedPlan] = useState<"BASIC" | "PREMIUM" | "PROVIDER_PRO">("BASIC"); const plans: Array<{ code: "BASIC" | "PREMIUM" | "PROVIDER_PRO"; name: string; price: number; features: string[] }> = [{ code: "BASIC", name: "Basic", price: 9900, features: ["Perfil activo", "Funciones base"] }, { code: "PREMIUM", name: "Premium", price: 19900, features: ["Más visibilidad", "Beneficios premium"] }, { code: "PROVIDER_PRO", name: "Provider Pro", price: 29900, features: ["Herramientas avanzadas", "Prioridad en resultados"] }]; const activeSubscription = useQuery({ queryKey: ["my-subscription"], queryFn: () => marketplaceApi.subscriptions.getMyActive() }); const myPayments = useQuery({ queryKey: ["my-payments"], queryFn: () => marketplaceApi.payments.my() }); const checkout = useMutation({ mutationFn: () => marketplaceApi.payments.checkout({ planCode: selectedPlan, provider, autoRenew: true }), onSuccess: async (result) => { if (result.checkoutUrl) { window.open(result.checkoutUrl, "_blank", "noopener,noreferrer"); } await queryClient.invalidateQueries({ queryKey: ["my-payments"] }); toast.success("Checkout creado. Puedes confirmar el pago cuando lo completes."); }, onError: handleError }); const confirmPayment = useMutation({ mutationFn: (paymentId: string) => marketplaceApi.payments.confirm(paymentId, { status: "APPROVED", paymentMethod: provider }), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["my-payments"] }); await queryClient.invalidateQueries({ queryKey: ["my-subscription"] }); toast.success("Pago confirmado correctamente"); }, onError: handleError }); const cancelSubscription = useMutation({ mutationFn: (id: string) => marketplaceApi.subscriptions.cancel(id), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["my-subscription"] }); toast.success("Suscripción cancelada"); }, onError: handleError }); return <Page title="Planes y pagos"><section className="rounded-card border bg-card p-6 shadow-soft"><h2 className="text-xl font-black">Tu suscripción</h2>{activeSubscription.isLoading ? <p className="mt-3 text-sm text-muted-foreground">Cargando suscripción...</p> : activeSubscription.error ? <p className="mt-3 text-sm text-destructive">No se pudo cargar la suscripción activa.</p> : <div className="mt-4 flex flex-wrap items-center gap-3"><span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">Plan: {activeSubscription.data?.planCode ?? "FREE"}</span><span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">Estado: {activeSubscription.data?.status ?? "SIN SUSCRIPCIÓN"}</span>{activeSubscription.data ? <Button variant="outline" onClick={() => cancelSubscription.mutate(activeSubscription.data.id)} disabled={cancelSubscription.isPending}>{cancelSubscription.isPending ? "Cancelando..." : "Cancelar plan"}</Button> : null}</div>}</section><section className="mt-6 rounded-card border bg-card p-6 shadow-soft"><h2 className="text-xl font-black">Elegir plan</h2><div className="mt-4 grid gap-4 md:grid-cols-3">{plans.map((plan) => <button key={plan.code} className={`rounded-card border p-4 text-left transition-colors ${selectedPlan === plan.code ? "border-primary bg-primary-soft" : "hover:bg-accent"}`} onClick={() => setSelectedPlan(plan.code)}><p className="text-sm font-black">{plan.name}</p><p className="mt-1 text-lg font-black">${plan.price.toLocaleString("es-CL")} CLP</p><ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-muted-foreground">{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul></button>)}</div><div className="mt-4 flex flex-wrap items-center gap-3"><label className="text-sm font-bold">Proveedor</label><select className="input-shell w-56" value={provider} onChange={(event) => setProvider(event.target.value as "MERCADOPAGO" | "TRANSBANK")}><option value="MERCADOPAGO">MercadoPago</option><option value="TRANSBANK">Transbank</option></select><Button variant="hero" disabled={checkout.isPending} onClick={() => checkout.mutate()}>{checkout.isPending ? "Creando checkout..." : "Ir a checkout"}</Button></div></section><section className="mt-6 rounded-card border bg-card p-6 shadow-soft"><h2 className="text-xl font-black">Mis pagos</h2>{myPayments.isLoading ? <p className="mt-3 text-sm text-muted-foreground">Cargando pagos...</p> : myPayments.error ? <p className="mt-3 text-sm text-destructive">No se pudieron cargar tus pagos.</p> : myPayments.data?.length ? <div className="mt-4 space-y-3">{myPayments.data.map((payment) => <div key={payment.id} className="flex flex-wrap items-center justify-between gap-3 rounded-card border p-3"><div><p className="font-bold">{payment.description}</p><p className="text-xs text-muted-foreground">{payment.provider} · {new Date(payment.createdAt).toLocaleString("es-CL")}</p></div><div className="flex items-center gap-2"><span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">{payment.status}</span><span className="text-sm font-bold">${Number(payment.amount).toLocaleString("es-CL")} {payment.currency}</span>{payment.status === "PENDING" ? <Button size="sm" variant="outline" onClick={() => confirmPayment.mutate(payment.id)} disabled={confirmPayment.isPending}>{confirmPayment.isPending ? "Confirmando..." : "Confirmar"}</Button> : null}</div></div>)}</div> : <EmptyState title="Sin pagos" description="Aún no tienes pagos registrados." />}</section></Page>; }
export function NotificationsPage() { return <Page title="Notificaciones"><EmptyState title="Todo tranquilo" description="El backend actual permite crear notificaciones; no incluye endpoint de listado para mostrarlas aquí." /></Page>; }
export function BookingDetailPage() { const { id } = useParams(); const { data, isLoading, error } = useQuery({ queryKey: ["bookings", id], queryFn: () => marketplaceApi.bookings.get(id ?? ""), enabled: Boolean(id) }); return <Page title="Detalle de reserva">{isLoading ? <SkeletonGrid /> : error || !data ? <EmptyState title="Reserva no encontrada" description={error instanceof Error ? error.message : "No pudimos cargar el detalle."} /> : <BookingCard booking={data} />}</Page>; }
export function RoleRedirect({ provider }: { provider: boolean }) { const { role } = useAuth(); if ((provider && role !== "PROVIDER") || (!provider && role !== "OWNER")) return <Navigate to="/dashboard" replace />; return null; }

function Page({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) { return <section><div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold text-primary">PetLink</p><h1 className="text-3xl font-black md:text-4xl">{title}</h1></div>{action}</div>{children}</section>; }
function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <article className="rounded-card border bg-card p-6 shadow-soft"><div className="text-primary">{icon}</div><strong className="mt-4 block text-3xl font-black">{value}</strong><span className="text-sm font-bold text-muted-foreground">{label}</span></article>; }
function Input({ label, error, props, type = "text" }: { label: string; error?: string; props: UseFormRegisterReturn; type?: string }) { return <label className="block text-sm font-bold">{label}<input type={type} className="input-shell mt-2" {...props} />{error && <span className="mt-1 block text-xs text-destructive">{error}</span>}</label>; }
