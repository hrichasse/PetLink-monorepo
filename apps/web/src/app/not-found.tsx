// Minimal not-found page for Next.js app router.
// `force-dynamic` prevents static prerendering, avoiding the
// "Cannot read properties of null (reading 'useContext')" error
// that occurs when Next.js tries to SSR this page during build.
export const dynamic = 'force-dynamic'

export default function NotFound() {
  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem", textAlign: "center" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>404 – Página no encontrada</h2>
      <p style={{ marginTop: "0.5rem", color: "#6b7280" }}>
        La URL solicitada no existe. Vuelve al inicio.
      </p>
      <a href="/" style={{ display: "inline-block", marginTop: "1rem", color: "#2563eb" }}>
        Ir al inicio
      </a>
    </div>
  );
}
