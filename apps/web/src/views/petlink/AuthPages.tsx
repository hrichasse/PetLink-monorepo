import { useState, type ReactNode } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Mail, PawPrint, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import type { Role } from "@/lib/petlink-data";
import { toast } from "sonner";

const loginSchema = z.object({ email: z.string().email("Ingresa un correo válido"), password: z.string().min(6, "Mínimo 6 caracteres") });
const registerSchema = loginSchema.extend({ fullName: z.string().min(2, "Ingresa tu nombre") });

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

export function LoginPage() {
  const { user, signIn, sendMagicLink, signInWithGoogle, loading } = useAuth();
  const [magicEmail, setMagicEmail] = useState("");
  const navigate = useNavigate();
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });
  
  if (loading) return <div className="grid min-h-screen place-items-center bg-background text-foreground">Cargando PetLink…</div>;
  if (user) return <Navigate to="/dashboard" replace />;
  
  return <AuthFrame title="Vuelve a PetLink" subtitle="Gestiona reservas, mascotas y servicios desde un solo lugar."><form className="space-y-4" onSubmit={form.handleSubmit(async (values) => { try { await signIn(values.email, values.password); } catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo iniciar sesión"); } })}><Field label="Correo" error={form.formState.errors.email?.message}><input className="input-shell" {...form.register("email")} type="email" autoComplete="email" /></Field><Field label="Contraseña" error={form.formState.errors.password?.message}><input className="input-shell" {...form.register("password")} type="password" autoComplete="current-password" /></Field><Button className="w-full" variant="hero" type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Ingresando..." : "Ingresar"}</Button></form><div className="my-5 grid gap-3"><button type="button" onClick={() => void signInWithGoogle()} className="inline-flex w-full items-center justify-center gap-2.5 rounded-card border border-border bg-white px-4 py-2.5 font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 active:bg-gray-100"><svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>Continuar con Google</button><div className="flex gap-2"><input className="input-shell" placeholder="correo@ejemplo.com" value={magicEmail} onChange={(e) => setMagicEmail(e.target.value)} aria-label="Correo para magic link" /><Button variant="soft" onClick={() => void sendMagicLink(magicEmail)}><Mail className="h-4 w-4" /></Button></div></div><p className="text-center text-sm text-muted-foreground">¿Nuevo en PetLink? <Link className="font-bold text-primary" to="/register">Crea tu cuenta</Link></p></AuthFrame>;
}

export function RegisterPage() {
  const { user, signUp, signInWithGoogle } = useAuth();
  const [role, setRole] = useState<Role>("OWNER");
  const navigate = useNavigate();
  const form = useForm<RegisterValues>({ resolver: zodResolver(registerSchema), defaultValues: { fullName: "", email: "", password: "" } });
  if (user) return <Navigate to="/dashboard" replace />;
  return <AuthFrame title="Crea tu cuenta" subtitle="Elige cómo usarás PetLink y empieza en minutos."><div className="mb-5 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Selecciona tu rol">{([{ key: "OWNER", label: "Dueño", desc: "Busco cuidado" }, { key: "PROVIDER", label: "Proveedor", desc: "Ofrezco servicios" }] as const).map((item) => <button key={item.key} type="button" role="radio" aria-checked={role === item.key} onClick={() => setRole(item.key)} className={`rounded-card border p-4 text-left transition-all ${role === item.key ? "border-primary bg-primary-soft shadow-warm" : "border-border bg-card hover:bg-accent"}`}><ShieldCheck className="mb-3 h-6 w-6 text-primary" /><strong>{item.label}</strong><span className="block text-xs text-muted-foreground">{item.desc}</span></button>)}</div><form className="space-y-4" onSubmit={form.handleSubmit(async (values) => { try { await signUp(values.email, values.password, values.fullName, role); navigate("/onboarding/profile"); } catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo registrar"); } })}><Field label="Nombre" error={form.formState.errors.fullName?.message}><input className="input-shell" {...form.register("fullName")} autoComplete="name" /></Field><Field label="Correo" error={form.formState.errors.email?.message}><input className="input-shell" {...form.register("email")} type="email" autoComplete="email" /></Field><Field label="Contraseña" error={form.formState.errors.password?.message}><input className="input-shell" {...form.register("password")} type="password" autoComplete="new-password" /></Field><Button className="w-full" variant="hero" type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Creando cuenta..." : "Crear cuenta"}</Button></form><div className="mt-4"><button type="button" onClick={() => void signInWithGoogle()} className="inline-flex w-full items-center justify-center gap-2.5 rounded-card border border-border bg-white px-4 py-2.5 font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 active:bg-gray-100"><svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>Registrarme con Google</button></div><p className="mt-5 text-center text-sm text-muted-foreground">¿Ya tienes cuenta? <Link className="font-bold text-primary" to="/login">Ingresa</Link></p></AuthFrame>;
}

function AuthFrame({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return <main className="grid min-h-screen place-items-center bg-background p-4"><section className="w-full max-w-md rounded-card border bg-card p-6 shadow-warm"><Link to="/" className="mb-6 flex items-center gap-2 text-xl font-black"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><PawPrint /></span>PetLink</Link><h1 className="text-3xl font-black">{title}</h1><p className="mt-2 text-muted-foreground">{subtitle}</p><div className="mt-6">{children}</div></section></main>;
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return <label className="block text-sm font-bold text-foreground">{label}<div className="mt-2">{children}</div>{error && <span className="mt-1 block text-xs text-destructive">{error}</span>}</label>;
}
