import FleetExpirySection from "./FleetExpirySection";

// Operational — reads real fleet MOT expiries (see FleetExpirySection).
export default function MotExpiry() {
  return <FleetExpirySection kind="mot" title="MOT Expiry" authorityLabel="MOT Centre" />;
}
