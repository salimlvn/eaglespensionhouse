import { useEffect, useMemo, useState, type FormEvent } from 'react';
import logoImage from '../../assets/images/eaglesnest.jpg';
import type { StaffSession } from '../../data/staffAuth';
import {
  ROOM_STATUSES,
  ROOM_TYPES,
  ROOM_NUMBER_OPTIONS_BY_TYPE,
  createRoom,
  deleteRoom,
  getRoomNumberOptions,
  getRooms,
  updateRoom,
  type StaffRoom,
  type RoomPayload,
  type RoomStatus,
  type RoomType,
} from '../../data/staffRooms';

type StaffDashboardProps = {
  session: StaffSession;
  onLogout: () => void;
};

type StaffPanel = 'add-room' | 'room-inventory';

type MenuGroup = {
  title: string;
  panel?: StaffPanel;
  items: {
    label: string;
    panel: StaffPanel;
  }[];
};

type RoomFormState = {
  roomNumber: string;
  roomType: RoomType;
  status: RoomStatus;
};

// Default values used when opening or resetting the room form.
const emptyRoomForm: RoomFormState = {
  roomNumber: '',
  roomType: 'Aircon',
  status: 'Available',
};

// Sidebar navigation is kept data-driven so hidden sections can be restored later.
const menuGroups: MenuGroup[] = [
  {
    title: 'Rooms',
    items: [
      { label: 'Add Room', panel: 'add-room' },
      { label: 'Room Inventory', panel: 'room-inventory' },
    ],
  },
];

