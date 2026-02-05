import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { ChevronDown, Clock } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { createAccidentDetail, getAccidentDetailById, updateAccidentDetail } from '../../services/Accidents/Accident.tsx';
import LeafletAutocompleteMap from '../GoogleMapAutoComplete/GoogleMapAutoComplete.tsx';
import CustomDatePicker from '../DatePicker/CustomDatePicker.tsx';
import { DatePicker } from "../application/date-picker/date-picker";
import CustomSelect from '../ReactSelect/ReactSelect.tsx';
import { MdArrowOutward } from 'react-icons/md';
import { useSelector } from 'react-redux';
import PassengersModal from '../AccidentDetailsCards/PassengerDetailsCard.tsx';
import WitnessesModal from '../AccidentDetailsCards/WitnessDetailsCard.tsx';
import PoliceModal from '../AccidentDetailsCards/PoliceDetailsCard.tsx';

import { getLocalTimeZone, today } from "@internationalized/date";
import type { DateValue } from "react-aria-components";
import { toast } from 'react-toastify';
import AddPassengerModal from '../AccidentDetailsCards/AddPassenger.tsx';
import AddWitnessModal from '../AccidentDetailsCards/AddWitness.tsx';
import AddPoliceModal from "../AccidentDetailsCards/AddPolice.tsx";
import { parseCalendarDate } from '../../common/common.tsx';
import { Mail } from "lucide-react";

interface FormData {
  date: string;
  time: string;
  weather: string;
  location: string;
  versionOfEvents: string;
  servicesDate: string;
  servicesTime: string;
  passengers: string;
  numPassengers: number;
  witnesses: string;
  police: string;
  dashcam: string;
}

export interface AccidentDetailsHandle {
  submitForm: () => Promise<boolean>;
}

interface AccidentDetailsProps {
  claimId?: number;
  onSuccess?: () => void;
  formik?: any;
  skipNext: boolean;
  handleNext?: (step: number, direction: string) => void;
}

const validationSchema = Yup.object().shape({
  // date: Yup.date(),
  // time: Yup.string()
  //   .matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)")
  //   .required("Time is required"),
  // weather: Yup.string().required('Weather condition is required'),
  // versionOfEvents: Yup.string().required('Version of events is required'),
  // servicesDate: Yup.date(),
  // servicesTime: Yup.string()
  //   .matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/, "Invalid services time format (HH:mm)")
  //   .required("Services time is required"),
  // passengers: Yup.string().required('Please specify if there were passengers'),
  // numPassengers: Yup.number()
  //   .min(0, 'Number cannot be negative')
  //   .when('passengers', (passengers, schema) => {
  //     return passengers === 'Yes'
  //       ? schema.min(1, 'Must be at least 1 if passengers present')
  //       : schema;
  //   }),
  // witnesses: Yup.string().required('Please specify if there were witnesses'),
  // police: Yup.string().required('Please specify if police attended'),
  // dashcam: Yup.string().required('Please specify about dashcam footage'),
});

