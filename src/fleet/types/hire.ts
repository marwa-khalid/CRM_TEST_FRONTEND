export interface Option {
  label: string;
  value: string;
}

// Insurance Type (dropdown) — mandatory, fixed options per the story.
export const INSURANCE_TYPE_OPTIONS: Option[] = [
  { label: "Customer Own Insurance", value: "customer_own" },
  { label: "Our Insurance", value: "our_insurance" },
];

// Current Position (dropdown) — mandatory, fixed options per the story.
export const CURRENT_POSITION_OPTIONS: Option[] = [
  { label: "Awaiting Hire", value: "awaiting_hire" },
  { label: "Hire Cancelled", value: "hire_cancelled" },
  { label: "Debt Recovery", value: "debt_recovery" },
  { label: "Hire Ended", value: "hire_ended" },
  { label: "In Hire", value: "in_hire" },
  { label: "Hire Rejected", value: "hire_rejected" },
  { label: "Dead Case", value: "dead_case" },
];

// Borough (Hire Vehicle Details) — London boroughs (PCO/private-hire context).
export const BOROUGH_OPTIONS: Option[] = [
  "Barking and Dagenham", "Barnet", "Bexley", "Brent", "Bromley", "Camden",
  "City of London", "Croydon", "Ealing", "Enfield", "Greenwich", "Hackney",
  "Hammersmith and Fulham", "Haringey", "Harrow", "Havering", "Hillingdon",
  "Hounslow", "Islington", "Kensington and Chelsea", "Kingston upon Thames",
  "Lambeth", "Lewisham", "Merton", "Newham", "Redbridge", "Richmond upon Thames",
  "Southwark", "Sutton", "Tower Hamlets", "Waltham Forest", "Wandsworth",
  "Westminster",
].map((b) => ({ label: b, value: b.toLowerCase().replace(/[^a-z0-9]+/g, "_") }));

// Swap Reason (Hire Vehicle Details) — why the hire car is being swapped.
export const SWAP_REASON_OPTIONS: Option[] = [
  { label: "Accident", value: "accident" },
  { label: "Breakdown", value: "breakdown" },
  { label: "Mechanical Issue", value: "mechanical_issue" },
  { label: "Upgrade", value: "upgrade" },
  { label: "Customer Request", value: "customer_request" },
  { label: "Vehicle Recall", value: "vehicle_recall" },
  { label: "Other", value: "other" },
];

export interface HireVehicleForm {
  vehicleCostPerWeek: string;
  deposit: string;
  borough: string;
  registrationNumber: string;
  make: string;
  model: string;
  transmission: string;
  hireStatus: string; // on_hire | off_hire
  swapCar: string; // yes | no
  swapReason: string;
  swapReasonText: string;
  hireStartDate: string; // yyyy-mm-dd
  hireEndDate: string;
  totalHirePeriod: string;
  hireInsuranceType: string;
  dateReceived: string;
  policyStartDate: string;
  policyEndDate: string;
  crossHireProviderName: string;
  crossHireContactDetails: string;
  crossHireRate: string;
}

export const PCN_STATUS_OPTIONS: Option[] = [
  { label: "New", value: "new" },
  { label: "Appeal Pending", value: "appeal_pending" },
  { label: "Appealed", value: "appealed" },
  { label: "Paid", value: "paid" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Overdue", value: "overdue" },
];

export const LIABILITY_TRANSFER_STATUS_OPTIONS: Option[] = [
  { label: "Not Started", value: "not_started" },
  { label: "Pending", value: "pending" },
  { label: "Submitted", value: "submitted" },
  { label: "Accepted", value: "accepted" },
  { label: "Rejected", value: "rejected" },
];

export interface PcnForm {
  councilName: string;
  councilAddress: string;
  councilPostcode: string;
  pcnNumber: string;
  offenceDate: string;
  pcnStatus: string;
  liabilityTransferStatus: string;
  responseDeadline: string;
}

export interface GeneralDetailsForm {
  fileOpenedDate: string;
  fileOpenedTime: string;
  fileClosedOn: string;
  insuranceType: string;
  rentalAdvisor: string;
  currentPosition: string;
  bankName: string;
  accountName: string;
  sortCode: string;
  accountNumber: string;
  isClosed: boolean;
}

// --- GDPR & Marketing Preferences (step 3) --------------------------------
// Option lists are placeholders pending the exact story list — easy to adjust.
export const FIND_US_OPTIONS: Option[] = [
  { label: "Google", value: "google" },
  { label: "Referral", value: "referral" },
  { label: "Social Media", value: "social_media" },
  { label: "Website", value: "website" },
  { label: "Repeat Customer", value: "repeat" },
  { label: "Other", value: "other" },
];

export const PRIVACY_METHOD_OPTIONS: Option[] = [
  { label: "Email", value: "email" },
  { label: "Verbal", value: "verbal" },
  { label: "In Person", value: "in_person" },
  { label: "Post", value: "post" },
  { label: "SMS", value: "sms" },
];

export const LAWFUL_BASIS_OPTIONS: Option[] = [
  { label: "Consent", value: "consent" },
  { label: "Contract", value: "contract" },
  { label: "Legal Obligation", value: "legal_obligation" },
  { label: "Legitimate Interest", value: "legitimate_interest" },
  { label: "Vital Interest", value: "vital_interest" },
  { label: "Public Task", value: "public_task" },
];

export const CONSENT_METHOD_OPTIONS: Option[] = [
  { label: "Email", value: "email" },
  { label: "Verbal", value: "verbal" },
  { label: "In Person", value: "in_person" },
  { label: "Post", value: "post" },
  { label: "SMS", value: "sms" },
  { label: "Website", value: "website" },
];

export const CONSENT_STATE_OPTIONS: Option[] = [
  { label: "Yes", value: "yes" },
  { label: "No", value: "no" },
  { label: "Withdrawn", value: "withdrawn" },
];

export interface GDPRForm {
  whereFound: string;
  privacyNoticeExplained: string; // "yes" | "no"
  privacyNoticeDate: string; // yyyy-mm-dd
  privacyNoticeMethod: string;
  lawfulBasis: string;
  emailConsent: string; // yes | no | withdrawn
  emailConsentDate: string;
  emailConsentMethod: string;
  smsConsent: string;
  phoneConsent: string;
  postalConsent: string;
  reasonForWithdrawal: string;
}

export interface AuditLogRow {
  user: string;
  fieldChanged: string;
  oldValue: string;
  newValue: string;
  date: string;
}

export interface DriverDetailsForm {
  name: string;
  address: string;
  postcode: string;
  email: string;
  telephone: string;
  mobile: string;
  drivingLicenceNumber: string;
  nationalInsuranceNumber: string;
  dateOfBirth: string; // yyyy-mm-dd
}

// The Add New Hire wizard steps (left sidebar). A step's screen is added per story.
export interface HireStep {
  key: string;
  label: string;
}

export const HIRE_STEPS: HireStep[] = [
  { key: "general", label: "General Details" },
  { key: "driver", label: "Driver Details" },
  { key: "gdpr", label: "GDPR & Marketing Preferences" },
  { key: "proofs", label: "Driver Proofs & License Checks" },
  { key: "vehicle", label: "Hire Vehicle Details" },
  { key: "payment", label: "Payment Details" },
  { key: "pcn", label: "Penalty Charges - PCN" },
  { key: "documents", label: "Documents Checklist" },
];
