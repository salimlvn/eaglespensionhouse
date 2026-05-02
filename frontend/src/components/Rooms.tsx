import { rooms } from "../data/rooms";

function Rooms() {
  return (
    <section className="py-1" id="rooms">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#2a6bc7]">Our Spaces</p>
          <h2 className="font-heading mt-3 text-4xl font-semibold text-[#163d73] md:text-5xl">
            Rooms and Shared Areas
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          {rooms.map((room) => (
            <article
              key={room.name}
              className="group overflow-hidden rounded-[1.25rem] border border-[#dfeafb] bg-white shadow-[0_14px_28px_rgba(23,61,115,0.08)]"
            >
              <img
                src={room.image}
                alt={room.name}
                className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105 lg:aspect-4/3"
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Rooms;
