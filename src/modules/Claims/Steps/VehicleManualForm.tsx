import React, { useCallback, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import Select from "react-select";
import BlackFront from "../../../assets/Black/Group.svg";
import CheckIcon from "../../../assets/AutoClaim_icon/checkgreen.svg";
import BlackRear from "../../../assets/Black/Group-1.svg";
import BlackRoof from "../../../assets/Black/Group-2.svg";
import BlackNearsideFront from "../../../assets/Black/Group-3.svg";
import BlackNearsideMiddle from "../../../assets/Black/Group-4.svg";
import BlackNearsideRear from "../../../assets/Black/Group-5.svg";
import BlackOffsideFront from "../../../assets/Black/Group-6.svg";
import BlackOffsideMiddle from "../../../assets/Black/Group-7.svg";
import BlackOffsideRear from "../../../assets/Black/Group-8.svg";
import CrossIcon from "../../../assets/AutoClaim_icon/CrossIcon.svg";
import RedFront from "../../../assets/Red/Group.svg";
import RedRear from "../../../assets/Red/Group-1.svg";
import RedRoof from "../../../assets/Red/Group-2.svg";
import RedNearsideFront from "../../../assets/Red/Group-3.svg";
import RedNearsideMiddle from "../../../assets/Red/Group-4.svg";
import RedNearsideRear from "../../../assets/Red/Group-5.svg";
import RedOffsideFront from "../../../assets/Red/Group-6.svg";
import RedOffsideMiddle from "../../../assets/Red/Group-7.svg";
import RedOffsideRear from "../../../assets/Red/Group-8.svg";
import { BlueDropdownIndicator, customStyles } from "./GeneralDetailsForm";
import { saveDamageDetails, updateVehicleDamage } from "../../../services/VehicleDamage/VehicleDamage";
import { getVehicleDetail } from "../../../services/Vehicle/vehicle";
import { toast } from "react-toastify";
type DamageSection = "client" | "thirdParty";

interface Zone {
  label: string;
  black: string;
  red: string;
}

const zones: Zone[] = [
  { label: "Front", black: BlackFront, red: RedFront },
  { label: "Rear", black: BlackRear, red: RedRear },
  { label: "Roof", black: BlackRoof, red: RedRoof },
  { label: "Nearside Front", black: BlackNearsideFront, red: RedNearsideFront },
  {
    label: "Nearside Middle",
    black: BlackNearsideMiddle,
    red: RedNearsideMiddle,
  },
  { label: "Nearside Rear", black: BlackNearsideRear, red: RedNearsideRear },
  { label: "Offside Front", black: BlackOffsideFront, red: RedOffsideFront },
  { label: "Offside Middle", black: BlackOffsideMiddle, red: RedOffsideMiddle },
  { label: "Offside Rear", black: BlackOffsideRear, red: RedOffsideRear },
];

const statusOptions = [
  { value: 1, label: "Roadworthy" },
  { value: 2, label: "Unroadworthy" },
  { value: 3, label: "TBC" },
].sort((a, b) => String(a.label).localeCompare(String(b.label)));

const VehicleManualForm = ({formRef, claimId}:any) => {
  const formik = useFormik({
    initialValues: {
      client: {
        areaDamage: [] as string[],
        unrelatedDamage: "",
        status: null as any,
      },
      thirdParty: {
        areaDamage: [] as string[],
        unrelatedDamage: "",
        status: null as any,
      },
    },

    validationSchema: Yup.object({
     
    }),

    validate: (values) => {
      const errors: any = {};

      if (
        values.client.areaDamage.length === 0 &&
        values.thirdParty.areaDamage.length === 0
      ) {
        errors.damage = "Select at least one damage area";
      }

      return errors;
    },

    onSubmit: async (values) => {
      try {
        setIsLoading(true);

        const payload = {
          claim_id: parseInt(claimId) || 0,

          vehicle_detail: {
            id: parseInt(clientVehicleId) || 0,
            client_area_of_damage: values.client.areaDamage.join(", "),
            client_unrelated_damage: values.client.unrelatedDamage || "",
            client_vehicle_status_id: values.client.status?.value || null,
          },

          third_party_vehicle_detail: {
            id: parseInt(thirdPartyVehicleId) || 0,
            client_area_of_damage: values.thirdParty.areaDamage.join(", "),
            client_unrelated_damage: values.thirdParty.unrelatedDamage || "",
            client_vehicle_status_id: values.thirdParty.status?.value || null,
          },
        };
  await updateVehicleDamage(payload);
        //   if (manualDataId) {
        //       await updateVehicleDamage(payload);
        //   }
        //   else {
        //       await saveDamageDetails(payload)
        //   }

          toast.success("Vehicle damage saved successfully");
      } catch (error: any) {
        console.error(error);
          toast.error("Failed to save vehicle damage");
          throw error
      } finally {
        setIsLoading(false);
      }
    },
  });
    const [clientVehicleId, setClientVehicleId] = React.useState("");
    const [thirdPartyVehicleId, setThirdPartyVehicleId] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);
        useEffect(() => {
          if (formRef) {
            formRef.current = formik;
          }
        }, [formRef, formik]);
const loadData = async () => {
  try {
    setIsLoading(true);

    const vehicleData = await getVehicleDetail(parseInt(claimId));

    // CLIENT
    const clientZones = vehicleData.damage_area
      ? vehicleData.damage_area.split(", ")
      : [];

    // THIRD PARTY
    const thirdZones = vehicleData.third_party_vehicles?.[0]?.damage_area
      ? vehicleData.third_party_vehicles[0].damage_area.split(", ")
      : [];

    formik.setValues({
      client: {
        areaDamage: clientZones,
        unrelatedDamage: vehicleData.unrelated_damage || "",
        status:
          statusOptions.find(
            (s) => s.value === vehicleData.vehicle_status_id,
          ) || null,
      },
      thirdParty: {
        areaDamage: thirdZones,
        unrelatedDamage:
          vehicleData.third_party_vehicles?.[0]?.unrelated_damage || "",
        status:
          statusOptions.find(
            (s) =>
              s.value ===
              vehicleData.third_party_vehicles?.[0]?.vehicle_status_id,
          ) || null,
      },
    });

    setClientVehicleId(vehicleData.id || "");
    setThirdPartyVehicleId(vehicleData.third_party_vehicles?.[0]?.id || "");
  } catch (error) {
    console.error(error);
    // toast.error("Failed to load vehicle data");
  } finally {
    setIsLoading(false);
  }
};useEffect(() => {
  if (claimId) {
    loadData();
  }
}, [claimId]);
  const toggleZone = (section: DamageSection, zone: string) => {
    const current = formik.values[section].areaDamage;

    if (current.includes(zone)) {
      formik.setFieldValue(
        `${section}.areaDamage`,
        current.filter((z) => z !== zone),
      );
    } else {
      formik.setFieldValue(`${section}.areaDamage`, [...current, zone]);
    }
  };
const RightPanel = useCallback(
  ({ section, title }: { section: DamageSection; title: string }) => {
    const selectedZones = formik.values[section].areaDamage;

    return (
      <div className="flex-1 min-w-0 flex flex-col gap-4 font-['Stack_Sans_Headline']">
        <div className="flex flex-col gap-2 w-full">
          <div className="text-neutral-700 text-sm font-weight-400">
            {title} Area of Damage
          </div>

          <div className="min-h-12 p-2.5 rounded border border-neutral-200 flex items-center flex-wrap gap-2">
            {selectedZones.length === 0 && (
              <span className="text-neutral-400 text-sm">No area selected</span>
            )}

            {selectedZones.map((z) => (
              <div
                key={z}
                className="px-3 py-1 bg-blue-100 rounded flex items-center gap-2"
              >
                <span className="text-sm font-weight-400 text-black">{z}</span>
                <img
                  src={CrossIcon}
                  className="cursor-pointer"
                  alt=""
                  onClick={() => toggleZone(section, z)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full">
          <label className="text-neutral-700 text-sm font-weight-400">
            {title} Unrelated Damage
          </label>

          <textarea
            name={`${section}.unrelatedDamage`}
            value={formik.values[section].unrelatedDamage}
            onChange={formik.handleChange}
            placeholder="Enter Description"
            className="h-24 px-5 py-4 border border-neutral-200 rounded resize-none text-base"
          />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <label className="text-neutral-700 text-sm font-weight-400">
            {title} Vehicle Status
          </label>

          <Select
            options={statusOptions}
            styles={customStyles}
            components={{
              DropdownIndicator: BlueDropdownIndicator,
              IndicatorSeparator: () => null,
            }}
            value={formik.values[section].status}
            onChange={(val) => formik.setFieldValue(`${section}.status`, val)}
          />
        </div>
      </div>
    );
  },
  [formik.values],
);
  const renderZones = (section: DamageSection) => {
    return zones.map((zone) => {
      const selected = formik.values[section].areaDamage.includes(zone.label);

      const imgSrc = section === "client" ? zone.black : zone.red;

        return (
          <div
            key={zone.label}
            onClick={() => toggleZone(section, zone.label)}
            className={`cursor-pointer w-full max-w-[160px] xl:max-w-none h-44 p-4 bg-white rounded-lg border flex flex-col items-center justify-end ${zone.label === "Roof" ? "gap-2" : "gap-5"} 
        ${selected ? "border-blue-200" : "border-gray-200"}
        hover:border-blue-200`}
          >
            {selected && <img className="w-7 h-7" src={CheckIcon} />}
            <img src={imgSrc} />

            <p className="text-sm text-gray-700">{zone.label}</p>
          </div>
        );
    });
  };
const SectionHeader = ({ title }: { title: string }) => {
  return (
    <div className="w-full max-w-80 flex flex-col items-start gap-1.5">
      <div className="w-full text-black text-base font-weight-400 leading-4">
        {title}
      </div>

      <div className="w-full text-neutral-600 text-sm font-weight-300 font-light">
        Select all the damaged areas from the list below
      </div>
    </div>
  );
};

  return (
    <form
      onSubmit={formik.handleSubmit}
      className="flex flex-col gap-10 w-full mx-auto font-['Stack_Sans_Headline']"
    >
      {/* CLIENT VEHICLE */}
      <div className="border rounded-xl p-6 flex flex-col gap-10">
        <SectionHeader title="Client Vehicle Damage Areas" />
        <div className="flex flex-col xl:flex-row gap-6 xl:gap-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-neutral-100 p-4 sm:p-6 rounded-lg w-full xl:w-auto">
            {renderZones("client")}
          </div>

          <RightPanel section="client" title="Client" />
        </div>
      </div>

      {/* THIRD PARTY */}
      <div className="border rounded-xl p-6 flex flex-col gap-10">
        <SectionHeader title="Third Party Vehicle Damage Areas" />
        <div className="flex flex-col xl:flex-row gap-6 xl:gap-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-neutral-100 p-4 sm:p-6 rounded-lg w-full xl:w-auto">
            {renderZones("thirdParty")}
          </div>

          <RightPanel section="thirdParty" title="Third Party" />
        </div>
      </div>

      {/* GLOBAL VALIDATION */}
      {/* {formik.errors.damage && (
        <p className="text-red-500 text-sm">{formik.errors.damage}</p>
      )} */}

      {/* ACTIONS */}
      {/* <div className="flex gap-4 justify-end">
        <button
          type="button"
          onClick={() => formik.resetForm()}
          className="px-6 py-2 border rounded"
        >
          Reset
        </button>

        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded"
        >
          Update
        </button>
      </div> */}
    </form>
  );
};

export default VehicleManualForm;