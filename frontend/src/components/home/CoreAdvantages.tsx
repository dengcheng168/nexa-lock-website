import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import type { CoreAdvantage } from '@/types/settings';
import type { Locale } from '@/lib/i18n/locales';
import { t } from '@/lib/i18n/site-strings';
import { KeyRound, PackageCheck, Ruler } from 'lucide-react';

const advantageIcons = [KeyRound, Ruler, PackageCheck];
const advantageOffsets = ['lg:mr-12', 'lg:ml-12', 'lg:mr-12'];

export function CoreAdvantages({ items, locale = 'en' }: { items: CoreAdvantage[]; locale?: Locale }) {
  if (items.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-[#f5f8fc] py-24">
      <div className="pointer-events-none absolute -left-40 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-water-500/[0.05]" />
      <Container>
        <div className="relative grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:gap-20">
          <div>
            <SectionHeading eyebrow={t(locale, 'sectionCoreAdvantagesEyebrow')} title={t(locale, 'sectionCoreAdvantagesTitle')} align="left" />
            <p className="mt-5 max-w-md leading-7 text-grey-500">A dependable lock starts with the door, the people using it and the way access is managed.</p>
            <div className="mt-9 h-1 w-16 bg-water-500" />
          </div>
          <div className="relative space-y-4">
            <div className="absolute bottom-10 left-7 top-10 w-px bg-water-500/20 sm:left-9" />
            {items.map((item, i) => {
              const Icon = advantageIcons[i % advantageIcons.length];
              return (
              <div
                key={item.title}
                className={`group relative grid gap-5 border border-navy-950/[0.07] bg-white px-5 py-6 shadow-[0_14px_40px_rgba(12,45,78,0.07)] transition-transform hover:-translate-y-0.5 sm:grid-cols-[56px_1fr_auto] sm:items-center sm:px-7 ${advantageOffsets[i % advantageOffsets.length]}`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="relative z-10 flex h-14 w-14 items-center justify-center border border-water-500/20 bg-[#edf5ff] text-water-600 transition-colors group-hover:bg-water-500 group-hover:text-white">
                  <Icon className="h-6 w-6" strokeWidth={1.7} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-navy-950">{item.title}</h3>
                  {item.description && <p className="mt-2 max-w-xl text-sm leading-6 text-grey-500">{item.description}</p>}
                </div>
                <span className="hidden text-xs font-semibold tracking-[0.14em] text-water-600/60 sm:block">0{i + 1}</span>
              </div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
