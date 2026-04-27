import Label from "../common/label";
import { CalendarDateTime } from "@internationalized/date";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState, useCallback } from "react";
import { Field, Formik } from "formik";
import { useParams } from "react-router-dom";
import { DatePicker } from "../application/date-picker/date-picker";
import { useSelector } from "react-redux";
import {
  createDriverDocumentAgreement,
  getDriverDocumentAgreement,
  updateDriverDocumentAgreement,
} from "../../services/DriverDocumentAgreement/DriverDocumentAgreement";
import { toast } from "react-toastify";
import { parseCalendarDate } from "../../common/common";
import * as Yup from "yup";

const validationSchema = Yup.object().shape({
  // claim_id: Yup.number().required("Claim ID is required"),
});

export interface PanelSolicitorDetailsProps {
  claimData?: any;
  isEditMode?: boolean;
  onSuccess?: () => void;
  handleNext?: (step: number, direction: string) => void;
  skipNext: boolean;
}

const DriverDocumentAgreement = forwardRef(
  ({ handleNext, skipNext }: PanelSolicitorDetailsProps, ref) => {
    const searchParams = new URLSearchParams(window.location.search);
    const claimID = searchParams.get("claimid");
    const { id } = useParams();
    const [isEditing, setIsEditing] = useState(false);
    const { isClosed } = useSelector((state: any) => state.isClosed);
    const formikRef = useRef<any>(null);

    const [dateValues, setDateValues] = useState<Record<string, CalendarDateTime | null>>({});
    const [initialValues, setInitialValues] = useState<Record<string, any>>({
      claim_id: claimID || 0,
    });

    useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

    const combineDateAndTimeToTimestamp = (date: Date | null, timeStr?: string): string | null => {
      if (!date) return null;
      const d = new Date(date);
      if (timeStr) {
        const [hh, mm] = timeStr.split(":").map(Number);
        d.setHours(hh, mm, 0, 0);
      }
      return d.toISOString();
    };

    const fetchDriverDocumentAgreement = useCallback(
      async (claim_id: string) => {
        try {
          const response = await getDriverDocumentAgreement(claim_id);
          const data = response.data || response;
          if (!data) return;

          setIsEditing(true);

          const fields = [
            "driver_license_received_on",
            "license_checks_completed_on",
            "proof_of_address_1_received_on",
            "proof_of_address_2_received_on",
            "pre_hire_bank_statement_received_on",
            "post_hire_bank_statement_received_on",
            "taxi_badge_received_on",
            "v5_received_on",
            "mot_certificate_received_on",
            "insurance_certificate_received_on",
            "suspension_notice_received_on",
            "suspension_uplift_received_on",
            "signed_cha_received_on",
            "signed_mitigation_received_on",
            "arf_received_on",
            "signed_cil_agreement_received_on",
          ];

          const newDateValues: Record<string, any> = {};
          const newInitialValues: Record<string, any> = { claim_id: claimID || 0 };

          fields.forEach((key) => {
            const formKey = key
              .replace("driver_license", "driver_licence")
              .replace("license_checks_completed_on", "driver_licence_checks_completed_on")
              .replace("pre_hire_bank_statement_received_on", "bank_statement_received_on_pre_hire")
              .replace("post_hire_bank_statement_received_on", "bank_statement_received_on_post_hire");

            if (data[key]) {
              const date = new Date(data[key]);
              newDateValues[formKey] = parseCalendarDate(date.toISOString().split("T")[0]);
              const hh = String(date.getHours()).padStart(2, "0");
              const mm = String(date.getMinutes()).padStart(2, "0");
              newInitialValues[`${formKey}_time`] = `${hh}:${mm}`;
              newInitialValues[formKey] = date;
            } else {
              newDateValues[formKey] = null;
              newInitialValues[`${formKey}_time`] = "";
              newInitialValues[formKey] = "";
            }
          });

          setDateValues(newDateValues);
          setInitialValues((prev) => ({ ...prev, ...newInitialValues }));
        } catch (error) {
          console.error("Error fetching driver document agreement:", error);
        }
      },
      [claimID]
    );

    useEffect(() => {
      const currentClaimId = claimID || id;
      if (currentClaimId) fetchDriverDocumentAgreement(currentClaimId);
    }, [id, claimID, fetchDriverDocumentAgreement]);

    const handleSubmit = async (values: any) => {
      try {
        const storedClaimId = claimID || id;

        const getTimestamp = (field: string) =>
          combineDateAndTimeToTimestamp(values[field], values[`${field}_time`]);

        const payload = {
          driver_license_received_on: getTimestamp("driver_licence_received_on"),
          license_checks_completed_on: getTimestamp("driver_licence_checks_completed_on"),
          proof_of_address_1_received_on: getTimestamp("proof_of_address_1_received_on"),
          proof_of_address_2_received_on: getTimestamp("proof_of_address_2_received_on"),
          pre_hire_bank_statement_received_on: getTimestamp("bank_statement_received_on_pre_hire"),
          post_hire_bank_statement_received_on: getTimestamp("bank_statement_received_on_post_hire"),
          taxi_badge_received_on: getTimestamp("taxi_badge_received_on"),
          v5_received_on: getTimestamp("v5_received_on"),
          mot_certificate_received_on: getTimestamp("mot_certificate_received_on"),
          insurance_certificate_received_on: getTimestamp("insurance_certificate_received_on"),
          suspension_notice_received_on: getTimestamp("suspension_notice_received_on"),
          suspension_uplift_received_on: getTimestamp("suspension_uplift_received_on"),
          signed_cha_received_on: getTimestamp("signed_cha_received_on"),
          signed_mitigation_received_on: getTimestamp("signed_mitigation_received_on"),
          arf_received_on: getTimestamp("arf_received_on"),
          signed_cil_agreement_received_on: getTimestamp("signed_cil_agreement_received_on"),
          claim_id: storedClaimId || 0,
        };

        if (storedClaimId && isEditing) {
          await updateDriverDocumentAgreement(payload, storedClaimId);
        } else {
          await createDriverDocumentAgreement(payload);
        }

        toast.success("Driver Document Agreement saved successfully");
        if (handleNext && !skipNext) handleNext(18, "next");
      } catch (error: any) {
        toast.error("Unable to save driver document agreement");
        console.error("Error submitting form:", error);
      }
    };

    useImperativeHandle(ref, () => ({
      submitForm: async () => {
        if (!formikRef.current) {
            throw new Error('Formik instance not available');
        }
        await formikRef.current.submitForm();
        return true;
      }
    }));

    const renderDateField = (fields: { name: string; label: string }[]) =>
      fields.map(({ name, label }) => (
        <div key={name} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="col-span-3 lg:col-span-1">
            <Label htmlFor={name}>{label}</Label>
          </div>
          <div className="col-span-3 lg:col-span-2">
            <Field name={name}>
              {({ form }: any) => (
                <div className="flex flex-col gap-1">
                  <DatePicker
                    isDisabled={isClosed}
                    value={dateValues[name]}
                    onChange={(newDate) => {
                      if (!newDate) return;
                      setDateValues((prev) => ({ ...prev, [name]: newDate }));
                      form.setFieldValue(name, newDate);

                      const now = new Date();
                      const hh = String(now.getHours()).padStart(2, "0");
                      const mm = String(now.getMinutes()).padStart(2, "0");
                      form.setFieldValue(`${name}_time`, `${hh}:${mm}`);
                    }}
                    className="w-full"
                  />

                  {form.values[`${name}_time`] && (
                    <p className="text-xs text-gray-500 mt-1">
                      Captured at: {form.values[`${name}_time`]}
                    </p>
                  )}
                </div>
              )}
            </Field>
          </div>
        </div>
      ));

    return (
      <div className="sm:pt-8 pb-8 sm:pb-12 sm:pr-4 lg:pr-10 bg-white">
        <Formik
          initialValues={initialValues}
          onSubmit={handleSubmit}
          validationSchema={validationSchema}
          innerRef={formikRef}
          enableReinitialize
        >
          {() => (
            <>
              {/* DRIVER PROOFS */}
              <div className="border-b border-cloudGray mb-5 mt-4">
                <h2 className="text-lg font-weight-600  mb-2 sm:text-xl">Driver Proofs</h2>
                <p className="pb-5 text-lightGray text-sm font-normal">
                  Enter details for Driver Proofs
                </p>
              </div>

              <form className="space-y-4">
                {renderDateField([
                  { name: "driver_licence_received_on", label: "Driving Licence Received On" },
                  { name: "driver_licence_checks_completed_on", label: "Driving Licence Checks Completed On" },
                  { name: "proof_of_address_1_received_on", label: "Proof of Address 1 Received On" },
                  { name: "proof_of_address_2_received_on", label: "Proof of Address 2 Received On" },
                  { name: "bank_statement_received_on_pre_hire", label: "Bank Statement Received On (Pre-Hire)" },
                  { name: "bank_statement_received_on_post_hire", label: "Bank Statement Received On (Post-Hire)" },
                  { name: "taxi_badge_received_on", label: "Taxi Badge Received On" },
                  { name: "v5_received_on", label: "V5 Received On" },
                  { name: "mot_certificate_received_on", label: "MOT Certificate Received On" },
                  { name: "insurance_certificate_received_on", label: "Insurance Certificate Received On" },
                  { name: "suspension_notice_received_on", label: "Suspension Notice Received On" },
                  { name: "suspension_uplift_received_on", label: "Suspension UPLIFT Received On" },
                ])}
              </form>

              <div className="border-b border-cloudGray my-5">
                <h2 className="text-secondary text-lg font-weight-600">Agreements & Statements</h2>
                <p className="pb-5 text-lightGray text-sm font-normal">
                  Enter details for Agreements & Statements
                </p>
              </div>

              <form className="space-y-4">
                {renderDateField([
                  { name: "signed_cha_received_on", label: "Signed CHA Received On" },
                  { name: "signed_mitigation_received_on", label: "Signed Mitigation Received On" },
                  { name: "arf_received_on", label: "ARF Received On" },
                  { name: "signed_cil_agreement_received_on", label: "Signed CIL Agreement Received On" },
                ])}
              </form>
            </>
          )}
        </Formik>
      </div>
    );
  }
);

DriverDocumentAgreement.displayName = "DriverDocumentAgreement";

export default DriverDocumentAgreement;
