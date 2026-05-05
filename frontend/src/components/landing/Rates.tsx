import { useState } from 'react';
import { rates } from '../../data/rates';

function Rates() {
  const [activeRateId, setActiveRateId] = useState(rates[0]?.id ?? '');
  const activeRate = rates.find((rate) => rate.id === activeRateId) ?? rates[0];

  return (
    <section className="py-10 sm:py-12" id="rates">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <h2 className="font-heading text-[2.2rem] font-semibold text-[#163d73] md:text-[3.1rem]">Rates</h2>
          <p className="mx-auto mt-3 max-w-4xl text-[0.95rem] leading-7 text-slate-600 md:text-[1.45rem] md:leading-[1.35]">
            Choose between our non-aircon or aircon rooms.
          </p>
        </div>

        <div
          className="mt-7 grid gap-3 rounded-[2rem] md:grid-cols-2"
          role="tablist"
          aria-label="Room rate categories"
        >
          {rates.map((rate) => {
            const isActive = rate.id === activeRate.id;

            return (
              <button
                key={rate.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`rate-panel-${rate.id}`}
                id={`rate-tab-${rate.id}`}
                onClick={() => setActiveRateId(rate.id)}
                className={`rounded-full border px-5 py-3 text-[0.95rem] font-medium transition sm:cursor-pointer sm:hover:-translate-y-0.5 sm:focus-visible:outline-none sm:focus-visible:ring-4 sm:focus-visible:ring-[#bfd8fb] ${
                  isActive
                    ? 'border-[#163d73] bg-[#204b85] text-white shadow-[0_18px_35px_rgba(32,75,133,0.22)]'
                    : 'border-[#cdddf3] bg-white text-[#163d73] shadow-[0_10px_24px_rgba(22,61,115,0.08)]'
                }`}
              >
                {rate.label}
              </button>
            );
          })}
        </div>

        <article
          id={`rate-panel-${activeRate.id}`}
          role="tabpanel"
          aria-labelledby={`rate-tab-${activeRate.id}`}
          className="mt-5 rounded-[1.8rem] border border-[#d6e4f8] bg-white px-5 py-6 shadow-[0_24px_60px_rgba(22,61,115,0.1)] sm:px-7 sm:py-8 lg:px-9 lg:py-9"
        >
          <h3 className="font-heading text-[1.8rem] leading-tight font-semibold text-[#184a8b] sm:text-[2.45rem]">
            {activeRate.title}
          </h3>
          <div className="mt-5 space-y-3.5">
            {activeRate.lines.map((line) => (
              <div
                key={line}
                className="rounded-[1.1rem] bg-[#edf3fe] px-4 py-3.5 text-[0.95rem] font-semibold text-[#1d56a1] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] sm:px-5 sm:text-[1.25rem]"
              >
                {line}
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}

export default Rates;
