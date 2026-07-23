import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FleetReadonlyField } from "../../components/fields";
import FleetSpinnerLoader from "../../components/FleetSpinnerLoader";
import PrintIcon from "../../assets/icons/Print.svg";
import {
  listLicensingAuthorities,
  openLicensingLettersPrintView,
  type LicensingAuthority,
} from "../../services/licensingAuthorityService";
import { useVehicle } from "./VehicleContext";

const SECTION = "self-stretch p-5 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col gap-4";
const BTN_DARK = "h-8 px-3 py-2 bg-neutral-900 rounded text-white text-sm inline-flex items-center justify-center gap-2 hover:bg-black disabled:opacity-70";

const LicensingAuthoritySummary: React.FC = () => {
  const { vehicle, loading: recordLoading } = useVehicle();
  const recordId = vehicle?.id ?? null;

  const [authorities, setAuthorities] = useState<LicensingAuthority[]>([]);
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);

  // Always re-read on mount so edits made on the Licensing Authority screen are
  // reflected here — the story requires the two stay synchronised.
  const load = useCallback(async () => {
    if (!recordId) return;
    setLoading(true);
    try {
      setAuthorities(await listLicensingAuthorities(recordId));
    } finally {
      setLoading(false);
    }
  }, [recordId]);

  useEffect(() => {
    load();
  }, [load]);

  const named = authorities.filter((a) => (a.licensing_authority || "").trim());

  const raiseLetters = async () => {
    if (!recordId) return;
    if (named.length === 0) {
      toast.warn("Add a licensing authority before raising letters.");
      return;
    }
    setPrinting(true);
    try {
      await openLicensingLettersPrintView(recordId);
    } catch {
      toast.error("Could not open the letters. Please allow pop-ups and try again.");
    } finally {
      setPrinting(false);
    }
  };

  if (!recordId) {
    return (
      <div className="w-full max-w-[788px] font-sans-headline">
        <span className="text-neutral-400 text-sm">
          {recordLoading ? "Loading…" : "This vehicle record isn't available yet."}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[788px] flex flex-col gap-6 font-sans-headline">
      {(loading || printing) && <FleetSpinnerLoader />}

      <h2 className="text-black text-2xl font-semibold leading-6">Licensing Authority Summary</h2>

      <section className={SECTION}>
        {/* Read-only — the story forbids manual entry here; edits happen on the
            Licensing Authority screen and flow through. */}
        {named.length === 0 ? (
          <span className="text-neutral-400 text-sm">
            No licensing authorities have been added yet. Add them on the Licensing Authority screen.
          </span>
        ) : (
          named.map((authority, i) => (
            <FleetReadonlyField
              key={authority.id}
              label={`Licensing Authority ${authority.position ?? i + 1}`}
              value={authority.licensing_authority || ""}
              placeholder="—"
            />
          ))
        )}

        <div className="py-2">
          <button type="button" disabled={printing || named.length === 0} onClick={raiseLetters} className={BTN_DARK}>
            <img src={PrintIcon} alt="" className="w-4 h-4 brightness-0 invert" />
            Raise Licensing Authority Letters
          </button>
        </div>
      </section>
    </div>
  );
};

export default LicensingAuthoritySummary;
