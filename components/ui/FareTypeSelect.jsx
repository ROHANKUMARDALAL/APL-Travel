"use client";

import PremiumSelect from "@/components/ui/PremiumSelect";

export const FARE_TYPES = [
  { id: "normal", label: "Standard" },
  { id: "seniorcitizen", label: "Senior" },
  { id: "armedforces", label: "Military" },
  { id: "student", label: "Student" },
  { id: "doctor_nurses", label: "Healthcare" },
];

export default function FareTypeSelect({ value, onChange }) {
  return (
    <PremiumSelect
      label="Fare type"
      value={value}
      onChange={onChange}
      options={FARE_TYPES.map((item) => ({ value: item.id, label: item.label }))}
    />
  );
}
