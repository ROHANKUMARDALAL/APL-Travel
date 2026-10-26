const PATHS = {
  plane: "M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5L21 16Z",
  hotel: "M4 21V7a2 2 0 0 1 2-2h5v16H4Zm9 0V3h5a2 2 0 0 1 2 2v16h-7ZM7 9h2v2H7V9Zm0 4h2v2H7v-2Zm9-6h2v2h-2V7Zm0 4h2v2h-2v-2Zm0 4h2v2h-2v-2Z",
  bus: "M6 3h12a2 2 0 0 1 2 2v12H4V5a2 2 0 0 1 2-2Zm0 14h2.2a2 2 0 1 0 3.6 0h4.4a2 2 0 1 0 3.6 0H20v2H4v-2h2Zm2-8h3V6H8v3Zm5 0h3V6h-3v3Z",
  transfer: "M4 16h16v2H4v-2Zm1-3 1.5-6h11L19 13H5Zm2.2-4.2h1.3l.3 1.4H7.2l.4-1.4Zm3.1 0h1.5l.3 1.4h-2.1l.3-1.4Zm3.3 0h1.3l.3 1.4h-1.9l.3-1.4ZM7 17.5a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Zm10 0a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Z",
  visa: "M6 3h12a2 2 0 0 1 2 2v14l-3-2-3 2-3-2-3 2V5a2 2 0 0 1 2-2Zm2 5h8v2H8V8Zm0 4h5v2H8v-2Z",
  recharge: "M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm3 4v4H8l5 8v-4h3l-5-8Z",
  holiday: "M4 18h16v2H4v-2Zm1-2 3-8h2l1 3h6l2 5H5Zm4.2-6.5 1.2 3h2.2l-1.5-3H9.2Z",
  insurance: "M12 3 5 6v6c0 4.2 2.8 7.4 7 9 4.2-1.6 7-4.8 7-9V6l-7-3Zm-1 5h2v3h3v2h-3v3h-2v-3H8v-2h3V8Z",
};

export default function ServiceIcon({ name, className = "h-4 w-4" }) {
  const path = PATHS[name] || PATHS.transfer;
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}
