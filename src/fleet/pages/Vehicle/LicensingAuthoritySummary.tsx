import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { FleetTextInput } from "../../components/fields";
import FleetSpinnerLoader from "../../components/FleetSpinnerLoader";
import PrintIcon from "../../assets/icons/Print.svg";
import {
  downloadLicensingAuthorityLetters,
  listLicensingAuthorities,
  updateLicensingAuthority,
  type LicensingAuthority,
} from "../../services/licensingAuthorityService";
import { useVehicle } from "./VehicleContext";
import { useHire } from "../AddNewHire/HireContext";

const SECTION = "self-stretch p-4 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col gap-3";
const BTN_DARK = "h-8 px-3 py-2 bg-neutral-900 rounded text-white text-sm inline-flex items-center justify-center gap-2 hover:bg-black disabled:opacity-70";

const LicensingAuthoritySummary: React.FC = () => {
  const { vehicle, loading: recordLoading } = useVehicle();
  const recordId = vehicle?.id ?? null;

  const [authorities, setAuthorities] = useState<LicensingAuthority[]>([]);
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  // Never a blank white page — render the summary and overlay the loader.
  const [pageReady, setPageReady] = useState(false);

  // Always re-read on mount so edits made on the Licensing Authority screen are
  // reflected here — the story requires the two stay synchronised.
  const load = useCallback(async () => {
    if (!recordId) return;
    setLoading(true);
    try {
      setAuthorities(await listLicensingAuthorities(recordId));
    } finally {
      setLoading(false);
      setPageReady(true);
    }
  }, [recordId]);

  useEffect(() => {
    load();
  }, [load]);

  const setAuthorityName = (authorityId: number, value: string) => {
    setAuthorities((rows) =>
      rows.map((authority) =>
        authority.id === authorityId ? { ...authority, licensing_authority: value } : authority,
      ),
    );
  };

  // Buffer name edits and flush on navigation (or before raising letters) rather
  // than PATCHing on every blur.
  const { registerFlusher } = useHire();
  const pendingRef = useRef<Record<number, string>>({});
  const saveAuthorityName = (authority: LicensingAuthority) => {
    pendingRef.current[authority.id] = authority.licensing_authority || "";
  };
  const flushPending = useCallback(async () => {
    if (!recordId) return;
    const buffers = pendingRef.current;
    pendingRef.current = {};
    for (const [idStr, name] of Object.entries(buffers)) {
      const updated = await updateLicensingAuthority(recordId, Number(idStr), { licensing_authority: name || null });
      if (updated) setAuthorities((rows) => rows.map((row) => (row.id === updated.id ? updated : row)));
    }
  }, [recordId]);
  useEffect(() => registerFlusher(flushPending), [registerFlusher, flushPending]);

  const raiseLetters = async () => {
    if (!recordId) return;
    if (authorities.length === 0) {
      toast.warn("Add a licensing authority before raising letters.");
      return;
    }
    setPrinting(true);
    try {
      await flushPending(); // persist edited names before the server builds the letters
      await downloadLicensingAuthorityLetters(recordId);
      toast.success("Licensing authority letters downloaded.");
    } catch {
      toast.error("Could not download the letters. Please try again.");
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="w-full max-w-[788px] flex flex-col gap-4 font-sans-headline">
      {(recordLoading || loading || printing || !recordId || !pageReady) && <FleetSpinnerLoader />}

      <h2 className="text-black text-2xl font-semibold leading-6">Licensing Authority Summary</h2>

      {/* One card listing every authority from the Licensing Authority screen.
          Editable here too, so the summary can be corrected before download. */}
      <section className={SECTION}>
        {authorities.length === 0 ? (
          <span className="text-neutral-400 text-sm">
            No licensing authorities have been added yet. Add them on the Licensing Authority screen.
          </span>
        ) : (
          authorities.map((authority, i) => (
            <FleetTextInput
              key={authority.id}
              label={`Licensing Authority ${authority.position ?? i + 1}`}
              value={authority.licensing_authority || ""}
              placeholder="Enter licensing authority"
              onChange={(value) => setAuthorityName(authority.id, value)}
              onBlur={() => saveAuthorityName(authority)}
            />
          ))
        )}

        <div className="pt-1">
          <button type="button" disabled={printing || authorities.length === 0} onClick={raiseLetters} className={BTN_DARK}>
            <img src={PrintIcon} alt="" className="w-4 h-4 brightness-0 invert" />
            Raise Licensing Authority Letters
          </button>
        </div>
      </section>
    </div>
  );
};

export default LicensingAuthoritySummary;
