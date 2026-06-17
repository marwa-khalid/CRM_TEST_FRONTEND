import { useEffect, useState } from "react";
import { getUsers } from "../../services/Notifications/Notifications";

// The 7 sample users (no real accounts yet). They're kept so tasks can be
// assigned to them in the UI; once they get accounts they'll come through the
// API and can be removed from this list. Real registered users are merged in
// (and shown first) so tasks/notifications can be tested against actual accounts.
export const SAMPLE_USERS = [
  "Imran Dean",
  "Hina Sadaf",
  "Ruby Ud Din",
  "Akeel Rehman",
  "Tariq Hussain",
  "Ali Pervaiz",
  "Alex",
];

// Single source of truth for the "Assigned User" options, used by every task
// surface (Tasks list, Add/Edit drawer, Reassign, filters, Calendar) so the
// behaviour stays consistent everywhere.
export function useAssignees(): string[] {
  const [users, setUsers] = useState<string[]>(SAMPLE_USERS);
  useEffect(() => {
    getUsers()
      .then(({ data }) => {
        const real = (Array.isArray(data) ? data : [])
          .map((u) => u.name)
          .filter(Boolean);
        // Real users first, then any sample users not already present.
        setUsers(Array.from(new Set([...real, ...SAMPLE_USERS])));
      })
      .catch(() => setUsers(SAMPLE_USERS));
  }, []);
  return users;
}