const AccidentDetails = forwardRef<AccidentDetailsHandle, AccidentDetailsProps>(({
  claimId,
  onSuccess,
  formik: parentFormik,
  handleNext,
  skipNext
}, ref) => {
  const formikRef = useRef<any>(null);
  const { id } = useParams();
  const searchParams = new URLSearchParams(window.location.search);
  const claimID = searchParams.get('claimid');
  const now = today(getLocalTimeZone());

  const [isPassengersModalOpen, setIsPassengersModalOpen] = useState(false);
  const [isWitnessesModalOpen, setIsWitnessesModalOpen] = useState(false);
  const [isPoliceModalOpen, setIsPoliceModalOpen] = useState(false);
  const [date, setDate] = useState<DateValue | null>(null)
  const [serviceDate, setServiceDate] = useState<DateValue | null>(null)
  const [passengersRefreshKey, setPassengersRefreshKey] = useState(0);
  const [witnessesRefreshKey, setWitnessesRefreshKey] = useState(0);
  const [policeRefreshKey, setPoliceRefreshKey] = useState(0);
  const bumpWitnessesRefresh = () => setWitnessesRefreshKey(k => k + 1);
  const bumpPoliceRefresh = () => setPoliceRefreshKey(k => k + 1);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddWitnessModalOpen, setIsAddWitnessModalOpen] = useState(false)
  const [isAddPoliceModalOpen, setIsAddPoliceModalOpen] = useState(false)
  const [editingPassengerId, setEditingPassengerId] = useState<number | null>(null);
  const [editingWitnessId, setEditingWitnessId] = useState<number | null>(null);
  const [editingPoliceId, setEditingPoliceId] = useState<number | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);


  const handleOpenPassengersModal = () => {
    setIsPassengersModalOpen(true);
  };

  const handleClosePassengersModal = () => {
    setIsPassengersModalOpen(false);
  };


  const handleOpenWitnessesModal = () => {
    setIsWitnessesModalOpen(true);
  };

  const handleCloseWitnessesModal = () => {
    setIsWitnessesModalOpen(false);
  };
  const handleOpenPoliceModal = () => {
    setIsPoliceModalOpen(true);
  };

  const handleClosePoliceModal = () => {
    setIsPoliceModalOpen(false);
  };

  const handleAddWitness = (newWitness: any) => {
    setWitnessesList([...witnessesList, newWitness]);
  };

  const handleAddPoliceDetail = (newPoliceDetail: any) => {
    setPoliceDetailsList([...policeDetailsList, newPoliceDetail]);
  };


  const [initialValues, setInitialValues] = useState<FormData>({
    date: '',
    time: '',
    weather: 'DRY',
    location: '',
    versionOfEvents: '',
    servicesDate: '',
    servicesTime: '',
    passengers: 'No',
    numPassengers: 0,
    witnesses: 'No',
    police: 'No',
    dashcam: 'No',
  });

  const [witnessesList, setWitnessesList] = useState<any[]>([]);
  const [policeDetailsList, setPoliceDetailsList] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false)
  const { isClosed } = useSelector((state) => state.isClosed)

  const toISODateTime = (date: any, time: any) => {
  if (!date || !time) return null;

  const [hours, minutes] = time.split(":").map(Number);

  // Create local Date object
  const jsDate = new Date(
    date.year,
    date.month - 1,
    date.day,
    hours,
    minutes,
    0,
    0
  );

  // Add 5 hours for UTC offset
  jsDate.setHours(jsDate.getHours() + 5);

  // Build ISO string manually without timezone conversion
  const yyyy = jsDate.getUTCFullYear();
  const mm = String(jsDate.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(jsDate.getUTCDate()).padStart(2, "0");
  const hh = String(jsDate.getUTCHours()).padStart(2, "0");
  const min = String(jsDate.getUTCMinutes()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}T${hh}:${min}:00`;
};


  useEffect(() => {
    const currentClaimId = claimID || id;
    if (currentClaimId) {
      const loadData = async () => {
        await fetchAccidentDetail(currentClaimId);
      }
      loadData()
    }
  }, [id, claimID])

  const fetchAccidentDetail = async (id: number) => {
    try {
      
      const res = await getAccidentDetailById(id);
      const accidentData = res.data || res;
      const mappedValues = {
        date: accidentData.date_time ? accidentData.date_time.split('T')[0] : '',
        time: accidentData.date_time ? accidentData.date_time.split('T')[1].split('+')[0] : '',
        weather: accidentData.condition || 'DRY',
        location: accidentData.location || '',
        versionOfEvents: accidentData.description || '',
        servicesDate: accidentData.service_date_time ? accidentData.service_date_time.split('T')[0] : '',
        servicesTime: accidentData.service_date_time ? accidentData.service_date_time.split('T')[1].split('+')[0] : '',
        passengers: accidentData.any_passenger ? 'Yes' : 'No',
        numPassengers: accidentData.passenger_no || 0,
        witnesses: accidentData.witness ? 'Yes' : 'No',
        police: accidentData.police_attend ? 'Yes' : 'No',
        dashcam: accidentData.dash_footage ? 'Yes' : 'No',
      };
      setDate(parseCalendarDate((accidentData.date_time as string)?.split('T')[0]));
      setServiceDate(parseCalendarDate(accidentData.service_date_time?.split('T')[0]));
      setIsEditing(true)

      setInitialValues(mappedValues);
    } catch (error) {
      setIsEditing(false)
      console.error('Error fetching accident details:', error);
    }
  };

  const handlePlaceSelected = (place: { name: string; lat: number; lng: number, postalCode: string }) => {
    if (formikRef.current) {
      const formik = formikRef.current;
      formik.setFieldValue('location', place.name || place.address || '');
      formik.setFieldValue('postcode', place.postalCode || '');
      if (place.lat) {
        formik.setFieldValue('latitude', place.lat);
      }
      if (place.lng) {
        formik.setFieldValue('longitude', place.lng);
      }
    }
  };

  <LeafletAutocompleteMap
    showMap={true}
    apiKey={import.meta.env.VITE_GOOGLE_MAP_KEY}
    address={initialValues.location}
    onPlaceSelected={handlePlaceSelected}
    disabled={isClosed}
  />

  const handleOpenAddModalForEdit = (passengerId: number) => {
    setEditingPassengerId(passengerId);
    setIsAddModalOpen(true);
  };

  const handleOpenAddWitnessModalForEdit = (witnessId: number) => {
    setEditingWitnessId(witnessId)
    setIsAddWitnessModalOpen(true)
  }

  const handleOpenAddPoliceModalForEdit = (policeId: number) => {
    setEditingPoliceId(policeId)
    setIsAddPoliceModalOpen(true)
  }

  const handleSubmit = async (values: FormData) => {
    const storedClaimId = id || claimID;
    try {
      if (!storedClaimId || storedClaimId === 0) {
        throw new Error('Invalid claim ID. Please create a claim first.');
      }

      const weatherMap = {
        'Dry': 'DRY',
        'Wet': 'WET',
        'Snow': 'SNOW',
        'Icy': 'ICY',
        'Foggy': 'FOGGY',
        'Rainy': 'RAINY'
      };
      const dateTimeString = toISODateTime(date, values.time);
      const serviceDateTimeString = toISODateTime(serviceDate, values.servicesTime);
      const accidentData = {
        location: values.location.address || values.location,
        description: values.versionOfEvents,
        date_time: dateTimeString,
        condition: values.weather,
        // weatherMap[values.weather as keyof typeof weatherMap] || 'DRY',
        service_date_time: serviceDateTimeString,
        any_passenger: values.passengers === 'Yes',
        passenger_no: values.passengers === 'Yes' ? values.numPassengers : 0,
        witness: values.witnesses === 'Yes',
        police_attend: values.police === 'Yes',
        dash_footage: values.dashcam === 'Yes',
        claim_id: storedClaimId,
        is_active: true
      };

      let newAccident
      if (storedClaimId && isEditing) {
        newAccident = await updateAccidentDetail(storedClaimId, accidentData)
      } else {
        newAccident = await createAccidentDetail(accidentData);
      }

      toast.success('Accident details saved successfully')

      if (onSuccess) onSuccess();
      if (handleNext && !skipNext) handleNext(5, 'next');

      return newAccident;
    } catch (error: any) {
      toast.error('Unable to save accident details')
      console.error('Error creating accident detail:', error);
      throw new Error(error.message || 'Failed to create accident details. Please try again.');
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

  return (
    <div className="pb-8 sm:pb-12 sm:pl-0 bg-white">
      <div className="flex flex-col lg:flex-row">
        <div className="flex-1 ">
          <Formik
            innerRef={formikRef}
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ values, setFieldValue }) => (
              <Form>
                <div className="mt-4">
                  <div className="bg-white rounded-xl p-0 mt-10 ">
                    <h2 className="text-lg font-semibold  mb-2 sm:text-xl">Location & Condition Details</h2>
                    <p className="text-xs  mb-4 sm:text-sm sm:mb-6">Enter the Location and Condition of accident.</p>
                    <hr className="mb-4 sm:mb-6 " />
                    <div className="flex flex-col sm:flex-row sm:items-center mb-4 sm:mb-6 w-full">
                      <label className="w-full sm:w-1/4 text-sm font-medium mb-1 sm:mb-0">
                        Date & Time
                      </label>

                      <div className="flex gap-3 w-full sm:w-3/4">
                        <div className="w-full">
                          <Field name="date">
                            {({ field, form }: any) => (
                              <DatePicker
                                
                                isDisabled={isClosed}
                                value={date}
                                onChange={(newDate) => {
                                  setDate(newDate);
                                  form.setFieldValue("date", newDate);
                                }}
                                className="w-full"
                              />
                            )}
                          </Field>
                        </div>

                        <div className="w-full relative">
                          <Field name="time">
                            {({ field, form }: any) => (
                              <div className="relative w-full">
                              <CustomDatePicker
                                aria-label="Select time"
                                showTimeSelect
                                showTimeSelectOnly
                                timeIntervals={15}
                                timeCaption="Time"
                                dateFormat="HH:mm"
                                selectedDate={
                                  field.value
                                    ? (() => {
                                      const [hh, mm] = field.value.split(":");
                                      return new Date(1970, 0, 1, Number(hh), Number(mm));
                                    })()
                                    : null
                                }
                                setSelectedDate={(date: Date | null) => {
                                  if (date) {
                                    const hh = String(date.getHours()).padStart(2, "0");
                                    const mm = String(date.getMinutes()).padStart(2, "0");
                                    form.setFieldValue("time", `${hh}:${mm}`);
                                  } else {
                                    form.setFieldValue("time", "");
                                  }
                                }}
                                disabled={isClosed}
                                className="w-full"
                              />
                              <Clock className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4 pointer-events-none" />
                            </div>
                            )}
                          </Field>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center mb-4 sm:mb-6">
                      <label className="w-full sm:w-1/4 text-sm font-medium mb-1 sm:mb-0">
                        Weather Conditions
                      </label>
                      <div className="relative w-full sm:w-3/4">
                        <Field name="weather">
                          {({ field, form, meta }: any) => {
                            const weatherOptions = [
                              { value: "DRY", label: "Dry" },
                              { value: "STROMY", label: "Stromy" },
                              { value: "CLOUDY", label: "Cloudy" },
                              { value: "SUNNY", label: "Sunny" },
                              { value: "RAINY", label: "Rainy" },
                            ];

                            return (
                              <div className="w-full">
                                <CustomSelect
                                  options={weatherOptions}
                                  value={weatherOptions.find((opt) => opt.value === field.value) || null}
                                  onChange={(option) => {
                                    form.setFieldValue(field.name, option ? option.value : "");
                                  }}
                                  placeholder="Select weather"
                                  disabled={isClosed}
                                />

                                {meta.touched && meta.error && (
                                  <div className="text-red-500 text-xs mt-1">{meta.error}</div>
                                )}
                              </div>
                            );
                          }}
                        </Field>

                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4  pointer-events-none" />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center mb-4 sm:mb-6">
                      <label className="w-full sm:w-1/4 text-sm font-medium  mb-1 sm:mb-0">
                        Location
                      </label>
                      <div className="relative w-full sm:w-3/4">
                        <LeafletAutocompleteMap
                          showMap={true}
                          apiKey={import.meta.env.VITE_GOOGLE_MAP_KEY}
                          address={initialValues.location}
                          onPlaceSelected={(place) => handlePlaceSelected(place, formikRef.current)}
                          disabled={isClosed}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-start mb-4 sm:mb-6">
                      <label className="w-full sm:w-1/4 text-sm font-medium mb-1 sm:mb-0 sm:mt-3">
                        Version of Events
                      </label>
                      <div className="w-full sm:w-3/4">
                        <Field
                          as="textarea"
                          name="versionOfEvents"
                          rows={3}
                          disabled={isClosed}
                          placeholder="Describe what happened in detail..."
                          className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white focus:outline-none resize-none "
                        />
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center mb-4 sm:mb-6 w-full">
                      <label className="w-full sm:w-1/4 text-sm font-medium mb-1 sm:mb-0">
                        Services Date & Time
                      </label>

                      <div className="flex gap-3 w-full sm:w-3/4">
                        <div className="w-full">
                          <Field name="servicesDate">
                            {({ field }: any) => (
                              <DatePicker
                                isDisabled={isClosed}
                                value={serviceDate}
                                onChange={setServiceDate}
                                className="w-full"
                              />
                            )}
                          </Field>
                        </div>

                        <div className="w-full relative">
                          <Field name="servicesTime">
                            {({ field }: any) => (
                              <div className="relative w-full">
                              <CustomDatePicker
                                showTimeSelect
                                aria-label="Select time"
                                showTimeSelectOnly
                                timeIntervals={15}
                                timeCaption="Time"
                                dateFormat="HH:mm"
                                selectedDate={
                                  field.value
                                    ? (() => {
                                      const [hh, mm] = field.value.split(":");
                                      return new Date(1970, 0, 1, Number(hh), Number(mm));
                                    })()
                                    : null
                                }
                                setSelectedDate={(date: Date | null) => {
                                  if (date) {
                                    const hh = String(date.getHours()).padStart(2, "0");
                                    const mm = String(date.getMinutes()).padStart(2, "0");
                                    setFieldValue("servicesTime", `${hh}:${mm}`);
                                  } else {
                                    setFieldValue("servicesTime", "");
                                  }
                                }}
                                disabled={isClosed}
                                className="w-full"
                              />
                              <Clock className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4 pointer-events-none" />
                            </div>
                            )}
                          </Field>
                        </div>
                      </div>
                    </div>


                    <hr className="" />
                  </div>

                  <div className="bg-white py-6">
                    <h2 className="text-lg font-semibold  mb-2 sm:text-xl">Attendees</h2>
                    <p className="text-xs text-gray-500  mb-4 sm:text-sm sm:mb-6">Enter attendees details below</p>
                    <hr className="mb-4 sm:mb-6 " />

                    <div className="flex flex-col sm:flex-row sm:items-center mb-4 sm:mb-6">
                      <label className="w-full sm:w-1/4 text-sm font-medium  mb-1 sm:mb-0">
                        Any Passengers?
                      </label>
                      <div className="relative w-full sm:w-3/4">
                        <Field name="passengers">
                          {({ field, form, meta }: any) => {
                            const passengerOptions = [
                              { value: "No", label: "No" },
                              { value: "Yes", label: "Yes" },
                            ];

                            return (
                              <div className="w-full">
                                <CustomSelect
                                  options={passengerOptions}
                                  value={
                                    passengerOptions.find((opt) => opt.value === field.value) || null
                                  }
                                  onChange={(option) => {
                                    form.setFieldValue(field.name, option ? option.value : "");
                                  }}
                                  placeholder="Select option"
                                  disabled={isClosed}
                                />

                                {meta.touched && meta.error && (
                                  <div className="text-red-500 text-xs mt-1">{meta.error}</div>
                                )}
                              </div>
                            );
                          }}
                        </Field>

                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4  pointer-events-none" />
                      </div>
                    </div>
                    {values.passengers === 'Yes' && (
                      <>
                        <div className="flex flex-col sm:flex-row sm:items-center mb-4 sm:mb-6">
                          <label className="w-full sm:w-1/4 text-sm font-medium mb-1 sm:mb-0">
                            Number of Passengers
                          </label>
                          <div className="relative w-full sm:w-3/4">
                            <Field
                              type="number"
                              name="numPassengers"
                              min="0"
                              disabled={isClosed}
                              className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none  "
                            />
                          </div>
                        </div>
                        <div className='flex cursor-pointer' onClick={handleOpenPassengersModal}>
                          <h2 className="text-sm cursor-pointer mb-4 font-semibold text-[#414651]">Complete Passengers Details
                          </h2>
                          <MdArrowOutward className='text-[#414651] mt-[3px] ml-2' />
                        </div></>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center mb-4 sm:mb-6">
                      <label className="w-full sm:w-1/4 text-sm font-medium  mb-1 sm:mb-0">
                        Any Witnesses?
                      </label>
                      <div className="relative w-full sm:w-3/4">
                        <Field name="witnesses">
                          {({ field, form, meta }: any) => {
                            const witnessOptions = [
                              { value: "No", label: "No" },
                              { value: "Yes", label: "Yes" },
                            ];

                            return (
                              <div className="w-full">
                                <CustomSelect
                                  options={witnessOptions}
                                  value={
                                    witnessOptions.find((opt) => opt.value === field.value) || null
                                  }
                                  onChange={(option) => {
                                    form.setFieldValue(field.name, option ? option.value : "");
                                  }}
                                  placeholder="Select option"
                                  disabled={isClosed}
                                />

                                {meta.touched && meta.error && (
                                  <div className="text-red-500 text-xs mt-1">{meta.error}</div>
                                )}
                              </div>
                            );
                          }}
                        </Field>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4  pointer-events-none" />
                      </div>
                    </div>
                    {values.witnesses !== "No" && <div className='flex cursor-pointer' onClick={handleOpenWitnessesModal}>
                      <h2 className="text-sm cursor-pointer mb-4 font-semibold text-[#414651]">Complete Witness Details
                      </h2>
                      <MdArrowOutward className='text-[#414651] mt-[3px] ml-2' />
                    </div>}
                    <div className="flex flex-col sm:flex-row sm:items-center mb-4 sm:mb-6">
                      <label className="w-full sm:w-1/4 text-sm font-medium mb-1 sm:mb-0">
                        Did Police Attend?
                      </label>
                      <div className="relative w-full sm:w-3/4">
                        <Field name="police">
                          {({ field, form, meta }: any) => {
                            const policeOptions = [
                              { value: "No", label: "No" },
                              { value: "Yes", label: "Yes" },
                            ];

                            return (
                              <div className="w-full">
                                <CustomSelect
                                  options={policeOptions}
                                  value={policeOptions.find((opt) => opt.value === field.value) || null}
                                  onChange={(option) => {
                                    form.setFieldValue(field.name, option ? option.value : "");
                                  }}
                                  placeholder="Select option"
                                  disabled={isClosed}
                                />

                                {meta.touched && meta.error && (
                                  <div className="text-red-500 text-xs mt-1">{meta.error}</div>
                                )}
                              </div>
                            );
                          }}
                        </Field>

                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4  pointer-events-none" />
                      </div>
                    </div>
                    {values.police !== "No" && <div className='flex cursor-pointer' onClick={handleOpenPoliceModal}>
                      <h2 className="text-sm cursor-pointer mb-4 font-semibold text-[#414651]">Complete Police Details
                      </h2>
                      <MdArrowOutward className='text-[#414651] mt-[3px] ml-2' />
                    </div>}
                    <div className="flex flex-col sm:flex-row sm:items-center mb-4 sm:mb-6">
                      <label className="w-full sm:w-1/4 text-sm font-medium  mb-1 sm:mb-0">
                        Dash cam Footage
                      </label>
                      <div className="relative w-full sm:w-3/4">
                        <Field name="dashcam">
                          {({ field, form, meta }: any) => {
                            const dashcamOptions = [
                              { value: "No", label: "No" },
                              { value: "Yes", label: "Yes" },
                            ];

                            return (
                              <div className="w-full">
                                <CustomSelect
                                  options={dashcamOptions}
                                  value={dashcamOptions.find((opt) => opt.value === field.value) || null}
                                  onChange={(option) => {
                                    form.setFieldValue(field.name, option ? option.value : "");
                                  }}
                                  placeholder="Select option"
                                  disabled={isClosed}
                                />

                                {meta.touched && meta.error && (
                                  <div className="text-red-500 text-xs mt-1">{meta.error}</div>
                                )}
                              </div>
                            );
                          }}
                        </Field>

                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4  pointer-events-none" />
                      </div>
                    </div>
                    <hr className="mb-4 sm:mb-6 " />
                  </div>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
      <PassengersModal
        isOpen={isPassengersModalOpen}
        claimId={Number(claimID)}
        refreshKey={passengersRefreshKey}
        onClose={handleClosePassengersModal}
        onEditPassenger={handleOpenAddModalForEdit}
      />

      <WitnessesModal
        isOpen={isWitnessesModalOpen}
        onClose={handleCloseWitnessesModal}
        witnesses={witnessesList}
        claimId={Number(claimID)}
        onEditWitness={handleOpenAddWitnessModalForEdit}
        onAddWitness={handleAddWitness}
      />

      <PoliceModal
        isOpen={isPoliceModalOpen}
        onClose={handleClosePoliceModal}
        claimId={Number(claimID)}
        policeDetails={policeDetailsList}
        onEditPolice={handleOpenAddPoliceModalForEdit}
        onAddPoliceDetail={handleAddPoliceDetail}
      />

      <AddPassengerModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingPassengerId(null);
          handleClosePassengersModal()
        }}
        claimId={claimID}
        editingPassengerId={editingPassengerId}
      />


      <AddWitnessModal
        isOpen={isAddWitnessModalOpen}
        onClose={(shouldRefresh?: boolean) => {
          setIsAddWitnessModalOpen(false);
          setEditingWitnessId(null);
          handleCloseWitnessesModal()
          if (shouldRefresh) bumpWitnessesRefresh();
        }}
        onConfirm={() => { /* not needed anymore; you can remove this prop */ }}
        claimId={claimId}
        editingWitnessId={editingWitnessId}
      />

      <AddPoliceModal
        isOpen={isAddPoliceModalOpen}
        onClose={(shouldRefresh?: boolean) => {
          setIsAddPoliceModalOpen(false);
          setEditingPoliceId(null);
          handleClosePoliceModal();
          if (shouldRefresh) bumpPoliceRefresh();
        }}
        onConfirm={() => { }}
        claimId={claimID || id}
        editingPoliceId={editingPoliceId}
      />


    </div>
  );
});

AccidentDetails.displayName = 'AccidentDetails';

export default AccidentDetails;