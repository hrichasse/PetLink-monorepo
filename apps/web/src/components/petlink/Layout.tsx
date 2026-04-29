import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bell, BriefcaseBusiness, CalendarCheck, Heart, Home, LogOut, Menu, PawPrint, Search, Settings, Stethoscope, UserRound, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PetlinkFooter } from "@/components/petlink/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { marketplaceApi } from "@/lib/petlink-api";
import { cn } from "@/lib/utils";

export function PublicNav() {
  return <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur"><nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3"><Link to="/" className="flex items-center gap-2 text-xl font-black"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><PawPrint /></span>PetLink</Link><div className="flex items-center gap-2"><Button asChild variant="ghost"><Link to="/login">Ingresar</Link></Button><Button asChild variant="hero"><Link to="/register">Crear cuenta</Link></Button></div></nav></header>;
}

const ownerLinks = [
  ["/dashboard", "Inicio", Home], ["/pets", "Mascotas", PawPrint], ["/services", "Servicios", Search], ["/match", "Match", Heart], ["/bookings", "Reservas", CalendarCheck], ["/announcements", "Anuncios", Bell], ["/vets", "Veterinarias", Stethoscope],
];
const providerLinks = [["/dashboard", "Inicio", Home], ["/my-services", "Mis servicios", BriefcaseBusiness], ["/my-bookings", "Reservas", CalendarCheck]];
const sharedLinks = [["/profile", "Perfil", UserRound], ["/subscriptions", "Planes", WalletCards], ["/notifications", "Alertas", Bell]];

export function AppShell() {
  const { role, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const links = [...(role === "PROVIDER" ? providerLinks : ownerLinks), ...sharedLinks];
  const activeSubscription = useQuery({
    queryKey: ["my-subscription"],
    queryFn: async () => {
      try {
        return await marketplaceApi.subscriptions.getMyActive();
      } catch {
        return null;
      }
    },
    staleTime: 30_000
  });

  const planLabel = (() => {
    const planCode = activeSubscription.data?.planCode;
    if (planCode === "PREMIUM") return "Premium";
    if (planCode === "PROVIDER_PRO") return "Provider Pro";
    if (planCode === "BASIC") return "Basic";
    return "Free";
  })();

  return <div className="min-h-screen bg-background"><header className="sticky top-0 z-40 border-b bg-background/92 backdrop-blur-xl"><div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3"><Link to="/dashboard" className="flex items-center gap-2 text-xl font-black"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><PawPrint /></span>PetLink</Link><div className="hidden items-center gap-2 md:flex"><div className="mr-1 flex flex-col items-end"><span className="text-sm font-bold leading-tight">{profile?.fullName ?? "Usuario"}</span><div className="mt-0.5 flex gap-1"><span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-secondary-foreground">{role === "OWNER" ? "Dueño" : "Proveedor"}</span><span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">{planLabel}</span></div></div><Button variant="outline" size="sm" onClick={() => navigate("/profile")}><Settings className="h-4 w-4" />Perfil</Button><Button variant="ghost" size="icon" aria-label="Cerrar sesión" onClick={() => void signOut()}><LogOut className="h-4 w-4" /></Button></div><Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menú"><Menu /></Button></div></header><div className="mx-auto grid max-w-7xl gap-6 px-4 py-5 md:grid-cols-[240px_1fr]"><aside className="hidden md:block"><nav className="sticky top-24 space-y-2 rounded-card border bg-card p-3 shadow-soft" aria-label="Navegación principal">{links.map(([to, label, Icon]) => <NavLink key={to as string} to={to as string} className={({ isActive }) => cn("flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground", isActive && "bg-primary-soft text-primary")}><Icon className="h-5 w-5" />{label as string}</NavLink>)}</nav></aside><main className="min-w-0 pb-24"><Outlet /><PetlinkFooter /></main></div><nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-background/95 p-2 backdrop-blur md:hidden">{links.slice(0,5).map(([to, label, Icon]) => <NavLink key={to as string} to={to as string} className={({ isActive }) => cn("flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-bold text-muted-foreground", isActive && "bg-primary-soft text-primary")}><Icon className="h-5 w-5" /><span>{label as string}</span></NavLink>)}</nav></div>;
}
