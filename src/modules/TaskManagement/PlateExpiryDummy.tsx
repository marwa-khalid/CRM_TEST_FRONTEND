type PlateStatus = "expired" | "upcoming" | "urgent";

type PlateVehicle = {
  registration: string;
  model: string;
  status: PlateStatus;
  authority: string;
  expiryDate: string;
};

const plateVehicles: PlateVehicle[] = [
  {
    registration: "AB22XYZ",
    model: "Audi A4",
    status: "upcoming",
    authority: "London",
    expiryDate: "11-15-26",
  },
  {
    registration: "CD34ABC",
    model: "Audi A4",
    status: "expired",
    authority: "London",
    expiryDate: "10-20-26",
  },
  {
    registration: "EF56DEF",
    model: "Mercedes C-Class",
    status: "expired",
    authority: "London",
    expiryDate: "10-20-26",
  },
  {
    registration: "GH78GHI",
    model: "Tesla Model S",
    status: "urgent",
    authority: "Birmingham",
    expiryDate: "10-20-26",
  },
  {
    registration: "AB23XYZ",
    model: "Mercedes C-Class",
    status: "upcoming",
    authority: "Manchester",
    expiryDate: "12-01-26",
  },
  {
    registration: "AB21XYZ",
    model: "BMW 3 Series",
    status: "upcoming",
    authority: "Manchester",
    expiryDate: "10-20-26",
  },
  {
    registration: "GH78GHI",
    model: "Tesla Model S",
    status: "urgent",
    authority: "Manchester",
    expiryDate: "10-20-26",
  },
  {
    registration: "EF56DEF",
    model: "Mercedes C-Class",
    status: "expired",
    authority: "Birmingham",
    expiryDate: "10-20-26",
  },
];

const summaryItems = [
  {
    label: "Expired",
    value: 20,
    className: "bg-red-100 text-red-500",
  },
  {
    label: "Upcoming",
    value: 16,
    className: "bg-blue-100 text-blue-600",
  },
  {
    label: "Urgent",
    value: 12,
    className: "bg-orange-100 text-orange-500",
  },
];

const plateStatusStyles: Record<
  PlateStatus,
  {
    label: string;
    className: string;
    expiryClassName: string;
  }
> = {
  expired: {
    label: "Expired",
    className: "bg-red-100 text-red-400",
    expiryClassName: "text-red-500",
  },
  upcoming: {
    label: "Upcoming",
    className: "bg-blue-100 text-blue-500",
    expiryClassName: "text-neutral-500",
  },
  urgent: {
    label: "Urgent",
    className: "bg-orange-100 text-orange-500",
    expiryClassName: "text-red-500",
  },
};

function FilterButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="flex items-center gap-2 rounded p-2 text-sm font-weight-400 font-normal leading-4 text-blue-600"
    >
      <span>{label}</span>

      <svg
        className="h-4 w-4"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  );
}

function PlateStatusBadge({ status }: { status: PlateStatus }) {
  const statusData = plateStatusStyles[status];

  return (
    <span
      className={`inline-flex items-center justify-center rounded px-2 py-1 text-[14px] font-weight-400 font-normal ${statusData.className}`}
    >
      {statusData.label}
    </span>
  );
}

function PlateVehicleCard({ vehicle }: { vehicle: PlateVehicle }) {
  const statusData = plateStatusStyles[vehicle.status];

  return (
    <div className="flex min-h-32 flex-col gap-5 rounded-lg border border-neutral-200 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-weight-500 text-black">
            {vehicle.registration}
          </h3>
          <p className="text-[14px] font-weight-400 font-normal text-neutral-700">
            {vehicle.model}
          </p>
        </div>

        <PlateStatusBadge status={vehicle.status} />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-[14px] font-weight-400 font-normal text-neutral-500">
          Authority: <span className="font-weight-600">{vehicle.authority}</span>
        </p>

        <p className={`text-[14px] font-weight-400 font-normal ${statusData.expiryClassName}`}>
          Expiry Date: {vehicle.expiryDate}
        </p>
      </div>
    </div>
  );
}

export default function PlateExpiry() {
  return (
    <section className="w-full rounded-lg border border-neutral-200 px-4 py-6 font-['Stack_Sans_Headline']">
      <div className="flex flex-col gap-10">
        <h2 className="text-xl font-weight-600 leading-5 text-black">
          Plate Expiry
        </h2>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
              <p className="text-2xl font-weight-600 leading-6 text-black">
                32 Vehicles
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <FilterButton label="Registration" />
                <FilterButton label="Licensing Authority" />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {summaryItems.map((item) => (
                <div
                  key={item.label}
                  className={`rounded p-3 text-sm font-weight-400 font-normal leading-4 ${item.className}`}
                >
                  {item.label} {item.value}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {plateVehicles.map((vehicle, index) => (
              <PlateVehicleCard
                key={`${vehicle.registration}-${vehicle.model}-${index}`}
                vehicle={vehicle}
              />
            ))}
          </div>

          <div className="flex justify-center pt-4">
            <button
              type="button"
              className="inline-flex h-8 items-center justify-center rounded bg-blue-100 px-3 py-2 text-sm font-weight-400 font-normal leading-4 text-blue-600 transition hover:bg-blue-200"
            >
              View All Vehicles
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
