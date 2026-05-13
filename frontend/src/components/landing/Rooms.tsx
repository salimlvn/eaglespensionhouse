import { useState } from 'react';
import { rooms } from '../../data/rooms';

// Gallery section for rooms and shared spaces.
function Rooms() {
  // Track the selected room so hover, focus, and click all show the same active state.
  const [activeRoomTitle, setActiveRoomTitle] = useState(rooms[0]?.title ?? '');
  const activeRoom = rooms.find((room) => room.title === activeRoomTitle) ?? rooms[0];

  return (
    <section className="py-15" id="rooms">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <h2 className="font-heading mt-3 text-4xl font-semibold text-[#163d73] md:text-5xl">
            Shared Areas
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {rooms.map((room) => (
            <button
              type="button"
              key={room.title}
              onClick={() => setActiveRoomTitle(room.title)}
              onMouseEnter={() => setActiveRoomTitle(room.title)}
              onFocus={() => setActiveRoomTitle(room.title)}
              aria-pressed={activeRoom.title === room.title}
              className={`group overflow-hidden rounded-[1.25rem] border bg-white text-left shadow-[0_18px_40px_rgba(22,61,115,0.08)] transition sm:cursor-pointer sm:hover:-translate-y-1 sm:hover:shadow-[0_24px_50px_rgba(22,61,115,0.16)] sm:focus-visible:-translate-y-1 sm:focus-visible:outline-none sm:focus-visible:ring-4 sm:focus-visible:ring-[#bfd8fb] sm:rounded-[1.5rem] lg:rounded-[1.75rem] ${
                activeRoom.title === room.title ? 'border-[#7aaae8] sm:ring-2 sm:ring-[#bfd8fb]' : 'border-[#d9e7fa]'
              }`}
            >
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={room.image}
                  alt={room.title}
                  className="h-full w-full object-cover transition duration-500 sm:group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,rgba(11,53,101,0)_0%,rgba(11,53,101,0.88)_100%)] p-2 sm:p-3 lg:p-4">
                  <h3 className="font-heading text-[11px] font-semibold leading-tight text-white sm:text-sm lg:text-xl">
                    {room.title}
                  </h3>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Rooms;
