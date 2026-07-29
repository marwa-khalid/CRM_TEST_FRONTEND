import React from "react";
import { ExternalLink } from "lucide-react";
import { FleetDateField, FleetReadonlyField } from "../../components/fields";
import FleetSpinnerLoader from "../../components/FleetSpinnerLoader";
import Vector6 from "../../assets/icons/Calendar.svg";
import { useVehicle } from "./VehicleContext";

const SECTION = "self-stretch p-5 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col gap-4";
const BTN_DARK = "h-8 px-3 py-2 bg-neutral-900 rounded text-white text-sm inline-flex items-center justify-center gap-2 hover:bg-black";

// Same behaviour as the DVLA / AskMID links on the Claims side.
const ROAD_TAX_CHECK_URL = "https://cartaxcheck.co.uk/";

const displayDate = (value?: string | null): string => {
  if (!value) return "";
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("en-GB");
};

// Road tax runs 12 months: same day/month a year on (29 Feb → 28 Feb). Mirrors
// the server's add_one_year so the Expiry Date shown live matches what's saved.
const addOneYearISO = (value?: string | null): string => {
  const m = (value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return "";
  const [, y, mo, d] = m;
  const day = mo === "02" && d === "29" ? "28" : d;
  return `${Number(y) + 1}-${mo}-${day}`;
};

const RoadFundLicense: React.FC = () => {
  const { vehicle, save, loading: recordLoading } = useVehicle();

  return (
    <div className="w-full max-w-[788px] flex flex-col gap-6 font-sans-headline">
      {(recordLoading || !vehicle?.id) && <FleetSpinnerLoader />}

      <h2 className="text-black text-2xl font-semibold leading-6">Road Fund License</h2>

      <section className={SECTION}>
        <div className="flex justify-between items-center gap-4">
          <h3 className="text-black text-xl font-semibold leading-5"></h3>
          <a
            href={ROAD_TAX_CHECK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`${BTN_DARK} shrink-0 no-underline`}
          >
            <ExternalLink size={16} />
            View Road Tax Status
          </a>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <FleetDateField
            label="Last Road Tax Renewed On"
            value={vehicle?.road_tax_renewed_on || ""}
            onChange={(v) => save({ road_tax_renewed_on: v || null })}
          />
          {/* Read-only: filled live as one year on from the renewal date. The
              server recalculates the same value on save and rebuilds the expiry
              calendar event + reminder schedule with it. */}
          <FleetReadonlyField
            label="Expiry Date"
            value={vehicle?.road_tax_renewed_on ? displayDate(addOneYearISO(vehicle.road_tax_renewed_on)) : ""}
            placeholder="Set the renewal date"
            icon={Vector6}
          />
        </div>
      </section>
    </div>
  );
};

export default RoadFundLicense;
