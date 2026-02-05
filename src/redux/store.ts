import { configureStore, combineReducers } from "@reduxjs/toolkit";
import isClosedReducer from "./Claim/claimSlice";
import engineerReducer from "./Engineer/engineerSlice"
// Combine all your slices
const appReducer = combineReducers({
  isClosed: isClosedReducer,
  engineer: engineerReducer,
});

const rootReducer = (state: ReturnType<typeof appReducer> | undefined, action: any) => {
  if (action.type === "RESET_STORE") {
    state = undefined;
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
