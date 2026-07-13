"use client";

import { Link, useParams } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { PublicNav } from "@/components/petlink/Layout";
import { PetlinkFooter } from "@/components/petlink/Footer";

type LegalSection = { h: string; p: string[] };
type LegalDoc = { slug: string; nav: string; title: string; updated: string; intro: string; sections: LegalSection[] };

const LAST_UPDATED = "Julio de 2026";

const DOCS: LegalDoc[] = [
  {
    slug: "privacidad",
    nav: "Protección de datos",
    title: "Política de Privacidad y Protección de Datos",
    updated: LAST_UPDATED,
    intro:
      "En PetLink protegemos tu información y la de tu familia peluda. Esta política explica qué datos personales tratamos, con qué finalidad y qué derechos tienes, en el marco de la Ley N° 19.628 sobre Protección de la Vida Privada y su modificación por la Ley N° 21.719, que moderniza el régimen de protección de datos personales en Chile.",
    sections: [
      {
        h: "1. Responsable del tratamiento",
        p: [
          "El responsable del tratamiento de tus datos es PetLink SpA, con domicilio en Santiago, Región Metropolitana, Chile.",
          "Para cualquier consulta sobre esta política o el ejercicio de tus derechos, puedes escribir a contacto@petlink.cl."
        ]
      },
      {
        h: "2. Datos que recopilamos",
        p: [
          "Datos de identificación y contacto: nombre completo, correo electrónico, teléfono, ciudad y dirección.",
          "Datos de tus mascotas: nombre, especie, raza, edad, peso, estado de salud y fotografías que decidas cargar.",
          "Datos de uso: reservas, servicios publicados, reseñas y actividad dentro de la plataforma.",
          "Datos de pago: son procesados directamente por nuestros proveedores de pago (Transbank / Webpay Plus y Mercado Pago). PetLink no almacena números de tarjeta ni credenciales bancarias."
        ]
      },
      {
        h: "3. Finalidades del tratamiento",
        p: [
          "Prestar y operar el servicio: gestionar tu cuenta, mascotas, reservas y pagos.",
          "Conectar dueños con proveedores de servicios para mascotas.",
          "Comunicarnos contigo respecto de tus reservas, soporte y novedades relevantes.",
          "Velar por la seguridad de la plataforma, prevenir fraudes y mejorar nuestros servicios."
        ]
      },
      {
        h: "4. Base de licitud",
        p: [
          "Tratamos tus datos sobre la base de tu consentimiento y de la ejecución del contrato de prestación de servicios que aceptas al usar PetLink.",
          "Puedes revocar tu consentimiento en cualquier momento, sin que ello afecte la licitud del tratamiento previo."
        ]
      },
      {
        h: "5. Encargados y terceros",
        p: [
          "Para operar utilizamos proveedores que actúan como encargados de tratamiento: Supabase (base de datos y almacenamiento), Vercel (hosting), Transbank y Mercado Pago (pagos) y Google Maps (mapas y direcciones).",
          "Estos proveedores solo acceden a los datos necesarios para prestar su servicio y bajo obligaciones de confidencialidad. Algunos pueden implicar transferencia internacional de datos, adoptando resguardos adecuados."
        ]
      },
      {
        h: "6. Tus derechos",
        p: [
          "Conforme a la Ley N° 21.719 tienes derecho a: acceder a tus datos, rectificarlos, solicitar su supresión (cancelación), oponerte a su tratamiento, solicitar su portabilidad y a no ser objeto de decisiones basadas únicamente en tratamiento automatizado.",
          "También tienes derecho a bloquear temporalmente el tratamiento y a reclamar ante la autoridad de protección de datos competente.",
          "Para ejercer estos derechos escríbenos a contacto@petlink.cl indicando tu solicitud. Responderemos en los plazos que establece la ley."
        ]
      },
      {
        h: "7. Conservación de los datos",
        p: [
          "Conservamos tus datos mientras mantengas una cuenta activa y durante el tiempo necesario para cumplir con obligaciones legales, contables y de resolución de disputas. Luego se eliminan o anonimizan."
        ]
      },
      {
        h: "8. Seguridad",
        p: [
          "Aplicamos medidas técnicas y organizativas razonables para proteger tus datos, incluyendo cifrado en tránsito, control de acceso y buenas prácticas de desarrollo. Ningún sistema es 100% infalible, pero trabajamos para minimizar riesgos."
        ]
      },
      {
        h: "9. Cookies y tecnologías similares",
        p: [
          "Utilizamos almacenamiento local y cookies estrictamente necesarias para mantener tu sesión y el funcionamiento de la plataforma. No usamos cookies con fines publicitarios de terceros sin tu consentimiento."
        ]
      },
      {
        h: "10. Menores de edad",
        p: [
          "PetLink está dirigido a mayores de 18 años. No recopilamos intencionalmente datos de menores de edad."
        ]
      },
      {
        h: "11. Cambios a esta política",
        p: [
          "Podemos actualizar esta política para reflejar cambios legales o de nuestros servicios. Publicaremos la versión vigente en esta página con su fecha de actualización."
        ]
      }
    ]
  },
  {
    slug: "terminos",
    nav: "Términos y Condiciones",
    title: "Términos y Condiciones de Uso",
    updated: LAST_UPDATED,
    intro:
      "Estos Términos regulan el uso de la plataforma PetLink. Al crear una cuenta o utilizar el servicio, aceptas estos Términos en su totalidad.",
    sections: [
      {
        h: "1. Definiciones",
        p: [
          "\"Plataforma\": el sitio y aplicaciones de PetLink. \"Dueño\": usuario que busca servicios para su mascota. \"Proveedor\": usuario que publica y presta servicios. \"Reserva\": la contratación de un servicio entre un Dueño y un Proveedor."
        ]
      },
      {
        h: "2. Rol de PetLink",
        p: [
          "PetLink es un marketplace que conecta a Dueños y Proveedores. PetLink no presta directamente los servicios para mascotas y no es parte del contrato de prestación entre Dueño y Proveedor, salvo en lo relativo a la intermediación y el procesamiento de pagos."
        ]
      },
      {
        h: "3. Cuenta de usuario",
        p: [
          "Debes proporcionar información veraz y mantenerla actualizada. Eres responsable de la confidencialidad de tus credenciales y de la actividad realizada desde tu cuenta."
        ]
      },
      {
        h: "4. Obligaciones de los Proveedores",
        p: [
          "El Proveedor declara contar con la idoneidad, medios y, cuando corresponda, autorizaciones para prestar los servicios que publica, y se obliga a prestarlos con diligencia, seguridad y buen trato animal."
        ]
      },
      {
        h: "5. Reservas y pagos",
        p: [
          "Las reservas se gestionan a través de la Plataforma. Los pagos se procesan mediante proveedores externos (Transbank / Webpay Plus, Mercado Pago). Los precios son fijados por cada Proveedor e incluyen los impuestos que correspondan."
        ]
      },
      {
        h: "6. Cancelaciones",
        p: [
          "Las reservas pueden cancelarse conforme a las Políticas de Servicio y de Postventa. Las condiciones de reembolso dependen del estado de la reserva y del momento de la cancelación."
        ]
      },
      {
        h: "7. Contenido y reseñas",
        p: [
          "Eres responsable del contenido que publicas (textos, fotos, reseñas). No se permite contenido ilegal, ofensivo, engañoso o que infrinja derechos de terceros. Otorgas a PetLink una licencia para mostrar dicho contenido dentro de la Plataforma."
        ]
      },
      {
        h: "8. Conductas prohibidas",
        p: [
          "No está permitido usar la Plataforma para fines fraudulentos, suplantar identidades, vulnerar la seguridad, ni maltratar animales. El incumplimiento puede derivar en la suspensión o cierre de la cuenta."
        ]
      },
      {
        h: "9. Limitación de responsabilidad",
        p: [
          "En la máxima medida permitida por la ley, PetLink no será responsable por los actos u omisiones de los Proveedores o Dueños. Nada en estos Términos limita los derechos que la ley reconoce a los consumidores."
        ]
      },
      {
        h: "10. Ley aplicable",
        p: [
          "Estos Términos se rigen por las leyes de la República de Chile. Cualquier controversia se someterá a los tribunales competentes de Santiago."
        ]
      }
    ]
  },
  {
    slug: "servicio",
    nav: "Políticas de Servicio",
    title: "Políticas de Servicio",
    updated: LAST_UPDATED,
    intro: "Estas políticas describen cómo funcionan las reservas y la prestación de servicios en PetLink.",
    sections: [
      {
        h: "1. Reservas",
        p: [
          "Una reserva se confirma cuando el Proveedor la acepta. El estado de cada reserva (pendiente, confirmada, completada o cancelada) es visible para ambas partes en todo momento."
        ]
      },
      {
        h: "2. Cancelaciones y reprogramaciones",
        p: [
          "El Dueño puede cancelar una reserva que no esté completada o ya cancelada. Recomendamos cancelar con la mayor antelación posible por respeto al Proveedor y a otras familias."
        ]
      },
      {
        h: "3. Calidad y verificación",
        p: [
          "Fomentamos perfiles completos, reseñas transparentes y buenas prácticas de bienestar animal. Los Proveedores destacados o \"Partner\" cumplen con requisitos adicionales de la Plataforma."
        ]
      },
      {
        h: "4. Reseñas",
        p: [
          "Las reseñas deben basarse en experiencias reales. Nos reservamos el derecho de moderar contenido que infrinja estas políticas."
        ]
      },
      {
        h: "5. Disponibilidad",
        p: [
          "Trabajamos para mantener la Plataforma disponible, pero pueden existir mantenimientos o interrupciones. Avisaremos cuando sea posible."
        ]
      }
    ]
  },
  {
    slug: "postventa",
    nav: "Postventa",
    title: "Política de Postventa y Atención al Cliente",
    updated: LAST_UPDATED,
    intro: "Queremos que tu experiencia sea excelente incluso después de la reserva. Aquí explicamos cómo te acompañamos.",
    sections: [
      {
        h: "1. Canales de soporte",
        p: [
          "Puedes contactarnos a contacto@petlink.cl o al +56 9 7779 8385, de lunes a viernes de 10:00 a 19:00 hrs."
        ]
      },
      {
        h: "2. Reclamos",
        p: [
          "Si tuviste un problema con un servicio, escríbenos con el detalle de tu reserva. Mediaremos entre las partes buscando una solución justa."
        ]
      },
      {
        h: "3. Reembolsos y cancelaciones",
        p: [
          "Los reembolsos se evalúan caso a caso según el estado de la reserva y el motivo. Cuando corresponda, se realizan a través del mismo medio de pago utilizado."
        ]
      },
      {
        h: "4. Derechos del consumidor",
        p: [
          "Respetamos plenamente los derechos que la Ley N° 19.496 sobre Protección de los Derechos de los Consumidores reconoce a los usuarios. Puedes acudir al SERNAC si lo estimas necesario."
        ]
      }
    ]
  }
];

