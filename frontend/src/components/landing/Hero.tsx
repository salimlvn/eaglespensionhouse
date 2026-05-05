function Hero() {
  return (
    <section className="overflow-hidden bg-[linear-gradient(135deg,#eaf4ff_0%,#d8ebff_45%,#f8fbff_100%)]">
      <div className="mx-auto flex min-h-[68vh] max-w-7xl items-center justify-center px-4 py-12 sm:px-6 sm:py-15">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#2a6bc7]">
            Reserve Your Stay
          </p>
          <h1 className="font-heading mt-4 text-4xl font-bold leading-[0.95] text-[#163d73] sm:text-5xl md:text-6xl lg:text-7xl">
            Affordable Comfort
            <br />
            Everyday Living
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8 md:text-xl">
            Reserve a clean, practical stay in Eagle's with easy access, welcoming shared spaces, and rates built
            for students, travelers, and working individuals.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a
              href="#rooms"
              className="inline-flex w-full items-center justify-center rounded-full bg-[#163d73] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#0f3058] sm:w-auto"
            >
              Reserve Now
            </a>
            <a
              href="#rates"
              className="inline-flex w-full items-center justify-center rounded-full bg-[#163d73] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#0f3058] sm:w-auto"
            >
              View Rates
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
