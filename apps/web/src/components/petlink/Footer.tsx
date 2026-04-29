import { Mail, MapPin, Phone, Clock3, ShieldCheck } from "lucide-react";

export function PetlinkFooter() {
  return (
    <footer className="mt-16 border-t bg-gradient-to-b from-slate-100/70 to-slate-200/70 text-slate-800">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 md:grid-cols-[1.1fr_1fr_1fr_1.2fr]">
        <section>
          <h2 className="text-2xl font-black tracking-tight text-primary">PetLink</h2>
          <p className="mt-3 max-w-xs text-sm text-slate-600">
            Conectamos familias peludas con servicios confiables en todo Chile.
          </p>
          <div className="mt-6 flex gap-3">
            <span className="rounded-lg border bg-white px-3 py-2 text-xs font-bold">ChileCompra</span>
            <span className="rounded-lg border bg-white px-3 py-2 text-xs font-bold">Flow</span>
            <span className="rounded-lg border bg-white px-3 py-2 text-xs font-bold">Webpay Plus</span>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-extrabold">Informacion</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>Blog</li>
            <li>Contacto</li>
            <li>Calificanos en Google</li>
            <li>Quienes somos</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-extrabold">Servicio al Cliente</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>Soporte tecnico</li>
            <li>Politicas de servicio</li>
            <li>Postventa</li>
            <li>Terminos y condiciones</li>
            <li>Ventas corporativas</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-extrabold">Contactanos</h3>
          <ul className="mt-3 space-y-3 text-sm text-slate-700">
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> +56 9 7779 8385</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> contacto@petlink.cl</li>
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Santiago, Region Metropolitana</li>
            <li className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-primary" /> Lun a Vie 10:00 a 19:00</li>
          </ul>
        </section>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-10">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-gradient-to-br from-white/98 via-slate-50/95 to-white/98 p-4 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.2),inset_0_1px_1px_0_rgba(255,255,255,0.6)] backdrop-blur-xl md:p-8">
          <div className="pointer-events-none absolute -right-40 -top-40 h-80 w-80 rounded-full bg-blue-200/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-40 -bottom-40 h-80 w-80 rounded-full bg-cyan-200/15 blur-3xl" />
          
          <div className="relative z-10 flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-base font-extrabold text-slate-900">
                <div className="rounded-full bg-gradient-to-br from-sky-400 to-blue-500 p-2">
                  <ShieldCheck className="h-5 w-5 text-white" />
                </div>
                <span>Pagos seguros y certificados</span>
              </div>
              <span className="rounded-full border border-slate-300/60 bg-slate-100/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Métodos de pago verificados
              </span>
            </div>

            <div className="grid gap-5 md:grid-cols-[1.2fr_1fr]">
              <article className="group relative overflow-hidden rounded-2xl border border-slate-300/70 bg-gradient-to-br from-white/95 via-slate-50/90 to-white/95 px-5 py-5 shadow-[0_8px_24px_-8px_rgba(15,23,42,0.1),inset_0_1px_1px_0_rgba(255,255,255,0.8)] transition-all duration-300 hover:-translate-y-1 hover:border-slate-400/70 hover:shadow-[0_12px_32px_-8px_rgba(59,130,246,0.15),inset_0_1px_1px_0_rgba(255,255,255,0.8)] md:px-6 md:py-6">
                <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-blue-300/15 blur-2xl transition-opacity duration-300 group-hover:bg-blue-300/25" />
                <div className="relative z-10">
                  <img
                    src="/payments/mercado-pago-clean.png"
                    alt="Mercado Pago"
                    className="h-20 w-auto max-w-full object-contain md:h-24"
                    loading="lazy"
                  />
                  <p className="mt-3 text-xs font-semibold tracking-wide text-slate-600">Transacciones encriptadas y aseguradas</p>
                </div>
              </article>

              <article className="group relative overflow-hidden rounded-2xl border border-slate-300/70 bg-gradient-to-br from-white/95 via-slate-50/90 to-white/95 px-5 py-5 shadow-[0_8px_24px_-8px_rgba(15,23,42,0.1),inset_0_1px_1px_0_rgba(255,255,255,0.8)] transition-all duration-300 hover:-translate-y-1 hover:border-slate-400/70 hover:shadow-[0_12px_32px_-8px_rgba(239,68,68,0.15),inset_0_1px_1px_0_rgba(255,255,255,0.8)] md:px-6 md:py-6">
                <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-red-300/15 blur-2xl transition-opacity duration-300 group-hover:bg-red-300/25" />
                <div className="relative z-10">
                  <img
                    src="/payments/webpay-plus-redcompra-clean.png"
                    alt="Webpay Plus y RedCompra Transbank"
                    className="h-20 w-auto max-w-full object-contain md:h-24"
                    loading="lazy"
                  />
                  <p className="mt-3 text-xs font-semibold tracking-wide text-slate-600">Válida en todo Chile con máxima seguridad</p>
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-primary px-4 py-3 text-center text-sm font-bold text-primary-foreground">
        Petlink.cl | #SienteLaTecnologia | 2026
      </div>
    </footer>
  );
}
