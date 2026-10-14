import type { Locale } from '@/lib/i18n/locales';

const GUIDES = {
  'under-sink-ro-water-purifiers': {
    en: {
      title: 'How B2B Buyers Compare Under-Sink RO Systems',
      intro: 'Shortlist models using verified installation, capacity and maintenance requirements rather than model appearance alone.',
      items: [
        ['Tank or tankless', 'Confirm available cabinet space, peak demand and preferred dispensing response.'],
        ['Rated capacity', 'Compare GPD and flow only under the stated inlet-water, pressure and temperature conditions.'],
        ['Filter configuration', 'Check cartridge format, replacement supply and maintenance requirements for the destination market.'],
      ],
    },
    es: {
      title: 'Cómo Comparan los Compradores B2B los Sistemas RO Bajo Fregadero',
      intro: 'Seleccione modelos según la instalación, capacidad y mantenimiento verificados, no solo por la apariencia.',
      items: [
        ['Con tanque o sin tanque', 'Confirme el espacio, la demanda máxima y la respuesta de dispensado.'],
        ['Capacidad nominal', 'Compare GPD y caudal bajo las condiciones declaradas de agua, presión y temperatura.'],
        ['Configuración de filtros', 'Revise el formato del cartucho, el suministro de repuestos y el mantenimiento.'],
      ],
    },
  },
  'countertop-ro-water-purifiers': {
    en: {
      title: 'How B2B Buyers Compare Countertop RO Purifiers',
      intro: 'Confirm the intended market, water source, heating functions, tank format and control requirements before selecting a model.',
      items: [
        ['Installation', 'Confirm countertop space, feed-water method and plug-and-use requirements.'],
        ['Heating and dispensing', 'Compare only the temperatures, outlets and controls documented for the exact model.'],
        ['Service planning', 'Confirm removable parts, filter supply, manuals and destination-market electrical requirements.'],
      ],
    },
    es: {
      title: 'Cómo Comparan los Compradores B2B los Purificadores RO de Encimera',
      intro: 'Confirme el mercado, la fuente de agua, el calentamiento, el depósito y el control antes de elegir.',
      items: [
        ['Instalación', 'Confirme el espacio, la alimentación de agua y los requisitos de conexión.'],
        ['Calentamiento y dispensado', 'Compare solo temperaturas, salidas y controles documentados para el modelo.'],
        ['Plan de servicio', 'Confirme piezas desmontables, filtros, manuales y requisitos eléctricos.'],
      ],
    },
  },
  'commercial-ro-water-purification-systems': {
    en: {
      title: 'Information Required Before Commercial RO Selection',
      intro: 'Commercial system selection should begin with project data. A capacity number alone is not enough for a reliable quotation.',
      items: [
        ['Feed water', 'Provide the water source, available analysis, TDS, hardness, pressure and temperature.'],
        ['Demand profile', 'Provide daily demand, peak flow, operating hours and required product-water quality.'],
        ['Site and compliance', 'Confirm power, installation space, pretreatment, destination market and documentation requirements.'],
      ],
    },
    es: {
      title: 'Información Necesaria Antes de Seleccionar un Sistema RO Comercial',
      intro: 'La selección debe comenzar con datos del proyecto; la capacidad nominal por sí sola no basta.',
      items: [
        ['Agua de alimentación', 'Indique la fuente, análisis disponible, TDS, dureza, presión y temperatura.'],
        ['Perfil de demanda', 'Indique demanda diaria, caudal máximo, horas de operación y calidad requerida.'],
        ['Sitio y cumplimiento', 'Confirme energía, espacio, pretratamiento, mercado y documentos necesarios.'],
      ],
    },
  },
  'commercial-ultrafiltration-water-purification-systems': {
    en: {
      title: 'How to Specify a Commercial Ultrafiltration System',
      intro: 'Select a configuration from verified project requirements. Filter count alone does not determine whether a system fits the site.',
      items: [
        ['Flow and demand', 'Match the model-specific rated flow to peak demand, operating hours and simultaneous points of use.'],
        ['Treatment train', 'Compare the documented filter stages and confirm whether the project requires UF only or a model with UV treatment.'],
        ['Feed water and service', 'Confirm municipal feed-water conditions, installation space, cartridge supply and planned maintenance intervals.'],
      ],
    },
    es: {
      title: 'Cómo Especificar un Sistema Comercial de Ultrafiltración',
      intro: 'Seleccione la configuración a partir de requisitos verificados; el número de etapas por sí solo no determina la idoneidad.',
      items: [
        ['Caudal y demanda', 'Compare el caudal nominal del modelo con la demanda máxima, las horas de uso y los puntos simultáneos.'],
        ['Tren de tratamiento', 'Revise las etapas documentadas y confirme si el proyecto requiere solo UF o un modelo con tratamiento UV.'],
        ['Agua y mantenimiento', 'Confirme el agua municipal, el espacio, el suministro de cartuchos y el mantenimiento previsto.'],
      ],
    },
  },
} as const;

export function CategoryBuyerGuide({ slug, locale = 'en' }: { slug: string; locale?: Locale }) {
  const guide = GUIDES[slug as keyof typeof GUIDES]?.[locale];
  if (!guide) return null;

  return (
    <section className="mt-10 overflow-hidden rounded-2xl border border-grey-200 bg-white">
      <div className="h-1 bg-gradient-to-r from-water-500 via-water-300 to-transparent" />
      <div className="mx-auto max-w-6xl px-6 py-8 sm:px-10 sm:py-10">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-water-600">
            {locale === 'es' ? 'Guía para compradores' : 'Buyer guide'}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-navy-950">{guide.title}</h2>
          <p className="mt-3 text-sm leading-6 text-grey-500 sm:text-base">{guide.intro}</p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {guide.items.map(([title, description], index) => (
            <article
              key={title}
              className="relative rounded-xl border border-grey-200 bg-grey-50/60 px-5 pb-5 pt-6 transition-colors hover:border-water-200 hover:bg-water-50/50 sm:px-6"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-water-100 text-xs font-bold text-water-700">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-4 text-base font-semibold leading-6 text-navy-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-grey-500">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