// Staff room management screen.
function StaffDashboard({ session, onLogout }: StaffDashboardProps) {
  // Track which staff panel is visible.
  const [activePanel, setActivePanel] = useState<StaffPanel>('room-inventory');
  const [openGroups, setOpenGroups] = useState(() => new Set(['Rooms']));

  // Room records and form state.
  const [rooms, setRooms] = useState<StaffRoom[]>([]);
  const [roomNumberOptions, setRoomNumberOptions] = useState<string[]>([]);
  const [roomForm, setRoomForm] = useState<RoomFormState>(emptyRoomForm);
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);

  // UI status messages for loading, saving, and request errors.
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isSavingRoom, setIsSavingRoom] = useState(false);
  const [roomError, setRoomError] = useState('');
  const [roomMessage, setRoomMessage] = useState('');

  // Load room records and allowed room numbers together on first render.
  useEffect(() => {
    let isMounted = true;

    async function loadRoomData() {
      setIsLoadingRooms(true);
      setRoomError('');

      try {
        const [nextRooms, nextRoomNumbers] = await Promise.all([getRooms(), getRoomNumberOptions()]);

        if (isMounted) {
          setRooms(nextRooms);
          setRoomNumberOptions(nextRoomNumbers);
        }
      } catch (error) {
        if (isMounted) {
          setRoomError(error instanceof Error ? error.message : 'Unable to load room data.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingRooms(false);
        }
      }
    }

    loadRoomData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Display the current date in the staff header.
  const updatedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(new Date());

  // Only show room numbers that match the selected type and are not already used.
  const availableRoomNumbers = useMemo(() => {
    const validRoomNumbers = new Set(ROOM_NUMBER_OPTIONS_BY_TYPE[roomForm.roomType]);
    const usedRoomNumbers = new Set(rooms.map((room) => room.roomNumber));
    const editingRoom = rooms.find((room) => room.roomId === editingRoomId);

    return roomNumberOptions.filter((roomNumber) => {
      const isCurrentEditingRoom = roomNumber === editingRoom?.roomNumber;

      return validRoomNumbers.has(roomNumber) && (isCurrentEditingRoom || !usedRoomNumbers.has(roomNumber));
    });
  }, [editingRoomId, roomForm.roomType, roomNumberOptions, rooms]);

  // Open or close sidebar groups, or activate a direct panel link.
  const handleGroupToggle = (group: MenuGroup) => {
    if (group.panel) {
      setActivePanel(group.panel);
      return;
    }

    setOpenGroups((currentGroups) => {
      const nextGroups = new Set(currentGroups);

      if (nextGroups.has(group.title)) {
        nextGroups.delete(group.title);
      } else {
        nextGroups.add(group.title);
      }

      return nextGroups;
    });
  };

  // Create or update a room, then sync the local table without a full reload.
  const handleRoomSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingRoom(true);
    setRoomError('');
    setRoomMessage('');

    const payload: RoomPayload = {
      roomNumber: roomForm.roomNumber,
      roomType: roomForm.roomType,
      status: roomForm.status,
    };

    try {
      const savedRoom = editingRoomId ? await updateRoom(editingRoomId, payload) : await createRoom(payload);

      setRooms((currentRooms) => {
        if (!editingRoomId) {
          return [savedRoom, ...currentRooms];
        }

        return currentRooms.map((room) => (room.roomId === savedRoom.roomId ? savedRoom : room));
      });
      setRoomForm(emptyRoomForm);
      setEditingRoomId(null);
      setRoomMessage(editingRoomId ? 'Room updated successfully.' : 'Room added successfully.');
    } catch (error) {
      setRoomError(error instanceof Error ? error.message : 'Unable to save room.');
    } finally {
      setIsSavingRoom(false);
    }
  };

  // Move an existing room into the form for editing.
  const handleEditRoom = (room: StaffRoom) => {
    setRoomForm({
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      status: room.status,
    });
    setEditingRoomId(room.roomId);
    setActivePanel('add-room');
    setRoomError('');
    setRoomMessage('');
  };

  // Confirm and remove a room from the backend and local state.
  const handleDeleteRoom = async (room: StaffRoom) => {
    const confirmed = window.confirm(`Delete room ${room.roomNumber}?`);

    if (!confirmed) {
      return;
    }

    setRoomError('');
    setRoomMessage('');

    try {
      await deleteRoom(room.roomId);
      setRooms((currentRooms) => currentRooms.filter((currentRoom) => currentRoom.roomId !== room.roomId));

      if (editingRoomId === room.roomId) {
        setEditingRoomId(null);
        setRoomForm(emptyRoomForm);
      }

      setRoomMessage('Room deleted successfully.');
    } catch (error) {
      setRoomError(error instanceof Error ? error.message : 'Unable to delete room.');
    }
  };

  // Return the form to its blank create-room state.
  const resetRoomForm = () => {
    setRoomForm(emptyRoomForm);
    setEditingRoomId(null);
    setRoomError('');
    setRoomMessage('');
  };

  return (
    <main className="min-h-screen bg-[#eef4f8] text-[#082f57]">
      <div className="flex min-h-screen">
        {/* Desktop sidebar navigation. */}
        <aside className="fixed inset-y-0 left-0 hidden w-[340px] flex-col bg-[#123754] text-white lg:flex">
          <div className="px-8 py-8">
            <a href="#/staff/dashboard" className="flex items-center gap-3" onClick={() => setActivePanel('room-inventory')}>
              <img
                src={logoImage}
                alt="Eagle's Pension House logo"
                className="h-12 w-12 rounded-full border border-white/20 object-cover"
              />
              <div>
                <p className="text-2xl font-bold">Eagle&apos;s Pension</p>
                <p className="mt-2 text-sm text-blue-100">Staff Control Center</p>
              </div>
            </a>
          </div>

          <nav className="flex-1 overflow-y-auto px-5 pb-6">
            <div className="border-t border-white/10 pt-6">
              {menuGroups.map((group, index) => {
                const isOpen = group.items.length > 0 && openGroups.has(group.title);
                const isGroupActive =
                  activePanel === group.panel || group.items.some((item) => item.panel === activePanel);

                return (
                  <div key={group.title} className={index > 0 ? 'mt-6' : ''}>
                    <button
                      type="button"
                      onClick={() => handleGroupToggle(group)}
                      className={`group flex min-h-14 w-full items-center justify-between rounded-lg border px-5 py-4 text-left text-base font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${
                        isGroupActive
                          ? 'border-white/10 bg-white/15 text-white shadow-[0_12px_30px_rgba(0,0,0,0.12)]'
                          : 'border-transparent text-blue-50'
                      }`}
                      aria-expanded={group.items.length ? isOpen : undefined}
                    >
                      <span>{group.title}</span>
                      {group.items.length ? (
                        <span
                          className={`grid h-7 w-7 place-items-center rounded-md border text-lg leading-none transition ${
                            isOpen
                              ? 'border-white/15 bg-white/15'
                              : 'border-white/10 bg-white/5'
                          }`}
                        >
                          {isOpen ? '-' : '+'}
                        </span>
                      ) : null}
                    </button>

                    {isOpen ? (
                      <div className="mt-3 space-y-2">
                        {group.items.map((item) => (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => setActivePanel(item.panel)}
                            className={`block min-h-12 w-full rounded-lg border px-5 py-3 text-left text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${
                              activePanel === item.panel
                                ? 'border-white/10 bg-white/15 text-white shadow-[0_10px_24px_rgba(0,0,0,0.1)]'
                                : 'border-transparent text-blue-100'
                            }`}
                          >
                            <span className="block pl-4">{item.label}</span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </nav>

          <div className="border-t border-white/10 p-6">
            <button
              type="button"
              onClick={onLogout}
              className="w-full rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-white transition"
            >
              Log out
            </button>
          </div>
        </aside>

        <section className="min-w-0 flex-1 lg:pl-[340px]">
          {/* Compact mobile header and panel switcher. */}
          <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 px-4 py-4 backdrop-blur lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <button type="button" onClick={() => setActivePanel('room-inventory')} className="flex min-w-0 items-center gap-3">
                <img
                  src={logoImage}
                  alt="Eagle's Pension House logo"
                  className="h-10 w-10 rounded-full border border-slate-200 object-cover"
                />
                <span className="min-w-0 text-left">
                  <span className="block truncate text-lg font-bold text-[#123754]">Eagle&apos;s Pension</span>
                  <span className="block truncate text-xs uppercase tracking-[0.18em] text-slate-500">
                    Staff Control Center
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="shrink-0 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Log out
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {[
                { label: 'Add Room', panel: 'add-room' as const },
                { label: 'Inventory', panel: 'room-inventory' as const },
              ].map((item) => (
                <button
                  key={item.panel}
                  type="button"
                  onClick={() => setActivePanel(item.panel)}
                  className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                    activePanel === item.panel
                      ? 'bg-[#123754] text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </header>

          <div className="mx-auto max-w-[1520px] px-4 py-6 sm:px-6 lg:px-12 lg:py-10">
            {/* Main page heading and last-updated date. */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#6d86a8]">
                  Signed in as {session.name}
                </p>
                <h1 className="mt-2 text-4xl font-bold leading-tight text-[#082f57] sm:text-5xl">
                  {activePanel === 'add-room' ? 'Add Room' : 'Room Inventory'}
                </h1>
                <p className="mt-3 text-base text-[#6d86a8]">Manage room setup and availability</p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white px-8 py-5 text-right shadow-[0_18px_50px_rgba(8,47,87,0.08)]">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6d86a8]">Updated</p>
                <p className="mt-3 text-lg font-bold text-[#082f57]">{updatedDate}</p>
              </div>
            </div>

            {/* Add/edit room form panel. */}
            {activePanel === 'add-room' ? (
              <section className="mt-8 w-full">
                <article className="rounded-lg border border-[#d7e2ee] bg-white p-6 shadow-[0_18px_50px_rgba(8,47,87,0.07)] sm:p-8">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <h2 className="text-2xl font-semibold text-[#082f57]">
                      {editingRoomId ? 'Edit Room' : 'Add Room'}
                    </h2>
                    {editingRoomId ? (
                      <button
                        type="button"
                        onClick={resetRoomForm}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition"
                      >
                        Cancel
                      </button>
                    ) : null}
                  </div>

                  <form onSubmit={handleRoomSubmit} className="mt-7 space-y-6">
                    <div className="grid gap-5 lg:grid-cols-3">
                      <label className="block text-sm font-semibold text-[#1b426c]">
                        Room Type
                        <select
                          value={roomForm.roomType}
                          onChange={(event) =>
                            setRoomForm((form) => ({
                              ...form,
                              roomNumber: '',
                              roomType: event.target.value as RoomType,
                            }))
                          }
                          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[#2a6bc7] focus:ring-3 focus:ring-[#bfd8fb]/70"
                        >
                          {ROOM_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block text-sm font-semibold text-[#1b426c]">
                        Room Number
                        <select
                          value={roomForm.roomNumber}
                          onChange={(event) => setRoomForm((form) => ({ ...form, roomNumber: event.target.value }))}
                          required
                          disabled={isLoadingRooms}
                          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[#2a6bc7] focus:ring-3 focus:ring-[#bfd8fb]/70 disabled:bg-slate-100"
                        >
                          <option value="">{isLoadingRooms ? 'Loading room numbers...' : 'Select room number'}</option>
                          {availableRoomNumbers.map((roomNumber) => (
                            <option key={roomNumber} value={roomNumber}>
                              {roomNumber}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block text-sm font-semibold text-[#1b426c]">
                        Status
                        <select
                          value={roomForm.status}
                          onChange={(event) => setRoomForm((form) => ({ ...form, status: event.target.value as RoomStatus }))}
                          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[#2a6bc7] focus:ring-3 focus:ring-[#bfd8fb]/70"
                        >
                          {ROOM_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    {!isLoadingRooms && availableRoomNumbers.length === 0 ? (
                      <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                        All SQL room numbers have already been added to inventory.
                      </p>
                    ) : null}
                    {roomError ? <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{roomError}</p> : null}
                    {roomMessage ? <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{roomMessage}</p> : null}

                    <button
                      type="submit"
                      disabled={isSavingRoom || isLoadingRooms || availableRoomNumbers.length === 0}
                      className="w-full rounded-lg bg-[#123754] px-5 py-3 text-sm font-bold text-white transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#bfd8fb] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isSavingRoom ? 'Saving...' : editingRoomId ? 'Update Room' : 'Add Room'}
                    </button>
                  </form>
                </article>
              </section>
            ) : null}

            {/* Room inventory table panel. */}
            {activePanel === 'room-inventory' ? (
              <section className="mt-8">
                {roomError ? <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{roomError}</p> : null}
                {roomMessage ? <p className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{roomMessage}</p> : null}
                <RoomInventoryTable
                  rooms={rooms}
                  isLoading={isLoadingRooms}
                  onEditRoom={handleEditRoom}
                  onDeleteRoom={handleDeleteRoom}
                />
              </section>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

type RoomInventoryTableProps = {
  rooms: StaffRoom[];
  isLoading: boolean;
  onEditRoom: (room: StaffRoom) => void;
  onDeleteRoom: (room: StaffRoom) => void;
};

// Table for room inventory, loading state, empty state, and row actions.
function RoomInventoryTable({ rooms, isLoading, onEditRoom, onDeleteRoom }: RoomInventoryTableProps) {
  return (
    <article className="rounded-lg border border-[#d7e2ee] bg-white p-6 shadow-[0_18px_50px_rgba(8,47,87,0.07)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[#082f57]">Room Inventory</h2>
          <p className="mt-2 text-sm font-semibold text-[#6d86a8]">{rooms.length} room records from SQL</p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-left">
          <thead>
            <tr className="bg-[#f4f8fc] text-xs font-bold uppercase tracking-[0.12em] text-[#285783]">
              <th className="px-4 py-4">Room Number</th>
              <th className="px-4 py-4">Type</th>
              <th className="px-4 py-4">Status</th>
              <th className="px-4 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr className="border-b border-slate-100 text-sm text-slate-600">
                <td className="px-4 py-5 font-semibold text-[#082f57]" colSpan={4}>
                  Loading rooms...
                </td>
              </tr>
            ) : null}

            {!isLoading && rooms.length === 0 ? (
              <tr className="border-b border-slate-100 text-sm text-slate-600">
                <td className="px-4 py-5 font-semibold text-[#082f57]" colSpan={4}>
                  No rooms added yet
                </td>
              </tr>
            ) : null}

            {!isLoading
              ? rooms.map((room) => (
                  <tr key={room.roomId} className="border-b border-slate-100 text-sm text-slate-600">
                    <td className="px-4 py-5 font-semibold text-[#082f57]">{room.roomNumber}</td>
                    <td className="px-4 py-5">{room.roomType}</td>
                    <td className="px-4 py-5">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {room.status}
                      </span>
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onEditRoom(room)}
                          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 transition"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteRoom(room)}
                          className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </div>
    </article>
  );
}

export default StaffDashboard;
