type VehicleStatus = "available" | "hire" | "repair" | "cams";

type Vehicle = {
  registration: string;
  model: string;
  status: VehicleStatus;
  hireInfo?: string;
  customer?: string;
};

const vehicles: Vehicle[] = [
  {
    registration: "AB21XYZ",
    model: "BMW 3 Series",
    status: "available",
  },
  {
    registration: "CD34ABC",
    model: "Audi A4",
    status: "hire",
    hireInfo: "On Hire for 10 Days",
    customer: "Emily Johnson",
  },
  {
    registration: "EF56DEF",
    model: "Mercedes C-Class",
    status: "repair",
  },
  {
    registration: "EF56DEF",
    model: "Mercedes C-Class",
    status: "hire",
    hireInfo: "On Hire for 7 Days",
    customer: "Michael Brown",
  },
  {
    registration: "CD34ABC",
    model: "Tesla Model S",
    status: "cams",
  },
  {
    registration: "EF56DEF",
    model: "Audi A4",
    status: "repair",
  },
  {
    registration: "GH78GHI",
    model: "Mercedes C-Class",
    status: "hire",
    hireInfo: "On Hire for 3 Days",
    customer: "Sara Wilson",
  },
  {
    registration: "IJ90JKL",
    model: "Ford Mustang",
    status: "cams",
    hireInfo: "On Hire for 7 Days",
    customer: "David Lee",
  },
];

const summaryItems = [
  {
    label: "Available",
    value: 20,
    className: "bg-green-100 text-green-700",
  },
  {
    label: "On Hire",
    value: 16,
    className: "bg-blue-100 text-blue-600",
  },
  {
    label: "In Repair",
    value: 12,
    className: "bg-orange-100 text-orange-500",
  },
  {
    label: "CAMS Cars",
    value: 12,
    className: "bg-gray-200 text-zinc-500",
  },
];

const statusStyles: Record<
  VehicleStatus,
  {
    label: string;
    className: string;
  }
> = {
  available: {
    label: "Available",
    className: "bg-green-100 text-green-700",
  },
  hire: {
    label: "On Hire",
    className: "bg-slate-200 text-blue-600",
  },
  repair: {
    label: "In Repair",
    className: "bg-orange-100 text-orange-500",
  },
  cams: {
    label: "CAMS Cars",
    className: "bg-gray-200 text-zinc-500",
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

function StatusBadge({ status }: { status: VehicleStatus }) {
  const statusData = statusStyles[status];

  return (
    <span
      className={`inline-flex items-center justify-center rounded px-2 py-1 text-xs font-weight-400 font-normal ${statusData.className}`}
    >
      {statusData.label}
    </span>
  );
}

function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <div className="flex min-h-32 flex-1 justify-between rounded-lg border border-neutral-200 p-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-weight-500 text-black">
            {vehicle.registration}
          </h3>
          <p className="text-xs font-weight-400 font-normal text-neutral-700">
            {vehicle.model}
          </p>
        </div>

        {vehicle.hireInfo && (
          <div className="flex flex-col gap-1">
            <p className="text-xs font-weight-400 font-normal text-neutral-700">
              {vehicle.hireInfo}
            </p>
            {vehicle.customer && (
              <p className="text-xs font-weight-400 font-normal text-neutral-500">
                {vehicle.customer}
              </p>
            )}
          </div>
        )}
      </div>

      <StatusBadge status={vehicle.status} />
    </div>
  );
}

export default function FleetOperations() {
  return (
    <section className="w-full rounded-lg border border-neutral-200 px-4 py-6  font-['Stack_Sans_Headline']">
      <div className="flex flex-col gap-10">
        <h2 className="text-xl font-weight-600 leading-5 text-black">
          Fleet Operations
        </h2>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
              <div className="flex flex-col gap-1">
                <p className="text-2xl font-weight-600 leading-6 text-black">
                  45 Vehicles
                </p>
                <p className="text-sm font-weight-500 text-zinc-500">Total Fleet</p>
              </div>

              <div className="flex items-start gap-5">
                <FilterButton label="Registration" />
                <FilterButton label="Status" />
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

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {vehicles.map((vehicle, index) => (
              <VehicleCard
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