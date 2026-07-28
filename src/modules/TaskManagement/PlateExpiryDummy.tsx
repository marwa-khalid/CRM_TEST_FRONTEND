import FleetExpirySection from "./FleetExpirySection";

// Operational — reads real fleet plate expiries (see FleetExpirySection).
export default function PlateExpiry() {
  return <FleetExpirySection kind="plating" title="Plate Expiry" authorityLabel="Licensing Authority" />;
}
