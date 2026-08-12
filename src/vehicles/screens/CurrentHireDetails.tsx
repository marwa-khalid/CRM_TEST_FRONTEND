import React, { useEffect, useState } from "react";
import { FleetReadonlyField } from "../../fleet/components/fields";
import FleetSpinnerLoader from "../../fleet/components/FleetSpinnerLoader";
import Vector6 from "../../fleet/assets/icons/Calendar.svg";
import { listVehicles } from "../services/vehicleService";
import { useVehicle } from "./VehicleContext";

const SECTION = "self-stretch p-5 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col gap-4";

const s = (value: unknown): string => (value == null ? "" : String(value).trim());

const displayDate = (value: unknown): string => {
  const raw = s(value);
  if (!raw) return "";
  const d = new Date(`${raw}T00:00:00`);
  return Number.isNaN(d.getTime()) ? raw : d.toLocaleDateString("en-GB");
};

/**
 * Read-only view of the hire currently against this vehicle. Everything comes
 * from the Client Side of the same record — nothing is stored here, so the two
 * can never drift out of sync.
 */
const CurrentHireDetails: React.FC = () => {
  const { hire, vehicle, loading: recordLoading } = useVehicle();
  const [dates, setDates] = useState<{ start: string; end: string }>({ start: "", end: "" });
  const [loading, setLoading] = useState(false);

  // Hire dates live on the vehicle rows of Hire Vehicle Details, not on the hire
  // itself — the most recently added vehicle is the current/last hire.
  useEffect(() => {
    if (!hire?.id) return;
    let active = true;
    setLoading(true);
    listVehicles(hire.id)
      .then((vehicles) => {
        if (!active) return;
        const latest = vehicles[vehicles.length - 1];
        setDates({
          start: s(latest?.hire_start_date),
          end: s(latest?.hire_end_date),
        });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [hire?.id]);

  const telephone = s(hire?.driver_telephone) || s(hire?.driver_mobile);
  const isCams = s(vehicle?.context).toLowerCase() === "cams";
  const personLabel = isCams ? "Client" : "Driver";

  return (
    <div className="w-full max-w-[788px] flex flex-col gap-6 font-sans-headline">
      {(recordLoading || loading) && <FleetSpinnerLoader />}

      <h2 className="text-black text-2xl font-semibold leading-6">Current Hire Details</h2>

      <section className={SECTION}>
        {/* <h3 className="text-black text-xl font-semibold leading-5">Current/Last Hire Details</h3> */}

        {/* Read-only throughout — the story forbids editing or saving here.
            Blank fields are correct when the vehicle has no hire yet. */}
        <div className="grid grid-cols-2 gap-5">
          <FleetReadonlyField label="Assigned To Ref." value={s(hire?.fleet_reference)} placeholder="—" />
          <FleetReadonlyField label={`${personLabel} Name`} value={s(hire?.driver_name)} placeholder="—" />
        </div>
        <FleetReadonlyField label={`${personLabel} Address`} value={s(hire?.driver_address)} placeholder="—" />
        <div className="grid grid-cols-2 gap-5">
          <FleetReadonlyField label={`${personLabel} Postcode`} value={s(hire?.driver_postcode)} placeholder="—" />
          <FleetReadonlyField label={`${personLabel} Mobile Number`} value={telephone} placeholder="—" />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <FleetReadonlyField
            label="Last/Current Hire Start Date"
            value={displayDate(dates.start)}
            placeholder="—"
            icon={Vector6}
          />
          <FleetReadonlyField
            label="Hire End Date"
            value={displayDate(dates.end)}
            placeholder="—"
            icon={Vector6}
          />
        </div>
      </section>
    </div>
  );
};

export default CurrentHireDetails;
