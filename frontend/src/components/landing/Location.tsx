function Location() {
  return (
    <section className="py-15" id="location">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <h2 className="font-heading mt-3 text-4xl font-semibold text-[#163d73] md:text-5xl">Location</h2>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-8 text-slate-600 md:text-lg">
            Eagle's Pension House is located at the Grand Arcade Building, corner Plaridel Street and A.C. Cortes
            Avenue, Mandaue City, Cebu.
          </p>
        </div>

        <div className="mt-10 overflow-hidden rounded-4xl border border-[#dfeafb] bg-white p-3 shadow-[0_18px_40px_rgba(23,61,115,0.08)] md:p-4">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d981.2854784645239!2d123.94660178135449!3d10.330525999999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33a9984b5a414f29%3A0xb43f41b8f130ada7!2sGrand%20Arcade%20Building!5e0!3m2!1sen!2sph!4v1777623882206!5m2!1sen!2sph"
            width="600"
            height="450"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Grand Arcade Building location"
            className="h-80 w-full rounded-3xl md:h-115"
          />
        </div>
      </div>
    </section>
  );
}

export default Location;
