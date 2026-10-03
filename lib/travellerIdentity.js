export const TITLE_OPTIONS = [
  {
    value: "Mr",
    label: "Mr",
    description: "Common title for men",
  },
  {
    value: "Ms",
    label: "Ms",
    description: "Common title for women",
  },
  {
    value: "Mrs",
    label: "Mrs",
    description: "Often used by married women",
  },
  {
    value: "Miss",
    label: "Miss",
    description: "Often used by unmarried women",
  },
  {
    value: "Mx",
    label: "Mx",
    description: "Gender-neutral title (incl. transgender)",
  },
];

export const GENDER_OPTIONS = [
  {
    value: "male",
    label: "Male",
    description: "Identifies as male",
  },
  {
    value: "female",
    label: "Female",
    description: "Identifies as female",
  },
  {
    value: "transgender",
    label: "Transgender",
    description: "Transgender identity",
  },
  {
    value: "prefer_not_to_say",
    label: "Prefer not to say",
    description: "Keep gender private",
  },
];

export const DOCUMENT_TYPE_OPTIONS = [
  {
    value: "passport",
    label: "Passport",
    description: "Valid travel document for bookings",
  },
  {
    value: "drivers_license",
    label: "Driver’s license",
    description: "Not used for booking validation yet",
  },
  {
    value: "other",
    label: "Other document",
    description: "Not used for booking validation yet",
  },
];

export function titleLabel(value) {
  return TITLE_OPTIONS.find((row) => row.value === value)?.label || value || "";
}

export function genderLabel(value) {
  return GENDER_OPTIONS.find((row) => row.value === value)?.label || value || "Not added";
}

/** Map honorific to a suggested gender when the title changes. */
export function genderFromTitle(title) {
  if (title === "Mr") return "male";
  if (title === "Ms" || title === "Mrs" || title === "Miss") return "female";
  if (title === "Mx") return "transgender";
  return "prefer_not_to_say";
}

export function documentTypeLabel(value) {
  return DOCUMENT_TYPE_OPTIONS.find((row) => row.value === value)?.label || value || "";
}
