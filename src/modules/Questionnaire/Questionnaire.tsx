import { useEffect, useState } from 'react';
import { Formik, Field, ErrorMessage, Form } from 'formik';
import * as Yup from 'yup';
import LeafletAutocompleteMap from '../../claims/GoogleMapAutoComplete/GoogleMapAutoComplete';
import { CalendarDate } from "@internationalized/date";
import { getLocalTimeZone, today } from "@internationalized/date";
import type { DateValue } from "react-aria-components";
import { DatePicker } from "../../claims/application/date-picker/date-picker";
import { toast } from 'react-toastify';
import { formSubmitquestionaire, getQuestionnaireFromId } from '../../services/Accidents/Cards/cards';
import { useLocation, useNavigate } from 'react-router-dom';
import SignaturePad from 'react-signature-canvas';
import { useRef } from 'react';
import { FaFile } from 'react-icons/fa6';
import html2pdf from "html2pdf.js";


const Questionnaire = () => {
    const navigate = useNavigate()
    const now = today(getLocalTimeZone());
    const location = useLocation()
    const searchParams = new URLSearchParams(location.search);
    const jwt = searchParams.get("details");
    const claimId = searchParams.get("claim_id");
    const witnessSigRef = useRef<SignaturePad>(null);
    const officerSigRef = useRef<SignaturePad>(null);
    const [dateOfBirth, setDateOfBirth] = useState<DateValue | null>(null)
    const claim_questionnaire_id = searchParams.get('claim_questionnaire_id')
    const formRef = useRef<HTMLDivElement>(null);
    const [witnessSigned, setWitnessSigned] = useState<DateValue | null>(now);
    const [officerSigned, setOfficerSigned] = useState<DateValue | null>(now);
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        printedNameWitness: '',
        printedNameOfficer: '',
        dob: '',
        occupation: '',
        didSeeAccident: '',
        location: '',
        weatherConditions: '',
        roadConditions: '',
        vehicleDescription: '',
        warningGiven: '',
        lightsDisplayed: '',
        speedEstimate: '',
        obstructedView: '',
        driverActions: '',
        distanceTravelled: '',
        avoidableCollision: '',
        faultOpinion: '',
        knownDriver: '',
        policeStatement: '',
        otherWitnesses: '',
        interviewLocation: '',
        conversationAfterAccident: '',
        accidentDescription: '',
        sketch: '',
    });

    const resizeCanvas = (canvas: HTMLCanvasElement) => {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext("2d")?.scale(ratio, ratio);
    };

    useEffect(() => {
        if (witnessSigRef.current) {
            resizeCanvas(witnessSigRef.current.getCanvas());
        }
        if (officerSigRef.current) {
            resizeCanvas(officerSigRef.current.getCanvas());
        }
    }, []);

    useEffect(() => {
        if (claim_questionnaire_id) {
            fetchQuestionnaire()
        }
    }, [])

    const fetchQuestionnaire = async () => {
        try {
            const res = await getQuestionnaireFromId(claim_questionnaire_id);
            const answersObj = res.answers.reduce((acc: any, curr: any) => {
                acc[curr.question] = curr.answer;
                return acc;
            }, {});


            setFormData({
                name: answersObj?.name || '',
                address: answersObj?.address || '',
                printedNameWitness: answersObj.printedNameWitness || '',
                printedNameOfficer: answersObj.printedNameOfficer || '',
                dob: answersObj.dob || '',
                occupation: answersObj.occupation || '',
                didSeeAccident: answersObj.didSeeAccident || '',
                location: answersObj.location || '',
                weatherConditions: answersObj.weatherConditions || '',
                roadConditions: answersObj.roadConditions || '',
                vehicleDescription: answersObj.vehicleDescription || '',
                warningGiven: answersObj.warningGiven || '',
                lightsDisplayed: answersObj.lightsDisplayed || '',
                speedEstimate: answersObj.speedEstimate || '',
                obstructedView: answersObj.obstructedView || '',
                driverActions: answersObj.driverActions || '',
                distanceTravelled: answersObj.distanceTravelled || '',
                avoidableCollision: answersObj.avoidableCollision || '',
                faultOpinion: answersObj.faultOpinion || '',
                knownDriver: answersObj.knownDriver || '',
                policeStatement: answersObj.policeStatement || '',
                otherWitnesses: answersObj.otherWitnesses || '',
                interviewLocation: answersObj.interviewLocation || '',
                conversationAfterAccident: answersObj.conversationAfterAccident || '',
                accidentDescription: answersObj.accidentDescription || '',
                sketch: answersObj.sketch || '',
            });

            // Load signature images if present
            if (witnessSigRef.current && res.signWitness) {
                const img = new Image();
                img.src = res.signWitness;
                img.onload = () => {
                    witnessSigRef.current?.fromDataURL(res.signWitness);
                };
            }

            if (officerSigRef.current && res.signOfficer) {
                const img = new Image();
                img.src = res.signOfficer;
                img.onload = () => {
                    officerSigRef.current?.fromDataURL(res.signOfficer);
                };
            }


        } catch (e) {
            console.error("Failed to fetch questionnaire:", e);
        }
    };


    const validationSchema = Yup.object({
        // name: Yup.string().required('Name is required'),
        // address: Yup.string().required('Address is required'),
        // // dob: Yup.date().required('Date of Birth is required'),
        // occupation: Yup.string().required('Occupation is required'),
        // didSeeAccident: Yup.string().required('Did you see the accident?'),
        // location: Yup.string().required('Where were you at the time?'),
        // weatherConditions: Yup.string().required('What were the weather conditions?'),
        // roadConditions: Yup.string().required('What were the road conditions?'),
        // vehicleDescription: Yup.string().required('Please describe the vehicles and drivers involved'),
        // warningGiven: Yup.string().required('Did you hear or see either driver give any warning?'),
        // lightsDisplayed: Yup.string().required('What lights were displayed on the vehicle?'),
        // speedEstimate: Yup.string().required('At what speed would you estimate the vehicles involved to have been travelling?'),
        // obstructedView: Yup.string().required('Was there anything to obstruct the view of any driver involved?'),
        // driverActions: Yup.string().required('Did any driver apply brakes, swerve, or skid?'),
        // distanceTravelled: Yup.string().required('How far did each vehicle travel after impact?'),
        // avoidableCollision: Yup.string().required('Could any of the drivers involved do anything to avoid collision?'),
        // faultOpinion: Yup.string().required('In your opinion, who was to blame for the accident?'),
        // knownDriver: Yup.string().required('Was any driver involved known to you? If so, please give details'),
        // policeStatement: Yup.string().required('Did you give a statement to the police?'),
        // otherWitnesses: Yup.string().required('Please give the names and addresses of any other witnesses to the accident'),
        // interviewLocation: Yup.string().required('Where can you be interviewed if required?'),
        // conversationAfterAccident: Yup.string().required('Was there any conversation regarding who was at fault?'),
        // accidentDescription: Yup.string().required('Please give a full description of the accident'),
        // sketch: Yup.string().required('Please provide a sketch plan of the accident'),
    });

    const formatCalendarDate = (date?: CalendarDate | null) => {
        if (!date) return undefined;
        const jsDate = new Date(date.year, date.month - 1, date.day);
        return jsDate.toISOString().split("T")[0];
      };
      

    const handleSubmit = async (values: any) => {
        setIsLoading(true)
        const dobFormat = dateOfBirth ? formatCalendarDate(dateOfBirth as CalendarDate) : undefined;
        const finalValues = {
            ...values,
            dob: dobFormat,
        };

        const answers = Object.entries(finalValues).map(([key, value]) => ({
            question: key,
            answer: value ?? '',
        }));

        const witnessSignature = witnessSigRef.current?.isEmpty()
            ? null
            : witnessSigRef.current?.getCanvas().toDataURL("image/png");
        const officerSignature = officerSigRef.current?.isEmpty()
            ? null
            : officerSigRef.current?.getCanvas().toDataURL("image/png");
        const witnessDateISO = witnessSigned
            ? new Date(witnessSigned.year, witnessSigned.month - 1, witnessSigned.day).toISOString()
            : null;

        const officerDateISO = officerSigned
            ? new Date(officerSigned.year, officerSigned.month - 1, officerSigned.day).toISOString()
            : null;

        // Build API payload
        const payload = {
            status: "sent",
            claimId: claimId || 79,
            witness_sign: witnessSignature,
            officer_sign: officerSignature,
            witness_name: values.printedNameWitness,
            officer_name: values.printedNameOfficer,
            date_of_witness: witnessDateISO,
            date_of_officer: officerDateISO,
            answers,
        };

        try {
            await formSubmitquestionaire(payload, jwt);
            toast.success("Form submitted successfully");
            navigate("/claims");
        } catch (e) {
            toast.error("Unable to submit");
        } finally {
            setIsLoading(false)
        }
    };



    const handlePlaceSelected = (
        place: {
          name: string;
          lat: number;
          lng: number;
          address: string;
          postalCode?: string;
        },
        setFieldValue: (field: string, value: any) => void
      ) => {
        setFieldValue("address", place.address || place.name || "");
      };
      

    return (
        <div>
            <div className="flex justify-center mt-10">
                <div className='rounded-full border-8 border-gray-300/10'>
                    <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#414651]/10 text-custom">
                        <FaFile className="w-6 h-6" />
                    </div>
                </div>
            </div>
            <div className="flex flex-wrap items-center justify-between mb-6">
                {/* Left (Center-aligned Title and Subtext) */}
                <div className={`flex-1 text-center ${claim_questionnaire_id ? 'ml-[270px]' : ''}`}>
                    <h1 className="text-2xl font-weight-600">Witness Statement of Truth</h1>
                    <p className="text-sm text-gray-600">Enter the details below</p>
                </div>

                {/* Right (Buttons) */}
                {claim_questionnaire_id && <div className="flex gap-2">
                    <button
                        type="button"
                        className="px-4 py-2 bg-white-600 text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-none border focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                        onClick={() => {
                            if (formRef.current) {
                                const printContents = formRef.current.innerHTML;
                                const originalContents = document.body.innerHTML;

                                document.body.innerHTML = printContents;
                                window.print();
                                document.body.innerHTML = originalContents;
                            }
                        }}
                    >
                        Print Form
                    </button>


                    <button
                        type="button"
                        onClick={() => {
                            if (formRef.current) {
                                html2pdf()
                                    .set({
                                        margin: 8,
                                        filename: "witness-statement.pdf",
                                        image: { type: "jpg", quality: 0.98 },
                                        html2canvas: {
                                            scale: 2,
                                            useCORS: true, // Important for fonts and images
                                            logging: true,
                                        },
                                        jsPDF: {
                                            unit: "mm",
                                            format: "a4",
                                            orientation: "portrait",
                                        },
                                    })
                                    .from(formRef.current)
                                    .save();
                            }
                        }}
                        className="px-4 py-2 bg-white-600 text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-none border focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                    >
                        Download Form
                    </button>

                </div>}

            </div>

            <Formik
                initialValues={formData}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
                enableReinitialize
            >
                {({ values, handleChange, setFieldValue }) => (
                    <Form className="max-w-6xl mx-auto py-6 pl-8 bg-white rounded-lg">
                        <div ref={formRef}>
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Name</label>
                                    <Field
                                        type="text"
                                        name="name"
                                        value={values.name}
                                        onChange={handleChange}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    />
                                    <ErrorMessage name="name" component="div" className="text-red-500 text-xs mt-1" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Address</label>
                                    <LeafletAutocompleteMap
                                        showMap={false}
                                        apiKey={import.meta.env.VITE_GOOGLE_MAP_KEY}
                                        address={values.address}
                                        disabled={false}
                                        onPlaceSelected={(place) => handlePlaceSelected(place, setFieldValue)}
                                    />
                                    <ErrorMessage name="address" component="div" className="text-red-500 text-xs mt-1" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                                    <Field name="dob">
                                        {() => {
                                            const todayDate = today(getLocalTimeZone());
                                            const maxDate = new CalendarDate(todayDate.year - 18, todayDate.month, todayDate.day);
                                            return (
                                                <div className="w-[100%] max-w-md inline-block mb-4">
                                                    <DatePicker
                                                        className="w-[30%] rounded-lg"
                                                        aria-label="Date picker quest"
                                                        maxValue={maxDate}
                                                        value={dateOfBirth}
                                                        onChange={(e) => setDateOfBirth(e)}
                                                    />
                                                </div>

                                            );
                                        }}
                                    </Field>
                                    <ErrorMessage name="dob" component="div" className="text-red-500 text-xs mt-1" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Occupation</label>
                                    <Field
                                        type="text"
                                        name="occupation"
                                        value={values.occupation}
                                        onChange={handleChange}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    />
                                    <ErrorMessage name="occupation" component="div" className="text-red-500 text-xs mt-1" />
                                </div>
                            </div>

                            <div>
                                {/* Row 1 */}
                                <div className="my-4 flex items-center">
                                    <label className="w-1/3 text-sm font-medium text-gray-700">
                                        Did you actually see the accident?
                                    </label>
                                    <div className="w-2/3 ml-8 ml-8">
                                        <Field
                                            as="input"
                                            placeholder="Type here..."
                                            name="didSeeAccident"
                                            value={values.didSeeAccident}
                                            onChange={handleChange}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                        />
                                        <ErrorMessage name="didSeeAccident" component="div" className="text-red-500 text-xs mt-1" />
                                    </div>
                                </div>

                                <div className="my-4 flex items-center">
                                    <label className="w-1/3 text-sm font-medium text-gray-700">
                                        Did you hear or see either driver give any warning?
                                    </label>
                                    <div className="w-2/3 ml-8">
                                        <Field
                                            as="input"
                                            name="warningGiven"
                                            placeholder="Type here..."
                                            value={values.warningGiven}
                                            onChange={handleChange}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                        />
                                        <ErrorMessage name="warningGiven" component="div" className="text-red-500 text-xs mt-1" />
                                    </div>
                                </div>

                                {/* Row 2 */}
                                <div className="my-4 flex items-center">
                                    <label className="w-1/3 text-sm font-medium text-gray-700">
                                        Where were you at the time, and how near to the scene of the accident?
                                    </label>
                                    <div className="w-2/3 ml-8">
                                        <Field
                                            as="input"
                                            name="location"
                                            placeholder="Type here..."
                                            value={values.location}
                                            onChange={handleChange}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                        />
                                        <ErrorMessage name="location" component="div" className="text-red-500 text-xs mt-1" />
                                    </div>
                                </div>

                                <div className="my-4 flex items-center">
                                    <label className="w-1/3 text-sm font-medium text-gray-700">
                                        What lights were displayed on the vehicle?
                                    </label>
                                    <div className="w-2/3 ml-8">
                                        <Field
                                            as="input"
                                            name="lightsDisplayed"
                                            placeholder="Type here..."
                                            value={values.lightsDisplayed}
                                            onChange={handleChange}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                        />
                                        <ErrorMessage name="lightsDisplayed" component="div" className="text-red-500 text-xs mt-1" />
                                    </div>
                                </div>

                                {/* Row 3 */}
                                <div className="my-4 flex items-center">
                                    <label className="w-1/3 text-sm font-medium text-gray-700">
                                        What were the weather conditions?
                                    </label>
                                    <div className="w-2/3 ml-8">
                                        <Field
                                            as="input"
                                            name="weatherConditions"
                                            placeholder="Type here..."
                                            value={values.weatherConditions}
                                            onChange={handleChange}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                        />
                                        <ErrorMessage name="weatherConditions" component="div" className="text-red-500 text-xs mt-1" />
                                    </div>
                                </div>

                                <div className="my-4 flex items-center">
                                    <label className="w-1/3 text-sm font-medium text-gray-700">
                                        At what speed would you estimate the vehicles involved to have been travelling?
                                    </label>
                                    <div className="w-2/3 ml-8">
                                        <Field
                                            as="input"
                                            name="speedEstimate"
                                            placeholder="Type here..."
                                            value={values.speedEstimate}
                                            onChange={handleChange}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                        />
                                        <ErrorMessage name="speedEstimate" component="div" className="text-red-500 text-xs mt-1" />
                                    </div>
                                </div>

                                {/* Row 4 */}
                                <div className="my-4 flex items-center">
                                    <label className="w-1/3 text-sm font-medium text-gray-700">
                                        What were the road conditions?
                                    </label>
                                    <div className="w-2/3 ml-8">
                                        <Field
                                            as="input"
                                            name="roadConditions"
                                            placeholder="Type here..."
                                            value={values.roadConditions}
                                            onChange={handleChange}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                        />
                                        <ErrorMessage name="roadConditions" component="div" className="text-red-500 text-xs mt-1" />
                                    </div>
                                </div>

                                <div className="my-4 flex items-center">
                                    <label className="w-1/3 text-sm font-medium text-gray-700">
                                        Was there anything to obstruct the view of any driver involved?
                                    </label>
                                    <div className="w-2/3 ml-8">
                                        <Field
                                            as="input"
                                            name="obstructedView"
                                            placeholder="Type here..."
                                            value={values.obstructedView}
                                            onChange={handleChange}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                        />
                                        <ErrorMessage name="obstructedView" component="div" className="text-red-500 text-xs mt-1" />
                                    </div>
                                </div>

                                {/* Row 5 */}
                                <div className="my-4 flex items-center">
                                    <label className="w-1/3 text-sm font-medium text-gray-700">
                                        Please describe the vehicles and drivers involved
                                    </label>
                                    <div className="w-2/3 ml-8">
                                        <Field
                                            as="input"
                                            name="vehicleDescription"
                                            placeholder="Type here..."
                                            value={values.vehicleDescription}
                                            onChange={handleChange}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                        />
                                        <ErrorMessage name="vehicleDescription" component="div" className="text-red-500 text-xs mt-1" />
                                    </div>
                                </div>

                                <div className="my-4 flex items-center">
                                    <label className="w-1/3 text-sm font-medium text-gray-700">
                                        Did any driver involved apply his brakes, swerve or skid?
                                    </label>
                                    <div className="w-2/3 ml-8">
                                        <Field
                                            as="input"
                                            name="driverActions"
                                            placeholder="Type here..."
                                            value={values.driverActions}
                                            onChange={handleChange}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                        />
                                        <ErrorMessage name="driverActions" component="div" className="text-red-500 text-xs mt-1" />
                                    </div>
                                </div>

                                {/* Row 6 */}
                                <div className="my-4 flex items-center">
                                    <label className="w-1/3 text-sm font-medium text-gray-700">
                                        How far did each vehicle travel after impact?
                                    </label>
                                    <div className="w-2/3 ml-8">
                                        <Field
                                            as="input"
                                            name="distanceTravelled"
                                            placeholder="Type here..."
                                            value={values.distanceTravelled}
                                            onChange={handleChange}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                        />
                                        <ErrorMessage name="distanceTravelled" component="div" className="text-red-500 text-xs mt-1" />
                                    </div>
                                </div>

                                <div className="my-4 flex items-center">
                                    <label className="w-1/3 text-sm font-medium text-gray-700">
                                        Could any of the drivers involved do anything to avoid collision?
                                    </label>
                                    <div className="w-2/3 ml-8">
                                        <Field
                                            as="input"
                                            name="avoidableCollision"
                                            placeholder="Type here..."
                                            value={values.avoidableCollision}
                                            onChange={handleChange}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                        />
                                        <ErrorMessage name="avoidableCollision" component="div" className="text-red-500 text-xs mt-1" />
                                    </div>
                                </div>

                                {/* Row 7 */}
                                <div className="my-4 flex items-center">
                                    <label className="w-1/3 text-sm font-medium text-gray-700">
                                        In your opinion, who was to blame for the accident?
                                    </label>
                                    <div className="w-2/3 ml-8">
                                        <Field
                                            as="input"
                                            name="faultOpinion"
                                            placeholder="Type here..."
                                            value={values.faultOpinion}
                                            onChange={handleChange}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                        />
                                        <ErrorMessage name="faultOpinion" component="div" className="text-red-500 text-xs mt-1" />
                                    </div>
                                </div>

                                <div className="my-4 flex items-center">
                                    <label className="w-1/3 text-sm font-medium text-gray-700">
                                        Was any driver involved known to you – if so, please give details
                                    </label>
                                    <div className="w-2/3 ml-8">
                                        <Field
                                            as="input"
                                            name="knownDriver"
                                            placeholder="Type here..."
                                            value={values.knownDriver}
                                            onChange={handleChange}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                        />
                                        <ErrorMessage name="knownDriver" component="div" className="text-red-500 text-xs mt-1" />
                                    </div>
                                </div>

                                {/* Row 8 */}
                                <div className="my-4 flex items-center">
                                    <label className="w-1/3 text-sm font-medium text-gray-700">
                                        Did you give a statement to the police?
                                    </label>
                                    <div className="w-2/3 ml-8">
                                        <Field
                                            as="input"
                                            name="policeStatement"
                                            value={values.policeStatement}
                                            placeholder="Type here..."
                                            onChange={handleChange}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                        />
                                        <ErrorMessage name="policeStatement" component="div" className="text-red-500 text-xs mt-1" />
                                    </div>
                                </div>

                                <div className="my-4 flex items-center">
                                    <label className="w-1/3 text-sm font-medium text-gray-700">
                                        Please give the names and addresses of any other witnesses to the accident
                                    </label>
                                    <div className="w-2/3 ml-8">
                                        <Field
                                            as="input"
                                            name="otherWitnesses"
                                            value={values.otherWitnesses}
                                            placeholder="Type here..."
                                            onChange={handleChange}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                        />
                                        <ErrorMessage name="otherWitnesses" component="div" className="text-red-500 text-xs mt-1" />
                                    </div>
                                </div>

                                {/* Row 9 */}
                                <div className="my-4 flex items-center">
                                    <label className="w-1/3 text-sm font-medium text-gray-700">
                                        Where can you be interviewed if required?
                                    </label>
                                    <div className="w-2/3 ml-8">
                                        <Field
                                            as="input"
                                            name="interviewLocation"
                                            value={values.interviewLocation}
                                            placeholder="Type here..."
                                            onChange={handleChange}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                        />
                                        <ErrorMessage name="interviewLocation" component="div" className="text-red-500 text-xs mt-1" />
                                    </div>
                                </div>

                                <div className="my-4 flex items-center">
                                    <label className="w-1/3 text-sm font-medium text-gray-700">
                                        Was there any conversation between any of the parties involved following the accident regarding who was at fault?
                                    </label>
                                    <div className="w-2/3 ml-8">
                                        <Field
                                            as="input"
                                            name="conversationAfterAccident"
                                            value={values.conversationAfterAccident}
                                            onChange={handleChange}
                                            placeholder="Type here..."
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                        />
                                        <ErrorMessage name="conversationAfterAccident" component="div" className="text-red-500 text-xs mt-1" />
                                    </div>
                                </div>

                                {/* Row 10 */}
                                <div className="my-4 flex items-center">
                                    <label className="w-1/3 text-sm font-medium text-gray-700">
                                        Please give a full description of the accident
                                    </label>
                                    <div className="w-2/3 ml-8">
                                        <Field
                                            as="input"
                                            name="accidentDescription"
                                            value={values.accidentDescription}
                                            onChange={handleChange}
                                            placeholder="Type here..."
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                        />
                                        <ErrorMessage name="accidentDescription" component="div" className="text-red-500 text-xs mt-1" />
                                    </div>
                                </div>

                                <div className="my-4 flex items-center">
                                    <label className="w-1/3 text-sm font-medium text-gray-700">
                                        Sketch Plan of the Accident
                                    </label>
                                    <div className="w-2/3 ml-8">
                                        <Field
                                            as="textarea"
                                            rows="5"
                                            name="sketch"
                                            value={values.sketch}
                                            placeholder="Type here..."
                                            onChange={handleChange}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                        />
                                        <ErrorMessage name="sketch" component="div" className="text-red-500 text-xs mt-1" />
                                    </div>
                                </div>
                            </div>


                            <div className="w-full my-10 space-y-6">
                                {/* Signature Section */}
                                <label className="font-weight-600 block">E-Signature</label>
                                <div className="border border-gray-300 rounded-md p-4">
                                    <SignaturePad
                                        ref={witnessSigRef} // Use appropriate ref here
                                        canvasProps={{
                                            className: "w-full h-24 border-b border-dashed border-gray-400"
                                        }}
                                    />
                                </div>

                                {/* Print Name and Date - inline like in image */}
                                <div className="flex flex-wrap justify-between gap-4">
                                    {/* Print Name */}
                                    <div className="w-full md:w-[48%]">
                                        <label className="font-weight-600 block mb-1">Print Name</label>
                                        <input
                                            type="text"
                                            name="printedNameWitness"
                                            value={values.printedNameWitness}
                                            onChange={handleChange}
                                            placeholder="Type here..."
                                            className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:ring-1 focus:ring-black"
                                            autoComplete="off"
                                        />
                                    </div>

                                    {/* Date */}
                                    <div className="w-full md:w-[48%]">
                                        <label className="font-weight-600 block mb-1">Dated</label>
                                        <DatePicker
                                            aria-label="Date picker"
                                            value={witnessSigned}
                                            
                                            onChange={setWitnessSigned}
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                            </div>



                            {/* Submit Button */}
                            {!claim_questionnaire_id && <div className="flex justify-center">
                                <button type="submit" className="px-5 py-2.5 bg-custom text-white rounded-lg transition-colors">
                                    {isLoading ? 'Submitting' : 'Submit Statement'}
                                </button>
                            </div>}
                        </div>
                    </Form>
                )}
            </Formik>
        </div>

    );
};

export default Questionnaire;
