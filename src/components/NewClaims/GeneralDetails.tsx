import {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import { ChevronDown } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import {
  getClaimTypes,
  getHandlers,
  getTargetDebts,
  getCaseStatuses,
  getSourceChannels,
  getProspects,
  getPresentPositions,
  closeFile,
} from "../../services/Lookups/Generaldetails";
import { ClaimsApi, type ClaimFormPayload } from "../../services/Claims/Claims";
import CustomSelect from "../ReactSelect/ReactSelect";
import { MdArrowOutward } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import {
  setClaimId,
  setClaimReferrence,
  setIsClosed,
} from "../../redux/Claim/claimSlice";
import {
  getClientByClaimID,
  notifyManager,
} from "../../services/Client/Client";
import { getLocalTimeZone, today } from "@internationalized/date";
import type { DateValue } from "react-aria-components";
import { DatePicker } from "../application/date-picker/date-picker";
import { CalendarDate } from "@internationalized/date";
import { toast } from "react-toastify";

interface LookupItem {
  id: number;
  label: string;
  sort_order?: number;
  is_active?: boolean;
}

interface FormValues {
  claim_type_id: number;
  handler_id: number;
  target_debt_id: number;
  source_id: number;
  source_staff_user_id: number;
  case_status_id: number;
  credit_hire_accepted: boolean;
  non_fault_accident: "YES" | "NO" | "TBC";
  any_passengers: "YES" | "NO" | "TBC";
  client_injured: "YES" | "NO" | "TBC";
  prospects_id: number;
  file_opened_on: string;
  file_closed_on: string | null;
  present_position_id: number;
  // file_position_id: number;
  client_going_abroad: boolean;
  client_going_abroad_date: string;
  date: string;
}

interface GeneralDetailsProps {
  claimData?: any;
  isEditMode?: boolean;
  onSuccess?: () => void;
  handleNext?: (step: number, direction: string) => void;
  skipNext: boolean;
}

const validationSchema = Yup.object().shape({
  // claim_type_id: Yup.number().min(1, 'Claim Type is required').required('Claim Type is required'),
  // handler_id: Yup.number().min(1, 'Handler is required').required('Handler is required'),
  // target_debt_id: Yup.number().min(1, 'Target debt is required').required('Target debt is required'),
  // source_id: Yup.number().min(1, 'Source is required').required('Source is required'),
  // case_status_id: Yup.number().min(1, 'Case status is required').required('Case status is required'),
  // prospects_id: Yup.number().min(1, 'Prospects is required').required('Prospects is required'),
  // date: Yup.string().required('Date is required'),
});
const GeneralDetails = forwardRef(
  (
    {
      claimData,
      isEditMode = false,
      onSuccess,
      handleNext,
      skipNext,
      isEditing,
    }: GeneralDetailsProps,
    ref
  ) => {
    const navigate = useNavigate();
    const [claimTypes, setClaimTypes] = useState<LookupItem[]>([]);
    const [handlers, setHandlers] = useState<LookupItem[]>([]);
    const [targetDebts, setTargetDebts] = useState<LookupItem[]>([]);
    const [caseStatuses, setCaseStatuses] = useState<LookupItem[]>([]);
    const [sourceChannels, setSourceChannels] = useState<LookupItem[]>([]);
    const [prospects, setProspects] = useState<LookupItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filePositions, setFilePositions] = useState<LookupItem[]>([]);
    const [isFileClosed, setIsFileClosed] = useState(false);
    const [closureReason, setClosureReason] = useState("");
    const [closeReasonViewModal, setCloseReasonViewModal] = useState(false);
    const searchParams = new URLSearchParams(window.location.search);
    const username = localStorage.getItem("user_name");
    const { id } = useParams();

    const now = today(getLocalTimeZone());

    const [fileOpenedOn, setFileOpenedOn] = useState<DateValue | any>(now);
    const [abroadDate, setAbroadDate] = useState<DateValue | any>(now);
    const [fileClosedOn, setFileClosedOn] = useState<DateValue | any>(now);

    const formikRef = useRef<any>(null);

    const dispatch = useDispatch();
    const { isClosed, surname, selectedPosition } = useSelector(
      (state) => state.isClosed
    );

    useEffect(() => {
      window.scrollTo(0, 0);
    }, []);

    const getInitialValues = (): FormValues => {
      if (claimData) {
        return {
          claim_type_id: claimData.claim_type_id || null,
          handler_id: claimData.handler_id || null,
          target_debt_id: claimData.target_debt_id || null,
          source_id: claimData.source_id || null,
          source_staff_user_id: claimData.source_staff_user_id,
          case_status_id: claimData.case_status_id || null,
          credit_hire_accepted: claimData.credit_hire_accepted || false,
          non_fault_accident: claimData.non_fault_accident || "NO",
          any_passengers: claimData.any_passengers || "NO",
          client_injured: claimData.client_injured || "NO",
          prospects_id: claimData.prospects_id || null,
          present_position_id: claimData?.present_position_id || null,
          file_opened_on: claimData.file_opened_at
            ? new Date(claimData.file_opened_at).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          file_closed_on: claimData.file_closed_at
            ? new Date(claimData.file_closed_at).toISOString().split("T")[0]
            : null,
          client_going_abroad: claimData?.client_going_abroad
            ? true
            : false,
          client_going_abroad_date: claimData.abroad_date || "",
          date: claimData.date || new Date().toISOString().split("T")[0],
        };
      }
      return {
        claim_type_id: null,
        handler_id: null,
        target_debt_id: null,
        source_id: null,
        source_staff_user_id: null,
        case_status_id: null,
        credit_hire_accepted: false,
        non_fault_accident: "NO",
        any_passengers: "NO",
        client_injured: "NO",
        prospects_id: null,
        present_position_id: null,
        file_opened_on: new Date().toISOString().split("T")[0],
        file_closed_on: null,
        client_going_abroad: false,
        client_going_abroad_date: "",
        date: new Date().toISOString().split("T")[0],
      };
    };

    const initialValues: FormValues = getInitialValues();

    useEffect(() => {
      const fetchData = async () => {
        const date = new Date(claimData?.created_at);
        const yyyymm = `${date.getFullYear()}${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;
        const paddedId = String(claimData?.id).padStart(4, "0");
        const parseCalendarDate = (dateStr?: any) => {
          if (!dateStr) return undefined;
          const [year, month, day] = dateStr.split("-").map(Number);
          if (!year || !month || !day) return undefined;
          return new CalendarDate(year, month, day);
        };

        if (id || searchParams.get("claimid")) {
          try {
            const res = await getClientByClaimID(
              claimData?.id || id || searchParams.get("claimid")
            );
            if (res?.surname === null || res?.surname === "") {
              localStorage.setItem(
                "reference_number",
                `${res.surname}-${yyyymm}-${paddedId}`
              );
              dispatch(setClaimReferrence(`Add New Claim`));
            } else {
              localStorage.setItem(
                "reference_number",
                `${res.surname}-${yyyymm}-${paddedId}`
              );
              dispatch(
                setClaimReferrence(`${res.surname}-${yyyymm}-${paddedId}`)
              );
            }
          } catch (e) {}

          setAbroadDate(parseCalendarDate(claimData?.abroad_date));
          setFileClosedOn(parseCalendarDate(claimData?.file_closed_at));
          setFileOpenedOn(
            parseCalendarDate(claimData?.file_opened_at.split("T")[0])
          );
        }
        if (typeof claimData?.file_closed_at === "string") {
          localStorage.setItem("isClosed", claimData?.file_closed_at);
          dispatch(setIsClosed(true));
        } else {
          dispatch(setIsClosed(false));
        }
        try {
          const [
            claimTypesRes,
            handlersRes,
            targetDebtsRes,
            caseStatusesRes,
            sourceChannelsRes,
            prospectsRes,
            filePositionsRes,
          ] = await Promise.all([
            getClaimTypes(),
            getHandlers(),
            getTargetDebts(),
            getCaseStatuses(),
            getSourceChannels(),
            getProspects(),
            getPresentPositions(),
          ]);
          setClaimTypes(claimTypesRes.data);
          setHandlers(handlersRes.data);
          setTargetDebts(targetDebtsRes.data);
          setCaseStatuses(caseStatusesRes.data);
          setSourceChannels(sourceChannelsRes.data);
          setProspects(prospectsRes.data);
          setFilePositions(filePositionsRes.data);
        } catch (error) {
          console.error("Error fetching lookup data:", error);
        }
      };

      fetchData();
    }, []);

    const handleCloseFile = async (setFieldValue: any) => {
      try {
        await closeFile({ reason: closureReason, claim_id: id });
        setIsFileClosed(false);
        navigate("/claims");
      } catch (e) {}
    };

    // const formatCalendarDate = (date?: CalendarDate) => {
    //   if (!date) return undefined;
    //   const jsDate = new Date(date.year, date.month - 1, date.day);
    //   return jsDate.toISOString().split("T")[0];
    // };

    const formatCalendarDate = (date?: CalendarDate) => {
      if (!date) return undefined;

      // Directly format without using Date constructor to avoid timezone issues
      const year = date.year;
      const month = String(date.month).padStart(2, "0");
      const day = String(date.day).padStart(2, "0");

      return `${year}-${month}-${day}`;
    };
    const handleSubmit = async (values: FormValues) => {
      if (!isEditing) {
        setIsLoading(true);
      }
      const abroadFormattedDate = formatCalendarDate(abroadDate);
      const openFormatted = formatCalendarDate(fileOpenedOn);
      const closeFormatted = formatCalendarDate(fileClosedOn);
      setIsLoading(true);
      const storedClaimId = id || searchParams.get("claimid");

      const payload: ClaimFormPayload = {
        ...values,
        client_going_abroad: values.client_going_abroad === "true",
        abroad_date:
          values.client_going_abroad === "true"
            ? abroadFormattedDate
            : undefined,
        file_opened_on: values.file_opened_on ? openFormatted : undefined,
        file_closed_on: values.file_closed_on ? closeFormatted : undefined,
      };

      if (!values.source_staff_user_id || values.source_staff_user_id === 0) {
        delete (payload as any).source_staff_user_id;
      }

      try {
        let response;
        if (storedClaimId && isEditing) {
          response = await ClaimsApi.updateClaim(claimData.id, payload);
        } else {
          response = await ClaimsApi.submitClaim(payload);
        }

        toast.success("General Details saved successfully");
        if (response?.id && !isEditing) {
          const url = new URL(window.location.href);
          url.searchParams.set("claimid", response?.id);
          dispatch(setClaimId(response?.id));
          window.history.pushState({}, "", url);
        }
        setIsLoading(false);

        if (onSuccess) onSuccess();
        if (handleNext && selectedPosition.key !== "sideBar")
          handleNext(2, "next");

        return response;
      } catch (error: any) {
        if (error.response?.data?.detail === "Claim is closed/locked.") {
          setIsLoading(false);
        }
        // toast.error('Unable to save general details')
        throw error;
      }
    };
    useImperativeHandle(ref, () => ({
      submitForm: async () => {
        if (!formikRef.current) {
          console.error("❌ Formik ref is NULL");
          throw new Error("Formik instance not available");
        }
        await formikRef.current.submitForm();
        return true;
      },
    }));

    function openOutlookCompose(to: string, subject: string, body: string) {
      const encodedTo = encodeURIComponent(to);
      const encodedSubject = encodeURIComponent(subject);
      const encodedBody = encodeURIComponent(body);

      const officeUrl = `https://outlook.office.com/mail/deeplink/compose?to=${""}&subject=${encodedSubject}&body=${encodedBody}`;
      const liveUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${""}&subject=${encodedSubject}&body=${encodedBody}`;
      const mailtoUrl = `mailto:${""}?subject=${encodedSubject}&body=${encodedBody}`;

      const newTab = window.open(officeUrl, "_blank");

      if (!newTab) {
        window.location.href = mailtoUrl;
        return;
      }

      setTimeout(() => {
        try {
          window.open(liveUrl, "_blank");
        } catch (e) {
          console.warn("Live URL popup blocked or failed", e);
        }
      }, 1000);
    }

    const handleNotifyManager = async () => {
      try {
        const res = await notifyManager(id || searchParams.get("claimid"));
        const subject = res?.data?.data?.subject;
        const body =
          `Case No: ${res.data.data.reference}\n` +
          `Client: ${res?.data.data.client_name}\n\n` +
          `Date: ${res?.data.data.date}\n\n` +
          `Hi,\n${res?.data?.data?.message_body}.\n\nRegards,\nClaim Handler`;
        openOutlookCompose("", subject, body);
        toast.success("Manager Notification email sent");
      } catch (e) {}
    };

    if (isLoading) {
      return (
        <div className={`flex justify-center items-center h-screen bg-gray-50`}>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    return (
      <div className=" pb-8 sm:pb-12  bg-white">
        <Formik
          innerRef={formikRef}
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ values, setFieldValue, touched, errors }) => (
            <Form>
              <div className="sm:pt-8 pb-8 sm:pb-12 sm:pr-4 lg:pr-10 bg-white mt-2">
                <div className="flex-1 ">
                  {/* Case Details Section */}
                  <div className="border-b border-gray-200 mb-6">
                    <div className="pb-6">
                      <h2 className="text-lg font-semibold  mb-2 sm:text-xl">
                        Case Details
                      </h2>
                      <p className="text-sm text-gray-600">
                        Enter the case general details here
                      </p>
                      <hr className="mt-6 w-full" />
                    </div>
                    <div className="pt-2">
                      <div className="grid gap-8">
                        <div>
                          {/* Claim Type */}
                          <div className="flex items-center mb-6">
                            <label className="w-1/4 text-sm mr-24 font-medium text-gray-700">
                              Claim type
                            </label>
                            <div className="relative w-3/4">
                              <Field name="claim_type_id">
                                {({ field, form }: any) => (
                                  <CustomSelect
                                    options={claimTypes.map((c: any) => ({
                                      value: c.id,
                                      label: c.label,
                                    }))}
                                    value={
                                      claimTypes
                                        .map((c: any) => ({
                                          value: c.id,
                                          label: c.label,
                                        }))
                                        .find(
                                          (opt: any) =>
                                            opt.value === field.value
                                        ) || null
                                    }
                                    onChange={(option) =>
                                      form.setFieldValue(
                                        "claim_type_id",
                                        option ? option.value : 0
                                      )
                                    }
                                    placeholder="Select claim type"
                                    disabled={isClosed}
                                  />
                                )}
                              </Field>
                              <ErrorMessage
                                name="claim_type_id"
                                component="div"
                                className="text-red-500 text-xs mt-1"
                              />
                            </div>
                          </div>

                          {/* Handler */}
                          <div className="flex items-center mb-6">
                            <label className="w-1/4 text-sm mr-24 font-medium text-gray-700">
                              Handler
                            </label>
                            <div className="relative w-3/4">
                              <Field name="handler_id">
                                {({ field, form, meta }: any) => (
                                  // <div>
                                  <CustomSelect
                                    options={handlers.map((h: any) => ({
                                      value: h.id,
                                      label: h.label,
                                    }))}
                                    value={
                                      handlers
                                        .map((h: any) => ({
                                          value: h.id,
                                          label: h.label,
                                        }))
                                        .find(
                                          (opt: any) =>
                                            opt.value === field.value
                                        ) || null
                                    }
                                    onChange={(option) =>
                                      form.setFieldValue(
                                        "handler_id",
                                        option ? option.value : 0
                                      )
                                    }
                                    placeholder="Select handler"
                                    disabled={isClosed}
                                  />
                                  // </div>
                                )}
                              </Field>
                              <ErrorMessage
                                name="handler_id"
                                component="div"
                                className="text-red-500 text-xs mt-1"
                              />
                            </div>
                          </div>
                          {/* Target Debt */}
                          <div className="flex items-center mb-6">
                            <label className="w-1/4 text-sm mr-24 font-medium text-gray-700">
                              Target Debt
                            </label>
                            <div className="relative w-3/4">
                              <Field name="target_debt_id">
                                {({ field, form, meta }: any) => (
                                  <div>
                                    <CustomSelect
                                      options={targetDebts.map((d: any) => ({
                                        value: d.id,
                                        label: d.label,
                                      }))}
                                      value={
                                        targetDebts
                                          .map((d: any) => ({
                                            value: d.id,
                                            label: d.label,
                                          }))
                                          .find(
                                            (opt: any) =>
                                              opt.value === field.value
                                          ) || null
                                      }
                                      onChange={(option) =>
                                        form.setFieldValue(
                                          "target_debt_id",
                                          option ? option.value : 0
                                        )
                                      }
                                      placeholder="Select target debt"
                                      disabled={isClosed}
                                    />
                                  </div>
                                )}
                              </Field>
                              <ErrorMessage
                                name="target_debt_id"
                                component="div"
                                className="text-red-500 text-xs mt-1"
                              />
                            </div>
                          </div>

                          {/* Source Channel */}
                          <div className="flex items-center mb-6">
                            <label className="w-1/4 text-sm mr-24 font-medium text-gray-700">
                              How did the customer find us?
                            </label>
                            <div className="relative w-3/4">
                              <Field name="source_id">
                                {({ field, form }: any) => {
                                  const selectedSource = sourceChannels.find(
                                    (s: any) => s.id === field.value
                                  );
                                  return (
                                    <CustomSelect
                                      options={sourceChannels.map((s: any) => ({
                                        value: s.id,
                                        label: s.label,
                                        required_staff: s.requires_staff,
                                      }))}
                                      value={
                                        sourceChannels
                                          .map((s: any) => ({
                                            value: s.id,
                                            label: s.label,
                                          }))
                                          .find(
                                            (opt: any) =>
                                              opt.value === field.value
                                          ) || null
                                      }
                                      onChange={(option) =>
                                        form.setFieldValue(
                                          "source_id",
                                          option ? option.value : 0
                                        )
                                      }
                                      placeholder="Select source"
                                      disabled={isClosed}
                                    />
                                  );
                                }}
                              </Field>
                              <ErrorMessage
                                name="source_id"
                                component="div"
                                className="text-red-500 text-xs mt-1"
                              />
                            </div>
                          </div>

                          {/* Show staff field only if required_staff is true */}
                          {(() => {
                            const selectedSource = sourceChannels.find(
                              (s: any) => s.id === values?.source_id
                            );
                            if (selectedSource?.requires_staff) {
                              return (
                                <div className="flex items-center mb-6">
                                  <label className="w-1/4 text-sm mr-24 font-medium text-gray-700">
                                    If staff marketing which?
                                  </label>
                                  <div className="relative w-3/4">
                                    <Field name="source_staff_user_id">
                                      {({ field, form }: any) => (
                                        <CustomSelect
                                          options={handlers.map((h: any) => ({
                                            value: h.id,
                                            label: h.label,
                                          }))}
                                          value={
                                            handlers
                                              .map((h: any) => ({
                                                value: h.id,
                                                label: h.label,
                                              }))
                                              .find(
                                                (opt: any) =>
                                                  opt.value === field.value
                                              ) || null
                                          }
                                          onChange={(option) =>
                                            form.setFieldValue(
                                              "source_staff_user_id",
                                              option ? option.value : null
                                            )
                                          }
                                          placeholder="Select staff member"
                                          disabled={isClosed}
                                        />
                                      )}
                                    </Field>
                                    <ErrorMessage
                                      name="source_staff_user_id"
                                      component="div"
                                      className="text-red-500 text-xs mt-1"
                                    />
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })()}
                          {/* Case Status */}
                          <div className="flex items-center mb-6">
                            <label className="w-1/4 text-sm mr-24 font-medium text-gray-700">
                              Case status
                            </label>
                            <div className="relative w-3/4">
                              <Field name="case_status_id">
                                {({ field, form, meta }: any) => (
                                  <div>
                                    <CustomSelect
                                      options={caseStatuses.map((s: any) => ({
                                        value: s.id,
                                        label: s.label,
                                      }))}
                                      value={
                                        caseStatuses
                                          .map((s: any) => ({
                                            value: s.id,
                                            label: s.label,
                                          }))
                                          .find(
                                            (opt: any) =>
                                              opt.value === field.value
                                          ) || null
                                      }
                                      onChange={(option) =>
                                        form.setFieldValue(
                                          "case_status_id",
                                          option ? option.value : 0
                                        )
                                      }
                                      placeholder="Select status"
                                      disabled={isClosed}
                                    />
                                  </div>
                                )}
                              </Field>
                              <ErrorMessage
                                name="case_status_id"
                                component="div"
                                className="text-red-500 text-xs mt-1"
                              />
                            </div>
                          </div>

                          {/* Credit Hire Accepted */}
                          <div className="flex items-center mb-6">
                            <label className="w-1/4 text-sm mr-24 font-medium text-gray-700">
                              Credit Hire Accepted?
                            </label>
                            <div className="relative w-3/4">
                              <Field name="credit_hire_accepted">
                                {({ field, form, meta }: any) => {
                                  const options = [
                                    { value: "false", label: "No" },
                                    { value: "true", label: "Accepted" },
                                  ];

                                  return (
                                    <div>
                                      <CustomSelect
                                        options={options}
                                        value={
                                          options.find(
                                            (opt) =>
                                              opt.value === String(field.value)
                                          ) || null
                                        }
                                        onChange={(option) => {
                                          form.setFieldValue(
                                            "credit_hire_accepted",
                                            option ? option.value : "false"
                                          );
                                        }}
                                        placeholder="Select status"
                                        disabled={isClosed}
                                      />

                                      {meta.touched && meta.error && (
                                        <div className="text-red-500 text-xs mt-1">
                                          {meta.error}
                                        </div>
                                      )}
                                    </div>
                                  );
                                }}
                              </Field>

                              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                            </div>
                          </div>

                          {/* Non-fault Accident */}
                          <div className="flex items-center mb-6">
                            <label className="w-1/4 text-sm mr-24 font-medium text-gray-700">
                              Non fault accident?
                            </label>
                            <div className="relative w-3/4">
                              <Field name="non_fault_accident">
                                {({ field, form, meta }: any) => {
                                  const options = [
                                    { value: "YES", label: "Yes" },
                                    { value: "NO", label: "No" },
                                    { value: "TBC", label: "TBC" },
                                  ];

                                  return (
                                    <div>
                                      <CustomSelect
                                        options={options}
                                        value={
                                          options.find(
                                            (opt) => opt.value === field.value
                                          ) || null
                                        }
                                        onChange={(option) =>
                                          form.setFieldValue(
                                            "non_fault_accident",
                                            option ? option.value : "NO"
                                          )
                                        }
                                        placeholder="Select accident status"
                                        disabled={isClosed}
                                      />
                                    </div>
                                  );
                                }}
                              </Field>
                              <ErrorMessage
                                name="non_fault_accident"
                                component="div"
                                className="text-red-500 text-xs mt-1"
                              />
                              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                            </div>
                          </div>

                          {/* Any Passengers */}
                          <div className="flex items-center mb-6">
                            <label className="w-1/4 text-sm mr-24 font-medium text-gray-700">
                              Any passengers?
                            </label>
                            <div className="relative w-3/4">
                              <Field name="any_passengers">
                                {({ field, form, meta }: any) => {
                                  const options = [
                                    { value: "YES", label: "Yes" },
                                    { value: "NO", label: "No" },
                                    { value: "TBC", label: "TBC" },
                                  ];

                                  return (
                                    <div>
                                      <CustomSelect
                                        options={options}
                                        value={
                                          options.find(
                                            (opt) => opt.value === field.value
                                          ) || null
                                        }
                                        onChange={(option) =>
                                          form.setFieldValue(
                                            "any_passengers",
                                            option ? option.value : "NO"
                                          )
                                        }
                                        placeholder="Select passengers status"
                                        disabled={isClosed}
                                      />
                                    </div>
                                  );
                                }}
                              </Field>
                              <ErrorMessage
                                name="any_passengers"
                                component="div"
                                className="text-red-500 text-xs mt-1"
                              />
                              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                            </div>
                          </div>

                          {/* Client Injured */}
                          <div className="flex items-center mb-6">
                            <label className="w-1/4 text-sm mr-24 font-medium text-gray-700">
                              Client injured?
                            </label>
                            <div className="relative w-3/4">
                              <Field name="client_injured">
                                {({ field, form, meta }: any) => {
                                  const options = [
                                    { value: "YES", label: "Yes" },
                                    { value: "NO", label: "No" },
                                    { value: "TBC", label: "TBC" },
                                  ];

                                  return (
                                    <div>
                                      <CustomSelect
                                        options={options}
                                        value={
                                          options.find(
                                            (opt) => opt.value === field.value
                                          ) || null
                                        }
                                        onChange={(option) =>
                                          form.setFieldValue(
                                            "client_injured",
                                            option ? option.value : "NO"
                                          )
                                        }
                                        placeholder="Select injury status"
                                        disabled={isClosed}
                                      />
                                    </div>
                                  );
                                }}
                              </Field>
                              <ErrorMessage
                                name="client_injured"
                                component="div"
                                className="text-red-500 text-xs mt-1"
                              />
                              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                            </div>
                          </div>

                          {/* Prospects */}
                          <div className="flex items-center mb-6">
                            <label className="w-1/4 text-sm mr-24 font-medium text-gray-700">
                              Prospects of file
                            </label>
                            <div className="relative w-3/4">
                              <Field name="prospects_id">
                                {({ field, form, meta }: any) => {
                                  const options = prospects.map((p: any) => ({
                                    value: p.id,
                                    label: p.label,
                                  }));

                                  return (
                                    <div>
                                      <CustomSelect
                                        options={options}
                                        value={
                                          options.find(
                                            (opt) => opt.value === field.value
                                          ) || null
                                        }
                                        onChange={(option) =>
                                          form.setFieldValue(
                                            "prospects_id",
                                            option ? option.value : 0
                                          )
                                        }
                                        placeholder="Select prospects"
                                        disabled={isClosed}
                                      />
                                    </div>
                                  );
                                }}
                              </Field>
                              <ErrorMessage
                                name="prospects_id"
                                component="div"
                                className="text-red-500 text-xs mt-1"
                              />
                              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Position Details Section */}
                  <div className="border-b border-gray-200 mb-6">
                    <div className="pb-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-lg font-semibold  mb-2 sm:text-xl">
                            Position Details
                          </h2>
                          <p className="text-sm text-gray-600">
                            Enter the file position details here
                          </p>
                        </div>
                        {!values.file_closed_on && (
                          <button
                            type="button"
                            onClick={() => setIsFileClosed(true)}
                            className="px-4 py-2 bg-white-600 text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-none border focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                          >
                            Close File
                          </button>
                        )}
                      </div>
                      <hr className="mt-6 w-full " />
                    </div>

                    <div className="pt-2">
                      <div className="grid gap-8">
                        <div>
                          {/* File Opened On */}
                          <div className="flex items-center mb-6">
                            <label className="w-1/4 text-sm mr-24 font-medium text-gray-700">
                              File opened on
                            </label>
                            <div className="relative w-3/4">
                              <Field name="file_opened_on">
                                {({ field, form }) => (
                                  <div className="relative inline-block w-full">
                                    <DatePicker
                                      aria-label="Date picker"
                                      isDisabled={isClosed}
                                      value={fileOpenedOn}
                                      onChange={setFileOpenedOn}
                                    />
                                  </div>
                                )}
                              </Field>
                            </div>
                          </div>

                          {/* Claim Entrant's Username */}
                          <div className="flex items-center mb-6">
                            <label className="w-1/4 text-sm mr-24 font-medium text-gray-700">
                              Claim entrant's username
                            </label>
                            <div className="w-3/4">
                              <input
                                type="text"
                                value={username}
                                disabled
                                style={{ height: "44px" }}
                                className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:outline-none cursor-not-allowed"
                              />
                            </div>
                          </div>

                          {values.file_closed_on !== null && (
                            <div className="flex items-center mb-6">
                              <label className="w-1/4 text-sm mr-24 font-medium text-gray-700">
                                File Closed on
                              </label>
                              <div className="relative w-3/4">
                                <Field
                                  name="file_closed_on"
                                  className="w-full p-3 border border-gray-300 rounded-lg bg-white cursor-not-allowed focus:outline-none "
                                >
                                  {({ field, form }) => (
                                    <DatePicker
                                      aria-label="Date picker"
                                      isDisabled={isClosed}
                                      value={fileClosedOn}
                                      onChange={setFileClosedOn}
                                    />
                                  )}
                                </Field>
                                <div
                                  className="flex cursor-pointer mt-3"
                                  onClick={() => setCloseReasonViewModal(true)}
                                >
                                  <h2 className="text-sm cursor-pointer mb-4 font-semibold text-[#7f56d9]">
                                    View close reason
                                  </h2>
                                  <MdArrowOutward className="text-[#7f56d9] mt-[3px] ml-2" />
                                </div>
                              </div>
                            </div>
                          )}

                          <hr className="border-gray-200 my-6" />

                          {/* Present File Position Header */}
                          <div className="flex items-center justify-between mb-6">
                            <div>
                              <h2 className="text-lg font-semibold text-gray-900">
                                Present File Position
                              </h2>
                              <p className="text-sm text-gray-600">
                                Enter Present File Position details
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleNotifyManager()}
                              className="px-4 py-2 bg-white-600 text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-none border focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                              disabled={!!values.file_closed_on}
                            >
                              Notify Manager
                            </button>
                          </div>

                          <hr className="border-gray-200 my-6" />

                          {/* Present File Position Field */}
                          <div className="flex items-center mb-6">
                            <label className="w-1/4 text-sm mr-24 font-medium text-gray-700">
                              Present File Position
                            </label>
                            <div className="relative w-3/4">
                              <Field name="present_position_id">
                                {({ field, form }: any) => (
                                  <CustomSelect
                                    options={filePositions.map((c: any) => ({
                                      value: c.id,
                                      label: c.label,
                                    }))}
                                    value={
                                      filePositions
                                        .map((c: any) => ({
                                          value: c.id,
                                          label: c.label,
                                        }))
                                        .find(
                                          (opt: any) =>
                                            opt.value === field.value
                                        ) || null
                                    }
                                    onChange={(option) =>
                                      form.setFieldValue(
                                        "present_position_id",
                                        option ? option.value : 0
                                      )
                                    }
                                    placeholder="Select Present File Position"
                                    disabled={isClosed}
                                  />
                                )}
                              </Field>
                              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                            </div>
                          </div>

                          {/* Client Going Abroad */}
                          <div className="flex items-center mb-6">
                            <label className="w-1/4 mr-24 text-sm font-medium text-gray-700">
                              Client going abroad soon?
                            </label>

                            <div className="w-3/4 flex items-center gap-6">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <Field
                                  type="radio"
                                  name="client_going_abroad"
                                  value="true"
                                  disabled={isClosed}
                                  className="w-4 h-4 accent-gray-600"
                                />
                                <span className="text-gray-900">Yes</span>
                              </label>

                              <label className="flex items-center gap-2 cursor-pointer">
                                <Field
                                  type="radio"
                                  name="client_going_abroad"
                                  value="false"
                                  disabled={isClosed}
                                  className="w-4 h-4 accent-gray-600"
                                />
                                <span className="text-gray-900">No</span>
                              </label>
                            </div>
                          </div>

                          {values.client_going_abroad === "true" && (
                            <div className="flex items-center mb-6">
                              <label className="w-1/4 mr-24 text-sm font-medium text-gray-700">
                                Date
                              </label>
                              <div className="relative w-3/4">
                                <Field
                                  name="client_going_abroad_date"
                                  className="w-full p-3 border border-gray-300 rounded-lg bg-white cursor-pointer focus:outline-none "
                                >
                                  {({}) => (
                                    <DatePicker
                                      isDisabled={isClosed}
                                      value={abroadDate}
                                      onChange={setAbroadDate}
                                    />
                                  )}
                                </Field>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* File closure modal */}
              {isFileClosed && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 w-full max-w-md">
                    <div className="flex justify-center">
                      <div className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 bg-white">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-gray-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-center mt-4">
                      Close File
                    </h3>
                    <p className="text-sm text-gray-600 text-center mt-2">
                      Please provide a reason below for closing this case
                    </p>
                    <textarea
                      value={closureReason}
                      onChange={(e) => setClosureReason(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg mt-4 mb-4 resize-none"
                      rows={4}
                      placeholder="Enter a reason..."
                    />
                    <div className="flex justify-between gap-4">
                      <button
                        type="button"
                        onClick={() => setIsFileClosed(false)}
                        className="w-1/2 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCloseFile(setFieldValue)}
                        disabled={!closureReason.trim()}
                        className={`w-1/2 py-2 text-sm text-white rounded-lg transition-colors ${
                          !closureReason.trim()
                            ? "bg-custom opacity-70 cursor-not-allowed"
                            : "bg-custom hover:bg-[#252B37]"
                        }`}
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {closeReasonViewModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 w-full max-w-md">
                    <div className="flex justify-center">
                      <div className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 bg-white">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-gray-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-center mt-4">
                      Claim Close Reason
                    </h3>
                    <p className="text-sm text-gray-600 text-center mt-2">
                      Case closed because of following reason
                    </p>
                    <textarea
                      value={claimData?.file_closed_reason}
                      onChange={(e) => setClosureReason(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg mt-4 mb-4 resize-none cursor-not-allowed"
                      rows={4}
                      disabled
                    />
                    <div className="flex justify-end gap-4">
                      <button
                        type="button"
                        onClick={() => setCloseReasonViewModal(false)}
                        className={`w-1/2 py-2 text-sm text-white rounded-lg transition-colors bg-custom hover:bg-custom`}
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </Form>
          )}
        </Formik>
      </div>
    );
  }
);
export default GeneralDetails;