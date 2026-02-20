import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import Signup from './modules/Signup/signup';
import LoginPage from './modules/Login/login';
import Dashboard from './modules/Dashboard/dashboard';
import MainLayout from './Layout/layout';
// import Claims from './modules/Claims/ClaimsList';
// import ProfileSetting from './modules/Setting/ProfileSetting/ProfileSetting';
// import SystemConfigurations from './modules/Setting/SystemConfig/SystemConfig';
// import NewClaims from './modules/Claims/NewClaims';
import { ToastContainer } from 'react-toastify';
// import Questionnaire from './modules/Questionnaire/Questionnaire';
// import CarDamageOverlay from './components/NewClaims/AIDamageDetection';
import OTPPage from './modules/Login/OTPPage';
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
import {AccidentSketch} from './modules/Login/Canvas';
const App: React.FC = () => {

  return (
    <>
      <ToastContainer style={{ zIndex: "9999999999999" }} />
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/" element={<SendMail />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/otp" element={<OTPPage />} />
          {/* <Route path="/signup" element={<Signup />} /> */}
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
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/add-claim" element={<AddClaimPage />} />
          <Route path="/canvas" element={<AccidentSketch />} />

          {/* Redirect to login if no route matches */}
          {/* Protected Routes with Layout */}
          <Route element={<MainLayout />}>
            {/* Dashboard Routes */}
            {/* <Route path="/" element={<Claims />} /> */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/add-claim" element={<AddClaimPage />} />
            {/* Claims Routes */}
            {/* <Route path="/claims" element={<Claims />} />

            <Route path="/new-claim" element={<NewClaims />} />
            <Route path="/claim/:id" element={<NewClaims />} /> */}
            {/* <Route path="/questionnaire" element={<Questionnaire />} /> */}
            {/* <Route path="/ai-damage" element={<CarDamageOverlay />} /> */}
            {/* Settings */}

            {/* <Route path="/settings/profile" element={<ProfileSetting />} />
            <Route path="/settings/system" element={<SystemConfigurations />} /> */}
          </Route>
        </Routes>
      </Router>
    </>
  );
};

export default App;
