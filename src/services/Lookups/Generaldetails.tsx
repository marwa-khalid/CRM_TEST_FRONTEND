// services/lookups.js
import axiosInstance from "../axiosConfig";

// ------------------- CLAIM TYPES -------------------
export const getClaimTypes = () => axiosInstance.get("/setups/claim-types");
export const createClaimType = (data: any) => axiosInstance.post("/setups/claim-types", data);
export const updateClaimType = (id: any, data: any) => axiosInstance.put(`/setups/claim-types/${id}`, data);
export const deactivateClaimType = (id: any) => axiosInstance.patch(`/setups/claim-types/${id}/deactivate`);

// ------------------- HANDLERS -------------------
export const getHandlers = () => axiosInstance.get("/setups/handlers");
export const createHandler = (data: any) => axiosInstance.post("/setups/handlers", data);
export const updateHandler = (id: any, data: any) => axiosInstance.put(`/setups/handlers/${id}`, data);
export const deactivateHandler = (id: any) => axiosInstance.patch(`/setups/handlers/${id}/deactivate`);

// ------------------- TARGET DEBTS -------------------
export const getTargetDebts = () => axiosInstance.get("/setups/target-debts");
export const createTargetDebt = (data: any) => axiosInstance.post("/setups/target-debts", data);
export const updateTargetDebt = (id: any, data: any) => axiosInstance.put(`/setups/target-debts/${id}`, data);
export const deactivateTargetDebt = (id: any) => axiosInstance.patch(`/setups/target-debts/${id}/deactivate`);

// ------------------- CASE STATUSES -------------------
export const getCaseStatuses = () => axiosInstance.get("/setups/case-statuses");
export const createCaseStatus = (data: any) => axiosInstance.post("/setups/case-statuses", data);
export const updateCaseStatus = (id: any, data: any) => axiosInstance.put(`/setups/case-statuses/${id}`, data);
export const deactivateCaseStatus = (id: any) => axiosInstance.patch(`/setups/case-statuses/${id}/deactivate`);

// ------------------- SOURCE CHANNELS -------------------
export const getSourceChannels = () => axiosInstance.get("/setups/source-channels");
export const createSourceChannel = (data: any) => axiosInstance.post("/setups/source-channels", data);
export const updateSourceChannel = (id: any, data: any) => axiosInstance.put(`/setups/source-channels/${id}`, data);
export const deactivateSourceChannel = (id: any) => axiosInstance.patch(`/setups/source-channels/${id}/deactivate`);

// ------------------- PROSPECTS -------------------
export const getProspects = () => axiosInstance.get("/setups/prospects");
export const createProspect = (data: any) => axiosInstance.post("/setups/prospects", data);
export const updateProspect = (id: any, data: any) => axiosInstance.put(`/setups/prospects/${id}`, data);
export const deactivateProspect = (id: any) => axiosInstance.patch(`/setups/prospects/${id}/deactivate`);

// ------------------- PRESENT FILE POSITIONS -------------------
export const getPresentPositions = () => axiosInstance.get("/setups/present-file-positions");
export const createPresentPosition = (data: any) => axiosInstance.post("/setups/present-file-positions", data);
export const updatePresentPosition = (id: any, data: any) => axiosInstance.put(`/setups/present-file-positions/${id}`, data);
export const deactivatePresentPosition = (id: any) => axiosInstance.patch(`/setups/present-file-positions/${id}/deactivate`);

export const closeFile = async (payload: any) => {

    const payloadResponse = {
        reason: payload.reason
    }
    const res = await axiosInstance.post(`claims/${payload.claim_id}/close`, payloadResponse)
    return res.data
}

export const getFuelType = () => axiosInstance.get('/setups/fuel-types')
export const getTransmissionType = () => axiosInstance.get('/setups/transmissions')
export const getTaxiType = () => axiosInstance.get('/setups/taxi-types')

// ------------------- MID REASONS -------------------
export const getMidReasons = () => axiosInstance.get("/setups/mid_reasons");

export const getSettlementStatus = () => axiosInstance.get("/setups/settlement_statuses");

export const getLiabilityStances = () => axiosInstance.get("/setups/liability_stances");

export const getClientVehicle = () => axiosInstance.get("/setups/vehicle_statuses");

export const getThirdPartyVehicle = () => axiosInstance.get("/setups/vehicle_statuses");




