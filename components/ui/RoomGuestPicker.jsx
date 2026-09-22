"use client";

import { useEffect, useRef, useState } from "react";
import CounterRow from "@/components/ui/CounterRow";

const MAX_GUESTS = 10;
const MAX_ROOMS = 4;
const MAX_PER_ROOM = 6;

export default function RoomGuestPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const { guests, rooms } = value;

  useEffect(() => {
    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function setGuests(nextGuests) {
    let guestsNext = Math.max(1, Math.min(MAX_GUESTS, nextGuests));
    let roomsNext = rooms;

    const roomsNeeded = Math.ceil(guestsNext / MAX_PER_ROOM);
    if (roomsNeeded > roomsNext) {
      roomsNext = Math.min(MAX_ROOMS, roomsNeeded);
    }

    const capacity = roomsNext * MAX_PER_ROOM;
    if (guestsNext > capacity) {
      guestsNext = capacity;
    }

    onChange({ guests: guestsNext, rooms: roomsNext });
  }

  function setRooms(nextRooms) {
    let roomsNext = Math.max(1, Math.min(MAX_ROOMS, nextRooms));
    let guestsNext = guests;
    const capacity = roomsNext * MAX_PER_ROOM;
    if (guestsNext > capacity) guestsNext = capacity;
    if (guestsNext < 1) guestsNext = 1;
    onChange({ guests: guestsNext, rooms: roomsNext });
  }

  const canAddGuest =
    guests < MAX_GUESTS &&
    (guests + 1 <= rooms * MAX_PER_ROOM || rooms < MAX_ROOMS);

  const canAddRoom = rooms < MAX_ROOMS;

  const summary = `${guests} Guest${guests > 1 ? "s" : ""} · ${rooms} Room${rooms > 1 ? "s" : ""}`;

  return (
    <div className="picker-field" ref={rootRef}>
      <label className="field-label">Guests & rooms</label>
      <button
        type="button"
        className={`picker-trigger ${open ? "is-open" : ""}`}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>{summary}</span>
        <span className="picker-caret">▾</span>
      </button>

      {open ? (
        <div className="picker-popover">
          <CounterRow
            label="Guests"
            hint={`Max ${MAX_GUESTS} · ${MAX_PER_ROOM}/room`}
            value={guests}
            decreaseDisabled={guests <= 1}
            increaseDisabled={!canAddGuest}
            onDecrease={() => setGuests(guests - 1)}
            onIncrease={() => setGuests(guests + 1)}
          />
          <CounterRow
            label="Rooms"
            hint={`Max ${MAX_ROOMS} rooms`}
            value={rooms}
            decreaseDisabled={rooms <= 1}
            increaseDisabled={!canAddRoom}
            onDecrease={() => setRooms(rooms - 1)}
            onIncrease={() => setRooms(rooms + 1)}
          />
          <p className="picker-note">
            Crossing {MAX_PER_ROOM} guests auto-adds a room. Caps: {MAX_GUESTS} guests or{" "}
            {MAX_ROOMS} rooms.
          </p>
        </div>
      ) : null}
    </div>
  );
}
