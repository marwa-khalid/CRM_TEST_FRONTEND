import { getAccidentDetailById } from "../../../services/Accidents/accident";
import {
  getPassengerById,
  getPoliceDetails,
  getWitnesses,
} from "../../../services/Accidents/Cards/cards";
import { ClaimsApi } from "../../../services/Claims/Claims";
import { getClientByClaimID } from "../../../services/Client/client";
import { getClientInsurer } from "../../../services/ClientInsurer/ClientInsurer";
import { getDriverDocumentAgreement } from "../../../services/DriverDocumentAgreement/DriverDocumentAgreement";
import { gettingEnginerDetails } from "../../../services/EngineeringDetails/engineeringDetails";
import {
  getCheckoutDetails,
  getHireRecords,
} from "../../../services/HireVehicleProvided/HireVehicleProvided";
import { getPanelSolicitorDetails } from "../../../services/PanelSolicitorDetails/PanelSolicitorDetails";
import { getReferrer } from "../../../services/Referrer/Referrer";
import { getStorageRecoveryProvider } from "../../../services/StorageRecovery/StorageRecovery";
import { getThirdPartyInsurer } from "../../../services/ThirdPartyInsurer/ThirdPartyInsurer";
import { getVehicleDetail } from "../../../services/Vehicle/vehicle";
import { getLatestVehicleDamageReport } from "../../../services/VehicleDamage/VehicleDamage";
import { getVehicleOwner } from "../../../services/VehicleOwner/vehicleOwner";
import { isAllFilled } from "./ClaimCompletion";

const dataOf = (response: any) => response?.data ?? response;

const safeData = async (loader: () => Promise<any>) => {
  try {
    return dataOf(await loader());
  } catch {
    return null;
  }
};

const asArray = (value: any) => (Array.isArray(value) ? value : []);

const hasAny = (value: any) => {
  if (Array.isArray(value)) return value.length > 0;
  if (!value || typeof value !== "object") return false;
  return Object.values(value).some((item) => {
    if (item === null || item === undefined) return false;
    if (typeof item === "string") return item.trim() !== "";
    if (Array.isArray(item)) return item.length > 0;
    if (typeof item === "object") return hasAny(item);
    return true;
  });
};

const isComplete = (values: any) => isAllFilled(values);

const documentFields = [
  ["driver_license_received_on", "driver_license_file_url"],
  ["license_checks_completed_on", "license_checks_completed_file_url"],
  ["proof_of_address_1_received_on", "proof_of_address_1_file_url"],
  ["proof_of_address_2_received_on", "proof_of_address_2_file_url"],
  ["pre_hire_bank_statement_received_on", "pre_hire_bank_statement_file_url"],
  ["post_hire_bank_statement_received_on", "post_hire_bank_statement_file_url"],
  ["taxi_badge_received_on", "taxi_badge_file_url"],
  ["v5_received_on", "v5_file_url"],
  ["mot_certificate_received_on", "mot_certificate_file_url"],
  ["insurance_certificate_received_on", "insurance_certificate_file_url"],
  ["suspension_notice_received_on", "suspension_notice_file_url"],
  ["suspension_uplift_received_on", "suspension_uplift_file_url"],
  ["signed_cha_received_on", "signed_cha_file_url"],
  ["signed_mitigation_received_on", "signed_mitigation_file_url"],
  ["arf_received_on", "arf_file_url"],
  ["signed_cil_agreement_received_on", "signed_cil_agreement_file_url"],
];

