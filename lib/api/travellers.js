import { apiDelete, apiGet, apiPost } from "@/lib/api/client";
import { getLoginToken } from "@/lib/auth";

export async function fetchSavedTravellers() {
  const token = getLoginToken();
  if (!token) return [];
  const data = await apiGet("/travellers", { token });
  return data?.travellers || [];
}

export async function saveTravellerProfile(person) {
  const token = getLoginToken();
  if (!token) return null;
  const data = await apiPost(
    "/travellers",
    {
      id: person.savedTravellerId || undefined,
      title: person.title || "Mr",
      firstName: person.firstName?.trim(),
      lastName: person.lastName?.trim(),
      dateOfBirth: person.dob || person.dateOfBirth || "",
      gender: person.gender || "",
      nationality: person.nationality || "",
      travellerType: person.type || person.travellerType || "adult",
      passportNumber: person.passport || person.passportNumber || "",
      passportExpiry: person.passportExpiry || "",
    },
    { token },
  );
  return data?.traveller || null;
}

export function applySavedTraveller(slot, saved) {
  if (!saved) return slot;
  return {
    ...slot,
    title: saved.title || "Mr",
    firstName: saved.firstName || "",
    lastName: saved.lastName || "",
    dob: saved.dateOfBirth || "",
    gender: saved.gender || "",
    nationality: saved.nationality || "",
    passport: saved.passportNumber || "",
    passportExpiry: saved.passportExpiry || "",
    savedTravellerId: saved.id,
  };
}

export async function removeSavedTraveller(id) {
  const token = getLoginToken();
  if (!token || !id) return;
  await apiDelete(`/travellers/${id}`, { token });
}
