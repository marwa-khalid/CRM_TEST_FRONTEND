import React, { useCallback, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import LoginPage from './modules/Login/login';
import ClaimListingPage from "./modules/Dashboard/ClaimListingPage";
import MainLayout from './Layout/layout';
import { FleetRoutes } from "./fleet";
import { ToastContainer } from 'react-toastify';
import ReminderWatcher from "./components/Reminders/ReminderWatcher";
import OTPPage from './modules/Login/OTPPage';
import AccountSettings from "./modules/Claims/AccountSettings/AccountSettingsPage";
import TeamsCalendarExample from "./modules/CalendarExamples/TeamsCalendarExample";
import ForgotPassword from './modules/Login/ForgotPassword';
import AccountLocked from './modules/Login/AccountLocked';
import ForgotPassword2 from './modules/Login/ForgotPassword2';
import ResetPassword from './modules/Login/ResetPassword';
import ResetPassword2 from './modules/Login/ResetPassword2';
import SingleSignOn from './modules/Login/SingleSignOn';
import SingleSignOn2 from './modules/Login/SingleSignOn2';
import EmailTemplates1 from './modules/Login/EmailTemplates1';
import EmailTemplates2 from './modules/Login/EmailTemplates2';
import EmailTemplates3 from './modules/Login/EmailTemplates3';
import SendMail from './modules/Login/SendMail';
import AddClaimPage from "./modules/Claims/AddClaimPage";
import ClaimsList from "./modules/Claims/ClaimsList";
import {AccidentSketch} from './modules/Login/Canvas';
import QuestionnaireLayout from "./modules/Claims/Questionnaire/QuestionnaireLayout";
import Step1Witness from './modules/Claims/Questionnaire/WitnessStep1';
import Step2Questions from './modules/Claims/Questionnaire/WitnessStep2';
import Step3SketchPreview from './modules/Claims/Questionnaire/WitnessStep3';
import CaseActivityStream from './modules/Claims/CaseActivity/CaseActivityStream';
import DocumentLibrary from './modules/Claims/DocumentsLibrary/DocumentsLibrary';
import Step4Signature from './modules/Claims/Questionnaire/WitnessStep4';
import { useInactivityTimer } from './hooks/useInactivityTimer';
import SessionExpired from './modules/Login/SessionExpired';
import { logSessionExpiry } from './services/AccountSettings/AccountSettings';
import { useCurrentUser } from './context/AuthContext';

const AppInner: React.FC = () => {
  const navigate = useNavigate();
  const [sessionExpired, setSessionExpired] = useState(false);
  const { user, logout } = useCurrentUser();

  const isAuthenticated = !!user;

  const handleExpire = useCallback(async () => {
    try {
      await logSessionExpiry();
    } catch {
      /* ignore */
    }
    setSessionExpired(true);
  }, []);

  useInactivityTimer(handleExpire, isAuthenticated);

  const handleRelogin = async () => {
    await logout();
    setSessionExpired(false);
    navigate("/login");
  };

  return (
    <>
      {sessionExpired && <SessionExpired onRelogin={handleRelogin} />}
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<SendMail />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/otp" element={<OTPPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/forgot-password2" element={<ForgotPassword2 />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />
        <Route path="/auth/reset-password2" element={<ResetPassword2 />} />
        <Route path="/account-locked" element={<AccountLocked />} />
        <Route path="/single-signon" element={<SingleSignOn />} />
        <Route path="/single-signon2" element={<SingleSignOn2 />} />
        <Route path="/email-templates1" element={<EmailTemplates1 />} />
        <Route path="/email-templates2" element={<EmailTemplates2 />} />
        <Route path="/email-templates3" element={<EmailTemplates3 />} />
        <Route path="/send-mail" element={<SendMail />} />
        <Route path="/dashboard" element={<ClaimListingPage />} />
        <Route path="/add-claim/:claimId?" element={<AddClaimPage />} />
        <Route path="/canvas" element={<AccidentSketch />} />
        <Route path="/case-activity" element={<CaseActivityStream />} />
        <Route path="/document-library" element={<DocumentLibrary />} />
        <Route path="/settings" element={<AccountSettings />} />
        <Route path="/example1" element={<TeamsCalendarExample />} />

        {/* Fleet module — fully self-contained under /fleet/* (src/fleet). */}
        <Route path="/fleet/*" element={<FleetRoutes />} />

        <Route path="/questionnaire/:token" element={<QuestionnaireLayout />}>
          <Route path="step-1" element={<Step1Witness />} />
          <Route path="step-2" element={<Step2Questions />} />
          <Route path="step-3" element={<Step3SketchPreview />} />
          <Route path="step-4" element={<Step4Signature />} />
        </Route>

        <Route path="/questionnaire/view/:id" element={<QuestionnaireLayout />}>
          <Route path="step-1" element={<Step1Witness />} />
          <Route path="step-2" element={<Step2Questions />} />
          <Route path="step-3" element={<Step3SketchPreview />} />
          <Route path="step-4" element={<Step4Signature />} />
        </Route>

        {/* Protected routes with layout */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<ClaimListingPage />} />
          <Route path="/claims" element={<ClaimsList />} />
          <Route path="/add-claim" element={<AddClaimPage />} />
          <Route path="/settings" element={<AccountSettings />} />
        </Route>
      </Routes>
      <ReminderWatcher />
    </>
  );
};

const App: React.FC = () => {
  return (
    <>
      <ToastContainer style={{ zIndex: "9999999999999" }} />
      <Router>
        <AppInner />
      </Router>
    </>
  );
};

export default App;
