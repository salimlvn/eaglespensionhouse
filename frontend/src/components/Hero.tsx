function Hero() {
  return (
    <section className="bg-[linear-gradient(135deg,#eaf4ff_0%,#d8ebff_45%,#f8fbff_100%)]">
      <div className="mx-auto flex min-h-[68vh] max-w-7xl items-center px-6 py-15">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#2a6bc7]">
            Reserve Your Stay
          </p>
          <h1 className="font-heading mt-4 text-5xl font-bold leading-[0.95] text-[#163d73] md:text-7xl">
            Affordable Comfort
            <br />
            Everyday Living
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 md:text-xl">
            Reserve a clean, practical stay in Eagle's with easy access, welcoming shared spaces, and rates built
            for students, travelers, and working individuals.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <a
              href="#"
              className="inline-flex items-center justify-center rounded-full  border-[#163d73]/20 bg-white/80 px-7 py-3 text-sm font-semibold text-[#163d73] transition hover:border-[#163d73] hover:bg-white"
            >
              Reserve Now
            </a>
            <a
              className="inline-flex items-center justify-center rounded-full border border-[#163d73]/20 bg-white/80 px-7 py-3 text-sm font-semibold text-[#163d73] transition hover:border-[#163d73] hover:bg-white"
            >
              View Rooms
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
