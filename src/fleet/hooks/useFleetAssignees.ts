import { useEffect, useState } from "react";
import { getFleetUsers } from "../services/userService";

// Same sample users as the Claims side (no real accounts for these yet) so tasks
// can be assigned consistently across both. Real registered users are merged in
// (and shown first). Kept self-contained — no Claims imports.
export const SAMPLE_USERS = [
  "Imran Dean",
  "Hina Sadaf",
  "Ruby Ud Din",
  "Akeel Rehman",
  "Tariq Hussain",
  "Ali Pervaiz",
  "Alex",
];

// Single source of truth for the "Assigned To" options on the Fleet task surfaces.
export function useFleetAssignees(): string[] {
  const [users, setUsers] = useState<string[]>(SAMPLE_USERS);
  useEffect(() => {
    getFleetUsers()
      .then((data) => {
        const real = data.map((u) => u.name).filter(Boolean);
        setUsers(Array.from(new Set([...real, ...SAMPLE_USERS])));
      })
      .catch(() => setUsers(SAMPLE_USERS));
  }, []);
  return users;
}
