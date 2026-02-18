import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface CounterState {
  isClosed: boolean;
  referrence_no: string;
  surname: string;
  claimId: any;
  clientVehicleIdStore: any
  thirdPartyVehicleIdStore: any
  vehicleDataStateAI: any
  selectedPosition: any
}

const initialState: CounterState = {
  isClosed: false,
  referrence_no: '',
  surname: '',
  claimId: null,
  clientVehicleIdStore: null,
  thirdPartyVehicleIdStore: null,
  vehicleDataStateAI: null,
  selectedPosition: null,
};

const isClosedSlice = createSlice({
  name: "isClosed",
  initialState,
  reducers: {
    setIsClosed: (state, action: PayloadAction<boolean>) => {
      state.isClosed = action.payload;
    },
    toggleIsClosed: (state) => {
      state.isClosed = !state.isClosed;
    },
    setClaimReferrence: (state, action) => {
      state.referrence_no = action.payload
    },
    setClientSurName: (state, action) => {
      state.surname = action.payload
    },
    setClaimId: (state, action) => {
      state.claimId = action.payload
    },
    setClientVehicleIdStore: (state, action) => {
      state.clientVehicleIdStore = action.payload
    },
    setThirdPartyVehicleIdStore: (state, action) => {
      state.thirdPartyVehicleIdStore = action.payload
    },
    setVehicleDataState: (state, action) => {
      state.vehicleDataStateAI = action.payload
    },
    setSelectedPosition: (state, action) => {
      state.selectedPosition = action.payload
    }
  },
});

export const { setIsClosed, setClaimReferrence, setClientSurName, setClaimId, setClientVehicleIdStore, setThirdPartyVehicleIdStore, setVehicleDataState, setSelectedPosition } = isClosedSlice.actions;
export default isClosedSlice.reducer;
