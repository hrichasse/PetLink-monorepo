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
        <div className="rounded-2xl border border-slate-300/70 bg-white/75 p-4 shadow-soft backdrop-blur md:p-5">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Pagos seguros y certificados
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <img
                  src="/payments/mercado-pago.png"
                  alt="Mercado Pago"
                  className="h-16 w-auto max-w-full object-contain md:h-20"
                  loading="lazy"
                />
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <img
                  src="/payments/webpay-plus-redcompra.png"
                  alt="Webpay Plus y RedCompra Transbank"
                  className="h-16 w-auto max-w-full object-contain md:h-20"
                  loading="lazy"
                />
              </div>
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
