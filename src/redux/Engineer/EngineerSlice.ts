import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface engineerState {
  engineer_report_received: boolean;
  ocr_engineer: object | null;
}

const initialState: engineerState = {
  engineer_report_received: false,
  ocr_engineer: null,
};

const engineerSlice = createSlice({
  name: "engineer",
  initialState,
  reducers: {
    setEngineerReportReceived: (state, action: PayloadAction<boolean>) => {
      state.engineer_report_received = action.payload;
    },
    setOcrEngineer: (state, action: PayloadAction<object | null>) => {
      state.ocr_engineer = action.payload;
    },
    resetEngineer: () => initialState,
  },
});

export const { setEngineerReportReceived, setOcrEngineer, resetEngineer } = engineerSlice.actions;

export default engineerSlice.reducer;