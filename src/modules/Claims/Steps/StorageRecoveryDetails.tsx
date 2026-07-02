import { useReportCompletion, isAllFilled } from "../Components/ClaimCompletion";
import pencil from "../../../assets/AutoClaim_icon/pencil.svg";
import trash from "../../../assets/AutoClaim_icon/trash.svg";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "react-toastify";
import { useFormik } from "formik";
import * as Yup from 'yup'
import { createStorageRecovery, getStorageRecoveryProvider, updateStorageRecovery } from "../../../services/StorageRecovery/StorageRecovery";
import { StorageProviderModal } from "./StorageProviderModal";
import { RecoveryProviderModal } from "./RecoveryProviderModal";

export const StorageRecoveryDetails = ({ formRef, claimId }: any) => {
  const [storageRecoveryId, setStorageRecoveryId] = useState<string | null>(null);
  // --- MODAL STATES ---
  const [storageProviderModal, setStorageProviderModalOpen] = useState(false);
  const [recoveryProviderModal, setRecoveryProviderModalOpen] = useState(false);

  const [editingStorageProvider, setEditingStorageProvider] =
    useState<any>(null);
  const [editingRecoveryProvider, setEditingRecoveryProvider] =
    useState<any>(null);

  const cleanPayload = (obj: any) => {
    if (obj === "") return null;

    if (Array.isArray(obj)) {
      return obj.map(cleanPayload);
    }

    if (obj !== null && typeof obj === "object") {
      return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [key, cleanPayload(value)]),
      );
    }

    return obj;
  };
  const formatDate = (val: string | Date | null) => {
    if (!val) return null;
    const d = new Date(val);
    return d.toISOString().split("T")[0];
  };
  const formik = useFormik({
    initialValues: {
      storages: [],
      recoveries: [],
    },
    validationSchema: Yup.object().shape({}),
    onSubmit: async (values: any) => {
      try {
        const payload = {
          storages: values.storages.map((s: any) => ({
            ...s,
            claim_id: parseInt(claimId),
            start_date: formatDate(s.start_date),
            end_date: formatDate(s.end_date),
          })),
          recoveries: values.recoveries.map((r: any) => ({
            ...r,
            claim_id: parseInt(claimId),
            date_of_recovery: formatDate(r.date_of_recovery),
          })),
        };

        const payloadToSend = cleanPayload(payload);
        // return
        let response;
        if (claimId && storageRecoveryId) {
          response = await updateStorageRecovery(payloadToSend, parseInt(claimId));
        } else {
          response = await createStorageRecovery(payloadToSend);
        }
        if (response?.id) setStorageRecoveryId(String(response.id));
        toast.success("Storage recovery details saved successfully");
      } catch (error) {
        toast.error("Error saving storage recovery details");
        throw error;
      }
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      const response = await getStorageRecoveryProvider(parseInt(claimId));
      const storageRecovery = response.data || response;
      if (
        storageRecovery.storages.length !== 0 ||
        storageRecovery.recoveries.length !== 0
      ) {
        // setIsEditing(true);
        const parsedStorages = (storageRecovery.storages || []).map(
          (s: any) => ({
            ...s,
            claim_id: claimId,
            total_storage_days: Number(s.total_storage_days || ""),
            charge_per_day: Number(s.charge_per_day || 25),
            id: Number(s.id),
            total_storage_charges: Number(s.total_storage_charges || ""),
            currency: s.currency || "GBP",
          }),
        );
        const parsedRecoveries = (storageRecovery.recoveries || []).map(
          (r: any) => ({
            ...r,
            claim_id: claimId,
            recovery_charges: Number(r.recovery_charges || ""),
            id: Number(r.id),
            currency: r.currency || "GBP",
          }),
        );
        formik.setValues({
          storages:
            parsedStorages.length > 0 ? parsedStorages : [],
          recoveries:
            parsedRecoveries.length > 0 ? parsedRecoveries : [],
        });
      }
    };
    if (claimId) {
      fetchData().catch((err) => {
        if (err?.response?.status !== 404) {
          // toast.error("Failed to load storage recovery details");
        }
      });
    }
  }, [claimId]);
  useEffect(() => {
    if (formRef) {
      formRef.current = formik;
    }
  }, [formRef, formik]);

  useReportCompletion(isAllFilled(formik.values));

  // --- MAP EDIT LOGIC ---
  const handleEditStorage = (item: any) => {
    setEditingStorageProvider(item);
    setStorageProviderModalOpen(true);
  };

  const handleEditRecovery = (item: any) => {
    setEditingRecoveryProvider(item);
    setRecoveryProviderModalOpen(true);
  };

  // --- DELETE LOGIC ---
  const handleDeleteStorage = (id: any) => {
    const updated = formik.values.storages.filter((s: any) => s.id !== id);
    formik.setFieldValue("storages", updated);
    toast.success("Storage provider removed");
  };

  const handleDeleteRecovery = (id: any) => {
    const updated = formik.values.recoveries.filter((r: any) => r.id !== id);
    formik.setFieldValue("recoveries", updated);
    toast.success("Recovery provider removed");
  };


  return (
    <div className="MainContent w-full flex flex-col items-start gap-6 py-1 font-['Stack_Sans_Headline']">
      {storageProviderModal && (
        <StorageProviderModal
          onClose={() => setStorageProviderModalOpen(false)}
          claimId={claimId}
          initialData={editingStorageProvider}
          formik={formik}
        />
      )}
      {recoveryProviderModal && (
        <RecoveryProviderModal
          onClose={() => setRecoveryProviderModalOpen(false)}
          claimId={claimId}
          initialData={editingRecoveryProvider}
          formik={formik}
        />
      )}
      {/* Container matching left-[534px] and top-[157px] from source */}
      <h1 className="text-neutral-900 text-[24px] font-weight-600 font-['Stack_Sans_Headline']">
        Storage & Recovery
      </h1>

      <div className="self-stretch flex flex-col gap-4 mt-6">
        {/* Passengers Row */}
        <div className="bg-neutral-100 p-4 rounded-lg flex flex-col gap-3">
          {/* Header */}
          <div className="flex justify-between items-center">
            <span className="text-black font-weight-600">Storage Provider</span>
            <button
              className="flex items-center gap-2 px-3 py-1.5 rounded text-blue-300 text-sm font-weight-400 hover:bg-blue-50 transition-colors"
              onClick={() => {
                setEditingStorageProvider(null);
                setStorageProviderModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4" />
              Add Storage Provider
            </button>
          </div>

          {/* Passenger List Rendering */}
          {formik.values.storages.length > 0 ? (
            formik.values.storages.map((s: any, index: number) => (
              <div
                key={s.id || index}
                className="self-stretch px-4 py-3 bg-white rounded-lg flex flex-col gap-2 border border-neutral-100"
              >
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <div className="text-neutral-700 text-sm font-weight-600 ">
                      {s.storage_provider || "Provider Name"}
                    </div>
                    <div className="flex gap-3 text-xs">
                      <span className="font-weight-600  text-neutral-700">
                        {s.name || "Contact Person"}
                      </span>
                      <span className="text-neutral-500">
                        {s.address?.email}
                      </span>
                      <span className="text-neutral-700">
                        {s.address?.mobile_tel}
                      </span>
                    </div>
                    <div className="text-neutral-500 text-xs">
                      {s.address?.address} - {s.address?.postcode}
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <img
                      src={pencil}
                      className="w-4 h-4 cursor-pointer"
                      onClick={() => handleEditStorage(s)}
                    />
                    <img
                      src={trash}
                      className="w-4 h-4 cursor-pointer"
                      onClick={() => handleDeleteStorage(s.id)}
                    />
                  </div>
                </div>
                <div className="h-0 border-t border-neutral-100 w-full" />
                <div className="text-xs text-neutral-700">
                  Total Charges for {s.total_storage_days || 0} Days (
                  {s.start_date} to {s.end_date}) :
                  <span className="text-sm font-weight-600 ">
                    {" "}
                    £{s.total_storage_charges || 0}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <span className="text-neutral-700 font-light font-weight-300 text-sm">
              Add Primary Storage provider by clicking on “Add Storage Provider”
            </span>
          )}
        </div>

        {/* Witnesses Details Box */}
        <div className="bg-neutral-100 p-4 rounded-lg flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-black text-base font-weight-600">
              Recovery Provider
            </span>
            <button
              className="flex items-center gap-2 px-3 py-1.5 rounded text-blue-300 text-sm font-weight-400 hover:bg-blue-50"
              onClick={() => {
                setEditingRecoveryProvider(null);
                setRecoveryProviderModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4" />
              Add Recovery Provider
            </button>
          </div>

          {formik.values.recoveries.length > 0 ? (
            formik.values.recoveries.map((r: any, index: number) => (
              <div
                key={r.id || index}
                className="self-stretch px-4 py-3 bg-white rounded-lg flex flex-col gap-2 border border-neutral-100"
              >
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <div className="text-neutral-700 text-sm font-weight-600 ">
                      {r.recovery_provider || "Provider Name"}
                    </div>
                    <div className="flex gap-3 text-xs">
                      <span className="font-weight-600  text-neutral-700">
                        {r.name || "Contact Person"}
                      </span>
                      <span className="text-neutral-500">
                        {r.address?.email}
                      </span>
                      <span className="text-neutral-700">
                        {r.address?.mobile_tel}
                      </span>
                    </div>
                    <div className="text-neutral-500 text-xs">
                      {r.address?.address} - {r.address?.postcode}
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <img
                      src={pencil}
                      className="w-4 h-4 cursor-pointer"
                      onClick={() => handleEditRecovery(r)}
                    />
                    <img
                      src={trash}
                      className="w-4 h-4 cursor-pointer"
                      onClick={() => handleDeleteRecovery(r.id)}
                    />
                  </div>
                </div>
                <div className="h-0 border-t border-neutral-100 w-full" />
                <div className="flex gap-4 items-center">
                  <div className="text-xs text-neutral-700">
                    Recovery Date:{" "}
                    <span className="font-weight-600 ">
                      {r.date_of_recovery}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-700">
                    Total Charges:{" "}
                    <span className="text-sm font-weight-600 ">
                      £{r.recovery_charges || 0}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <span className="text-neutral-700 font-light font-weight-300 text-sm">
              Add Primary Recovery provider by clicking on “Add Recovery
              Provider”
            </span>
          )}
        </div>
      </div>
    </div>
  );
};;