export function LegalPage() {
  const { doc: slug } = useParams();
  const doc = DOCS.find((d) => d.slug === slug) ?? DOCS[0];

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-primary">Legal</p>
            <h1 className="text-2xl font-black md:text-3xl">{doc.title}</h1>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
          <aside>
            <nav className="flex gap-2 overflow-x-auto lg:sticky lg:top-24 lg:flex-col">
              {DOCS.map((d) => (
                <Link
                  key={d.slug}
                  to={`/legal/${d.slug}`}
                  className={`shrink-0 rounded-2xl px-4 py-2.5 text-sm font-bold transition-colors ${
                    d.slug === doc.slug ? "bg-primary-soft text-primary" : "text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {d.nav}
                </Link>
              ))}
            </nav>
          </aside>

          <article className="rounded-card border bg-card p-6 shadow-soft md:p-8">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Última actualización: {doc.updated}</p>
            <p className="mt-4 text-muted-foreground">{doc.intro}</p>

            {doc.sections.map((section) => (
              <section key={section.h} className="mt-8">
                <h2 className="text-lg font-extrabold">{section.h}</h2>
                {section.p.map((paragraph, index) => (
                  <p key={index} className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}

            <div className="mt-10 rounded-2xl border border-dashed bg-background p-4 text-xs text-muted-foreground">
              Este documento es un modelo referencial para efectos informativos y no constituye asesoría legal. Para su
              uso definitivo, recomendamos revisión por un profesional del derecho.
            </div>
          </article>
        </div>
      </main>
      <PetlinkFooter />
    </div>
  );
}
