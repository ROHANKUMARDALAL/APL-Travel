export default function ServiceIcon({ name, className = "h-4 w-4" }) {
  if (name === "plane") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5L21 16Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (name === "hotel") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 21V7a2 2 0 0 1 2-2h5v16H4Zm9 0V3h5a2 2 0 0 1 2 2v16h-7ZM7 9h2v2H7V9Zm0 4h2v2H7v-2Zm9-6h2v2h-2V7Zm0 4h2v2h-2v-2Zm0 4h2v2h-2v-2Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 16h16v2H4v-2Zm1-3 1.5-6h11L19 13H5Zm2.5-4.5h1.2l.4 1.5H7.1l.4-1.5Zm3.2 0h1.6l.4 1.5h-2.4l.4-1.5Zm3.4 0h1.2l.4 1.5h-2l.4-1.5ZM7 17.5a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Zm10 0a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Z"
        fill="currentColor"
      />
    </svg>
  );
}
