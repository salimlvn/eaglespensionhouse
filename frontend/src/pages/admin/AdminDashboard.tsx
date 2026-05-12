import { useEffect, useMemo, useState, type FormEvent } from 'react';
import logoImage from '../../assets/images/eaglesnest.jpg';
import type { AdminSession } from '../../data/adminAuth';
import {
  ROOM_STATUSES,
  ROOM_TYPES,
  ROOM_NUMBER_OPTIONS_BY_TYPE,
  createRoom,
  deleteRoom,
  getRoomNumberOptions,
  getRooms,
  updateRoom,
  type AdminRoom,
  type RoomPayload,
  type RoomStatus,
  type RoomType,
} from '../../data/adminRooms';

type AdminDashboardProps = {
  session: AdminSession;
  onLogout: () => void;
};

type AdminPanel = 'dashboard' | 'add-room' | 'room-inventory';

type MenuGroup = {
  title: string;
  panel?: AdminPanel;
  items: {
    label: string;
    panel: AdminPanel;
  }[];
};

type RoomFormState = {
  roomNumber: string;
  roomType: RoomType;
  status: RoomStatus;
};

const emptyRoomForm: RoomFormState = {
  roomNumber: '',
  roomType: 'Aircon',
  status: 'Available',
};

const menuGroups: MenuGroup[] = [
  { title: 'Dashboard', panel: 'dashboard', items: [] },
  {
    title: 'Rooms',
    items: [
      { label: 'Add Room', panel: 'add-room' },
      { label: 'Room Inventory', panel: 'room-inventory' },
    ],
  },
  {
    title: 'Reports',
    items: [
      { label: 'Revenue Report', panel: 'dashboard' },
      { label: 'Booking Summary', panel: 'dashboard' },
      { label: 'Room Occupancy', panel: 'dashboard' },
    ],
  },
  {
    title: 'Staff Tools',
    items: [
      { label: 'Register Staff', panel: 'dashboard' },
      { label: 'Account Credentials', panel: 'dashboard' },
      { label: 'Staff Accounts', panel: 'dashboard' },
    ],
  },
];

const statusColors: Record<RoomStatus, string> = {
  Available: 'bg-emerald-500',
  Maintenance: 'bg-red-500',
};

