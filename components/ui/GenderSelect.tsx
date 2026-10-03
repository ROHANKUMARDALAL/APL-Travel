"use client";

import ChoiceSelect, { type ChoiceOption } from "@/components/ui/ChoiceSelect";
import { GENDER_OPTIONS } from "@/lib/travellerIdentity";

export type TravellerGender = "male" | "female" | "transgender" | "prefer_not_to_say";

type GenderSelectProps = {
  id?: string;
  value: TravellerGender;
  onChange: (value: TravellerGender) => void;
  disabled?: boolean;
};

function GenderIcon({ value }: { value: string }) {
  if (value === "female") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
        <circle cx="12" cy="9" r="4" stroke="currentColor" strokeWidth="1.7" />
        <path d="M12 13v7M9.5 17.5h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  if (value === "transgender") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
        <circle cx="11" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M14 10 19 5M16 5h3v3M8 16.5 5.5 19M5.5 16.5v2.5H8"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (value === "prefer_not_to_say") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
        <path d="M9.5 10.5h.01M14.5 10.5h.01M9.5 15c1 1 4 1 5 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <circle cx="10.5" cy="13.5" r="3.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M13 11 18 6M15.5 6H18v2.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const OPTIONS: ChoiceOption<TravellerGender>[] = GENDER_OPTIONS.map((row) => ({
  value: row.value as TravellerGender,
  label: row.label,
  description: row.description,
  icon: <GenderIcon value={row.value} />,
}));

export default function GenderSelect({ id, value, onChange, disabled }: GenderSelectProps) {
  return (
    <ChoiceSelect
      id={id}
      label="Gender"
      value={value}
      options={OPTIONS}
      onChange={onChange}
      disabled={disabled}
      placeholder="Select gender"
    />
  );
}
