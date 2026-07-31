import type { Option } from "../../fleet/types/hire";

export interface VehicleStep {
  key: string;
  label: string;
}

// The customer-side vehicle wizard. Only "details" is built so far; the rest are
// later stories and render a placeholder.
export const VEHICLE_STEPS: VehicleStep[] = [
  { key: "details", label: "Vehicle Details" },
  { key: "licensing", label: "Licensing Authority" },
  { key: "licensing_summary", label: "Licensing Authority Summary" },
  { key: "current_hire", label: "Current Hire Details" },
  { key: "servicing", label: "Servicing Details" },
  { key: "road_fund", label: "Road Fund License" },
  { key: "sales", label: "Vehicle Sales Details" },
];

// `unsorted` is passed to FleetSelect for these so they keep the order the user
// story specifies rather than being alphabetised.
export const OBTAINED_FOR_PURPOSE_OPTIONS: Option[] = [
  { label: "CAMS Rental Vehicle", value: "cams_rental_vehicle" },
  { label: "Chassis File Imported Skyline Vehicle", value: "chassis_file_imported_skyline_vehicle" },
  { label: "Cross Hire Vehicle For Credit Hire ONLY", value: "cross_hire_vehicle_for_credit_hire_only" },
  { label: "Demo Vehicle", value: "demo_vehicle" },
  { label: "Leased Vehicle For Credit Hire ONLY", value: "leased_vehicle_for_credit_hire_only" },
  { label: "Owned Vehicle For Credit Hire ONLY", value: "owned_vehicle_for_credit_hire_only" },
  { label: "Owned Vehicle For Driver/Skyline Hire ONLY", value: "owned_vehicle_for_driver_skyline_hire_only" },
  { label: "Weekly Hire Vehicle For Staff/Referrer/Other", value: "weekly_hire_vehicle_for_staff_referrer_other" },
];

export const CONTRACT_TYPE_OPTIONS: Option[] = [
  { label: "Demo Or Cross Hire", value: "demo_or_cross_hire" },
  { label: "Leased", value: "leased" },
  { label: "Outright Purchased", value: "outright_purchased" },
  { label: "Purchased With Finance", value: "purchased_with_finance" },
];

export const VEHICLE_STATUS_OPTIONS: Option[] = [
  { label: "Available", value: "available" },
  { label: "Weekly Hire", value: "weekly_hire" },
  { label: "In Service", value: "in_service" },
  { label: "In Repair", value: "in_repair" },
  { label: "For Sale", value: "for_sale" },
  { label: "Off Fleet", value: "off_fleet" },
  { label: "Awaiting Plating", value: "awaiting_plating" },
  { label: "Awaiting De Fleet", value: "awaiting_de_fleet" },
];

export const DEPOT_BRANCH_OPTIONS: Option[] = [
  { label: "CAMS Ltd", value: "cams_ltd" },
  { label: "Repairer", value: "repairer" },
  { label: "Servicing Garage", value: "servicing_garage" },
  { label: "At Port", value: "at_port" },
  { label: "Skyline Limited", value: "skyline_limited" },
];