function AdminDashboard({ session, onLogout }: AdminDashboardProps) {
  const [activePanel, setActivePanel] = useState<AdminPanel>('dashboard');
  const [openGroups, setOpenGroups] = useState(() => new Set(['Rooms']));
  const [rooms, setRooms] = useState<AdminRoom[]>([]);
  const [roomNumberOptions, setRoomNumberOptions] = useState<string[]>([]);
  const [roomForm, setRoomForm] = useState<RoomFormState>(emptyRoomForm);
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isSavingRoom, setIsSavingRoom] = useState(false);
  const [roomError, setRoomError] = useState('');
  const [roomMessage, setRoomMessage] = useState('');

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

  const updatedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(new Date());

  const roomCounts = useMemo(() => {
    return ROOM_STATUSES.reduce(
      (counts, status) => ({
        ...counts,
        [status]: rooms.filter((room) => room.status === status).length,
      }),
      {} as Record<RoomStatus, number>,
    );
  }, [rooms]);

  const availableRoomNumbers = useMemo(() => {
    const validRoomNumbers = new Set(ROOM_NUMBER_OPTIONS_BY_TYPE[roomForm.roomType]);
    const usedRoomNumbers = new Set(rooms.map((room) => room.roomNumber));
    const editingRoom = rooms.find((room) => room.roomId === editingRoomId);

    return roomNumberOptions.filter((roomNumber) => {
      const isCurrentEditingRoom = roomNumber === editingRoom?.roomNumber;

      return validRoomNumbers.has(roomNumber) && (isCurrentEditingRoom || !usedRoomNumbers.has(roomNumber));
    });
  }, [editingRoomId, roomForm.roomType, roomNumberOptions, rooms]);

  useEffect(() => {
    if (!roomForm.roomNumber) {
      return;
    }

    if (!ROOM_NUMBER_OPTIONS_BY_TYPE[roomForm.roomType].includes(roomForm.roomNumber)) {
      setRoomForm((form) => ({ ...form, roomNumber: '' }));
    }
  }, [roomForm.roomNumber, roomForm.roomType]);

  const summaryCards = [
    {
      label: 'Available Rooms',
      value: String(roomCounts.Available || 0),
      helper: `${roomNumberOptions.length} room numbers from SQL`,
      icon: 'ROOM',
    },
    { label: "Today's Check-ins", value: '0', helper: '0 upcoming arrivals', icon: 'IN' },
    { label: 'Total Guests', value: '0', helper: 'Checked in right now', icon: 'GUEST' },
    { label: 'Revenue', value: 'PHP 0', helper: 'Total from approved reservations', icon: 'PHP' },
  ];

  const roomStatuses = ROOM_STATUSES.map((status) => ({
    label: status,
    value: String(roomCounts[status] || 0),
    color: statusColors[status],
  }));

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

  const handleEditRoom = (room: AdminRoom) => {
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

  const handleDeleteRoom = async (room: AdminRoom) => {
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

  const resetRoomForm = () => {
    setRoomForm(emptyRoomForm);
    setEditingRoomId(null);
    setRoomError('');
    setRoomMessage('');
  };

  return (
    <main className="min-h-screen bg-[#eef4f8] text-[#082f57]">
      <div className="flex min-h-screen">
        <aside className="fixed inset-y-0 left-0 hidden w-[340px] flex-col bg-[#123754] text-white lg:flex">
          <div className="px-8 py-8">
            <a href="#/admin/dashboard" className="flex items-center gap-3" onClick={() => setActivePanel('dashboard')}>
              <img
                src={logoImage}
                alt="Eagle's Pension House logo"
                className="h-12 w-12 rounded-full border border-white/20 object-cover"
              />
              <div>
                <p className="text-2xl font-bold">Eagle&apos;s Pension</p>
                <p className="mt-2 text-sm text-blue-100">Admin Control Center</p>
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
                          : 'border-transparent text-blue-50 hover:border-white/10 hover:bg-white/10 hover:text-white'
                      }`}
                      aria-expanded={group.items.length ? isOpen : undefined}
                    >
                      <span>{group.title}</span>
                      {group.items.length ? (
                        <span
                          className={`grid h-7 w-7 place-items-center rounded-md border text-lg leading-none transition ${
                            isOpen
                              ? 'border-white/15 bg-white/15'
                              : 'border-white/10 bg-white/5 group-hover:bg-white/15'
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
                                : 'border-transparent text-blue-100 hover:border-white/10 hover:bg-white/10 hover:text-white'
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
              className="w-full rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Log out
            </button>
          </div>
        </aside>

        <section className="min-w-0 flex-1 lg:pl-[340px]">
          <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 px-4 py-4 backdrop-blur lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <button type="button" onClick={() => setActivePanel('dashboard')} className="flex min-w-0 items-center gap-3">
                <img
                  src={logoImage}
                  alt="Eagle's Pension House logo"
                  className="h-10 w-10 rounded-full border border-slate-200 object-cover"
                />
                <span className="min-w-0 text-left">
                  <span className="block truncate text-lg font-bold text-[#123754]">Eagle&apos;s Pension</span>
                  <span className="block truncate text-xs uppercase tracking-[0.18em] text-slate-500">
                    Admin Dashboard
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
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { label: 'Dashboard', panel: 'dashboard' as const },
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
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </header>

          <div className="mx-auto max-w-[1520px] px-4 py-6 sm:px-6 lg:px-12 lg:py-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#6d86a8]">
                  Signed in as {session.name}
                </p>
                <h1 className="mt-2 text-4xl font-bold leading-tight text-[#082f57] sm:text-5xl">
                  {activePanel === 'dashboard' ? 'Dashboard' : activePanel === 'add-room' ? 'Add Room' : 'Room Inventory'}
                </h1>
                <p className="mt-3 text-base text-[#6d86a8]">Overview of your pension house operations</p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white px-8 py-5 text-right shadow-[0_18px_50px_rgba(8,47,87,0.08)]">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6d86a8]">Updated</p>
                <p className="mt-3 text-lg font-bold text-[#082f57]">{updatedDate}</p>
              </div>
            </div>

            {activePanel === 'dashboard' ? (
              <>
                <section className="mt-8 grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
                  {summaryCards.map((card) => (
                    <article
                      key={card.label}
                      className="rounded-lg border border-[#d7e2ee] bg-white p-6 shadow-[0_18px_50px_rgba(8,47,87,0.07)]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#6d86a8]">{card.label}</p>
                          <p className="mt-3 text-4xl font-bold text-[#082f57]">{card.value}</p>
                        </div>
                        <div className="grid h-14 w-14 place-items-center rounded-lg border border-[#d7e2ee] bg-[#f1f6fc] text-[10px] font-bold text-[#456997]">
                          {card.icon}
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-[#7791b2]">{card.helper}</p>
                    </article>
                  ))}
                </section>

                <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_0.45fr]">
                  <article className="rounded-lg border border-[#d7e2ee] bg-white p-6 shadow-[0_18px_50px_rgba(8,47,87,0.07)]">
                    <h2 className="text-2xl font-semibold text-[#082f57]">Reservation Activity</h2>
                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      {[
                        { label: 'Pending Approvals', value: '0', helper: 'Reservations waiting for action' },
                        { label: 'Upcoming Arrivals', value: '0', helper: 'Approved stays scheduled after today' },
                        { label: 'Check-outs Today', value: '0', helper: 'Guests due to leave today' },
                        { label: 'Staff Accounts', value: '0', helper: 'Active staff logins in the system' },
                      ].map((card) => (
                        <div key={card.label} className="rounded-lg border border-[#d7e2ee] bg-[#f8fbff] p-5">
                          <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#6d86a8]">{card.label}</p>
                          <p className="mt-3 text-3xl font-bold text-[#082f57]">{card.value}</p>
                          <p className="mt-2 text-sm text-[#7791b2]">{card.helper}</p>
                        </div>
                      ))}
                    </div>
                  </article>

                  <article className="rounded-lg border border-[#d7e2ee] bg-white p-6 shadow-[0_18px_50px_rgba(8,47,87,0.07)]">
                    <h2 className="text-2xl font-semibold text-[#082f57]">Room Status</h2>
                    <div className="mt-7 space-y-7">
                      {roomStatuses.map((status) => (
                        <div key={status.label} className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <span className={`h-3 w-3 rounded-full ${status.color}`} />
                            <span className="font-semibold text-[#1b426c]">{status.label}</span>
                          </div>
                          <span className="font-bold text-[#082f57]">{status.value}</span>
                        </div>
                      ))}
                    </div>
                  </article>
                </section>
              </>
            ) : null}

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
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
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
                      className="w-full rounded-lg bg-[#123754] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0d2a41] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#bfd8fb] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isSavingRoom ? 'Saving...' : editingRoomId ? 'Update Room' : 'Add Room'}
                    </button>
                  </form>
                </article>
              </section>
            ) : null}

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
  rooms: AdminRoom[];
  isLoading: boolean;
  onEditRoom: (room: AdminRoom) => void;
  onDeleteRoom: (room: AdminRoom) => void;
};

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
                          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteRoom(room)}
                          className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-50"
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

export default AdminDashboard;
