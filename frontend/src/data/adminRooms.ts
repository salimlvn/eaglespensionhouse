// Room values allowed by both the frontend and backend.
export type RoomType = 'Aircon' | 'Non-aircon';
export type RoomStatus = 'Available' | 'Maintenance';

// Room shape returned by the admin room API.
export type AdminRoom = {
  roomId: number;
  roomNumber: string;
  roomType: RoomType;
  status: RoomStatus;
  createdAt: string;
  updatedAt: string;
};

// Room payload sent when creating or updating a room.
export type RoomPayload = {
  roomNumber: string;
  roomType: RoomType;
  status: RoomStatus;
};

type RoomsResponse = {
  message: string;
  rooms: AdminRoom[];
};

type RoomResponse = {
  message: string;
  room: AdminRoom;
};

type RoomOptionsResponse = {
  message: string;
  roomNumbers: string[];
};

type ApiMessage = {
  message: string;
};

// Use the Vite proxy by default, or an absolute backend URL when configured.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

// Dropdown options shared with the admin room form.
export const ROOM_TYPES: RoomType[] = ['Aircon', 'Non-aircon'];
export const ROOM_STATUSES: RoomStatus[] = ['Available', 'Maintenance'];

// Room number groups mirror the current room numbering setup.
export const ROOM_NUMBER_OPTIONS_BY_TYPE: Record<RoomType, string[]> = {
  Aircon: ['201', '202', '203', '204', '205', '206', '207', '208', '209', '210', '211', '212', '213', '214', '215'],
  'Non-aircon': ['101', '102', '103', '104', '105', '106', '107', '108', '109', '110', '111', '112', '113', '114', '115'],
};

// Load all room records for the inventory table.
export async function getRooms() {
  const response = await apiRequest<RoomsResponse>('/api/rooms');
  return response.rooms;
}

// Load room numbers that can be selected in the room form.
export async function getRoomNumberOptions() {
  const response = await apiRequest<RoomOptionsResponse>('/api/rooms/options');
  return response.roomNumbers;
}

// Create a new room record.
export async function createRoom(payload: RoomPayload) {
  const response = await apiRequest<RoomResponse>('/api/rooms', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return response.room;
}

// Update an existing room record.
export async function updateRoom(roomId: number, payload: RoomPayload) {
  const response = await apiRequest<RoomResponse>(`/api/rooms/${roomId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  return response.room;
}

// Delete an existing room record.
export async function deleteRoom(roomId: number) {
  await apiRequest<ApiMessage>(`/api/rooms/${roomId}`, {
    method: 'DELETE',
  });
}

// Send a room API request and normalize backend/network errors.
async function apiRequest<T extends ApiMessage>(path: string, init?: RequestInit) {
  let response: Response;

  try {
    response = await fetch(resolveApiUrl(path), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
  } catch {
    throw new Error('Cannot reach the room server. Make sure the backend is running and the API URL is configured correctly.');
  }

  const payload = (await response.json().catch(() => null)) as T | { message?: string } | null;

  if (!response.ok) {
    throw new Error(payload?.message || 'Request failed. Please try again.');
  }

  return payload as T;
}

// Build request URLs for either proxied or direct API calls.
function resolveApiUrl(path: string) {
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }

  if (API_BASE_URL === '/api') {
    return path;
  }

  return `${API_BASE_URL}${path}`;
}