export const loadClaimStepCompletion = async (
  claimId: string | number,
): Promise<Record<number, boolean>> => {
  const id = Number(claimId);
  if (!id) return {};

  const [
    claim,
    referrer,
    client,
    accident,
    passengers,
    witnesses,
    police,
    vehicle,
    owner,
    engineer,
    clientInsurer,
    panelSolicitor,
    storageRecovery,
    damageReport,
    thirdPartyInsurer,
    hireRecords,
    driverDocs,
    driverCheckouts,
  ] = await Promise.all([
    safeData(() => ClaimsApi.getClaimById(id)),
    safeData(() => getReferrer(id)),
    safeData(() => getClientByClaimID(id)),
    safeData(() => getAccidentDetailById(id)),
    safeData(() => getPassengerById(id)),
    safeData(() => getWitnesses(id)),
    safeData(() => getPoliceDetails(id)),
    safeData(() => getVehicleDetail(id)),
    safeData(() => getVehicleOwner(id)),
    safeData(() => gettingEnginerDetails(id)),
    safeData(() => getClientInsurer(id)),
    safeData(() => getPanelSolicitorDetails(id)),
    safeData(() => getStorageRecoveryProvider(id)),
    safeData(() => getLatestVehicleDamageReport(id)),
    safeData(() => getThirdPartyInsurer(id)),
    safeData(() => getHireRecords(id)),
    safeData(() => getDriverDocumentAgreement(id)),
    safeData(() => getCheckoutDetails(id)),
  ]);

  const passengerList = asArray(passengers?.passengers ?? passengers);
  const witnessList = asArray(witnesses);
  const policeList = asArray(police);
  const hireList = asArray(hireRecords);
  const checkoutList = asArray(driverCheckouts);

  const map: Record<number, boolean> = {};

  if (claim) {
    map[0] = isComplete({
      claim_type_id: claim.claim_type_id,
      target_debt_id: claim.target_debt_id,
      source_id: claim.source_id,
      source_staff_user_id:
        claim.source_id === 3 ? claim.source_staff_user_id : "n/a",
      case_status_id: claim.case_status_id,
      rejection_reason: claim.rejection_reason || "n/a",
      credit_hire_accepted:
        claim.credit_hire_accepted === true ||
        claim.credit_hire_accepted === false
          ? "answered"
          : "",
      non_fault_accident: claim.non_fault_accident,
      any_passengers: claim.any_passengers,
      client_injured: claim.client_injured,
      prospects_id: claim.prospects_id,
      present_position_id: claim.present_position_id,
      client_going_abroad:
        claim.client_going_abroad === true ||
        claim.client_going_abroad === false
          ? "answered"
          : "",
      abroad_date: claim.client_going_abroad
        ? claim.abroad_date || claim.client_going_abroad_date
        : "n/a",
    });
  }

  if (referrer) {
    map[1] = isComplete({
      company_name: referrer.company_name,
      address: referrer.address,
      postcode: referrer.postcode,
      contact_name: referrer.contact_name,
      contact_email: referrer.contact_email,
      contact_number: referrer.contact_number,
      driver_commission: referrer.driver_commission,
      referrer_commission: referrer.referrer_commission,
      solicitor: referrer.solicitor,
      third_party_capture: referrer.third_party_capture,
    });
  }

  if (client?.id) {
    const address = client.address || {};
    const occupation =
      client.occupation === "Private Hire Driver" ||
      client.occupation === "Taxi Driver"
        ? client.occupation
        : "Others";
    map[2] = isComplete({
      clientFirstName: client.first_name,
      clientSurname: client.surname,
      dateOfBirth: client.date_of_birth,
      age: client.age,
      niNumber: client.ni_number,
      occupation,
      customOccupation: occupation === "Others" ? client.occupation : "n/a",
      driverCode: client.driver_code,
      dayNightDriver:
        client.day_driver === true || client.day_driver === false
          ? "answered"
          : "",
      driverBase: client.driver_base,
      dependents: client.dependents,
      partner:
        client.partner === true || client.partner === false ? "answered" : "",
      children: client.children,
      caringForElderly:
        client.caring_for_elderly === true ||
        client.caring_for_elderly === false
          ? "answered"
          : "",
      dependentsDetails: client.dependents_details,
      address: address.address,
      postcode: address.postcode,
      email: address.email,
      homeTelephone: address.home_tel,
      mobileTelephone: address.mobile_tel,
      clientPreferredLanguage: client.language_id,
      contactName: client.contact_via_alternative_person
        ? client.alter_person
        : "n/a",
      contactTelephone: client.contact_via_alternative_person
        ? client.alter_number
        : "n/a",
      otherLanguage: client.language_id === 5 ? client.other_language : "n/a",
      clientSpeakEnglish:
        client.speaks_clear_english === true ||
        client.speaks_clear_english === false
          ? "answered"
          : "",
      alternativeContact:
        client.contact_via_alternative_person === true ||
        client.contact_via_alternative_person === false
          ? "answered"
          : "",
      sortCode: client.sort_code,
      accountNumber: client.account_number,
      payDriverNotificationDate: client.pay_notification_date,
      vatRegistered:
        client.ci_vat_registered === true ||
        client.ci_vat_registered === false
          ? "answered"
          : "",
      vulnerablePerson:
        client.is_vulnerable === true || client.is_vulnerable === false
          ? "answered"
          : "",
      vulnerablePersonWhy: client.is_vulnerable
        ? client.vulnerable_note
        : "n/a",
    });
  }

  if (accident) {
    map[3] = isComplete({
      date: accident.date_time,
      time: accident.date_time,
      weather: accident.condition,
      location: accident.location,
      versionOfEvents: accident.description,
      servicesDate: accident.service_date_time,
      servicesTime: accident.service_date_time,
      dashcamFootage:
        accident.dash_footage === true || accident.dash_footage === false
          ? "answered"
          : "",
    });
  }

  // Passenger / Witness / Police are their own optional screens now — complete
  // when every saved entry has a name (an empty list counts as complete).
  map[4] = passengerList.every((p: any) => Boolean(p?.first_name));
  map[5] = witnessList.every((w: any) => Boolean(w?.first_name));
  map[6] = policeList.every((p: any) => Boolean(p?.name));

  if (vehicle) {
    map[7] = isComplete({
      vehicle: {
        make: vehicle.make,
        model: vehicle.model,
        registration: vehicle.registration,
        color: vehicle.color,
        fuelType: vehicle.fuel_type_id,
        engineSize: vehicle.engine_size,
        transmission: vehicle.transmission_id,
        bodyType: vehicle.body_type,
        seats: vehicle.number_of_seat,
        category: vehicle.vehicle_category,
      },
      borough: vehicle.borough
        ? {
            name: vehicle.borough.borough_name,
            taxiType: vehicle.borough.taxi_type_id,
            clientBadgeNumber: vehicle.borough.client_badge_number,
            badgeExpirationDate: vehicle.borough.badge_expiration_date,
            vehicleBadgeNumber: vehicle.borough.vehicle_badge_number,
            otherBorough:
              vehicle.borough.any_other_borough === true ||
              vehicle.borough.any_other_borough === false
                ? "answered"
                : "",
            otherBoroughName: vehicle.borough.any_other_borough
              ? vehicle.borough.other_borough_name
              : "n/a",
          }
        : "n/a",
      thirdPartyVehicles:
        asArray(vehicle.third_party_vehicles).filter(
          (item: any) => item.is_active !== false && item.is_deleted !== true,
        ).length > 0
          ? "added"
          : "n/a",
    });
  }

  if (owner?.id) {
    map[9] = isComplete({
      clientFirstName: owner.first_name,
      clientSurname: owner.surname,
      address: owner.address?.address,
      postcode: owner.address?.postcode,
      homeTelephone: owner.address?.home_tel,
      mobileTelephone: owner.address?.mobile_tel,
      email: owner.address?.email,
      vehiclePaymentBeneficiary: owner.payment_benificiary,
    });
  }

  if (engineer?.id) {
    map[10] = isComplete({
      companyName: engineer.company_name,
      vehicle_payment_beneficiary: engineer.vehicle_payment_beneficiary,
      reference: engineer.reference,
      currency: engineer.currency,
      actual_fee: engineer.actual_fee,
      invoice_received_on: engineer.invoice_received_on,
      invoice_paid_on: engineer.invoice_paid_on,
      invoice_settled_on: engineer.invoice_settled_on,
      invoice_settled_amount: engineer.invoice_settled_amount,
      engineer_report_received:
        engineer.engineer_report_received === true ||
        engineer.engineer_report_received === false
          ? "answered"
          : "",
      engineer_instructed: engineer.engineer_instructed,
      inspection_date: engineer.inspection_date,
      engineer_report_received_date: engineer.engineer_report_received_date,
      engineer_fee: engineer.engineer_fee,
      site: engineer.site,
      engineer_address: {
        address: engineer.engineer_address?.address,
        postcode: engineer.engineer_address?.postcode,
        landline_tel: engineer.engineer_address?.landline_tel,
        mobile_tel: engineer.engineer_address?.mobile_tel,
        email: engineer.engineer_address?.email,
      },
      vehicle_address: {
        address: engineer.vehicle_address?.address,
        postcode: engineer.vehicle_address?.postcode,
        mobile_tel: engineer.vehicle_address?.mobile_tel,
        email: engineer.vehicle_address?.email,
      },
    });
  }

  if (clientInsurer?.id) {
    map[11] = isComplete({
      companyName: clientInsurer.company_name,
      address: clientInsurer.address?.address,
      postcode: clientInsurer.address?.postcode,
      telephoneMain: clientInsurer.address?.mobile_tel,
      email: clientInsurer.address?.email,
      reference: clientInsurer.reference,
      policy_number: clientInsurer.policy_number,
      policy_holder: clientInsurer.policy_holder,
      type_of_policy: clientInsurer.policy_type_id,
      policy_cover_level: clientInsurer.policy_cover_id,
      policy_cover_excess: clientInsurer.policy_cover_excess,
      no_of_additional_driver: clientInsurer.number_of_additional_driver,
      no_of_vehicles_policy: clientInsurer.number_vehicle_on_policy,
      no_of_vehicles_use: clientInsurer.number_vehicle_in_use,
      sdp:
        clientInsurer.sdp === true || clientInsurer.sdp === false
          ? "answered"
          : "",
      private_hire:
        clientInsurer.private_hire === true ||
        clientInsurer.private_hire === false
          ? "answered"
          : "",
    });
  }

  if (panelSolicitor?.id) {
    map[12] = isComplete({
      company_name: panelSolicitor.company_name,
      reference: panelSolicitor.reference,
      recommendation_sent: panelSolicitor.recommendation_sent,
      note: panelSolicitor.note,
      claim_id: id,
      email_sent_date: panelSolicitor.email_sent_date,
      accepted_sent_date: panelSolicitor.accepted_sent_date,
      address: {
        address: panelSolicitor.address?.address,
        postcode: panelSolicitor.address?.postcode,
        mobile_tel: panelSolicitor.address?.mobile_tel,
        email: panelSolicitor.address?.email,
      },
    });
  }

  if (storageRecovery) {
    map[13] = isComplete({
      storages: asArray(storageRecovery.storages),
      recoveries: asArray(storageRecovery.recoveries),
    });
  }

  map[8] = hasAny(damageReport);

  if (thirdPartyInsurer) {
    map[14] = hasAny(thirdPartyInsurer) && isComplete(thirdPartyInsurer);
  }

  map[15] = hireList.length > 0;

  if (driverDocs) {
    map[16] = isComplete(
      documentFields.reduce((acc: Record<string, any>, [dateField, fileField]) => {
        acc[dateField] = driverDocs[dateField];
        acc[fileField] = driverDocs[fileField];
        return acc;
      }, {}),
    );
  }

  map[17] = checkoutList.length > 0;

  return map;
};
