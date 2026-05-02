import { features } from '../data/features';

const carouselItems = [...features, ...features];

function Features() {
  return (
    <section className="bg-white py-15">
      <div className="w-full overflow-hidden border-y border-[#ddeafb] bg-white shadow-[0_18px_45px_rgba(23,61,115,0.08)]">
        <div className="feature-carousel-track">
          {carouselItems.map((feature, index) => (
            <article
              key={`${feature.title}-${index}`}
              aria-hidden={index >= features.length}
              className="flex min-h-65 w-70 shrink-0 flex-col justify-center border-r border-[#e8f0fb] px-7 py-10 text-center"
            >
              <div className="mx-auto h-2 w-14 rounded-full bg-[linear-gradient(90deg,#2e74db,#77aef3)]" />
              <h3 className="font-heading mt-5 text-2xl font-semibold text-[#163d73]">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-500">{feature.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;
