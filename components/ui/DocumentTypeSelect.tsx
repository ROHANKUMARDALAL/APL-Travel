"use client";

import ChoiceSelect, { type ChoiceOption } from "@/components/ui/ChoiceSelect";
import { DOCUMENT_TYPE_OPTIONS } from "@/lib/travellerIdentity";

export type DocumentType = "passport" | "drivers_license" | "other";

type DocumentTypeSelectProps = {
  id?: string;
  value: DocumentType;
  onChange: (value: DocumentType) => void;
  disabled?: boolean;
};

function DocIcon({ value }: { value: string }) {
  if (value === "drivers_license") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
        <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="8.5" cy="12" r="2" stroke="currentColor" strokeWidth="1.7" />
        <path d="M13 10.5h5M13 13.5h3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  if (value === "other") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
        <path
          d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path d="M14 3v4h4M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <rect x="4" y="3.5" width="16" height="17" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="9.5" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M14 8.5h3.5M14 11.5h2.5M7.5 15.5h9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

const OPTIONS: ChoiceOption<DocumentType>[] = DOCUMENT_TYPE_OPTIONS.map((row) => ({
  value: row.value as DocumentType,
  label: row.label,
  description: row.description,
  icon: <DocIcon value={row.value} />,
}));

export default function DocumentTypeSelect({
  id,
  value,
  onChange,
  disabled,
}: DocumentTypeSelectProps) {
  return (
    <ChoiceSelect
      id={id}
      label="Document type"
      value={value}
      options={OPTIONS}
      onChange={onChange}
      disabled={disabled}
      placeholder="Select document"
    />
  );
}
