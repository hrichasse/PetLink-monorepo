import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <h1>PetLink</h1>
      <p>La plataforma de servicios para mascotas.</p>
      <nav>
        <Link href="/login">Iniciar sesión</Link>
      </nav>
    </main>
  );
}
