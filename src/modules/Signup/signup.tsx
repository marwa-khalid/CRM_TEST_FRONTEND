import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import logoImage from '../../assets/images/Logo.png';
import { useNavigate, Link } from 'react-router-dom';
import Modal from '../../claims/Modal/Modals';
import accidentImage from '../../assets/images/1cbcac34591b113950559367e9110f4f4c7bcec3.png'
import { signup } from '../../services/Authentication/auth';


const Signup: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalType, setModalType] = useState<'success' | 'error'>('success');
  const [modalTitle, setModalTitle] = useState<string>('');
  const [modalMessage, setModalMessage] = useState<string>('');

  const navigate = useNavigate();

  const showSuccessModal = (title: string, message: string) => {
    setModalType('success');
    setModalTitle(title);
    setModalMessage(message);
    setShowModal(true);
  };

  const showErrorModal = (title: string, message: string) => {
    setModalType('error');
    setModalTitle(title);
    setModalMessage(message);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (password !== confirmPassword) {
      showErrorModal('Password Mismatch', "The passwords you entered don't match. Please try again.");
      return;
    }

    if (!companyName) {
      showErrorModal('Missing Information', "Company name is required to create your account.");
      return;
    }

    if (password.length < 6) {
      showErrorModal('Weak Password', "Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      await signup({
        user_name: email,
        password,
        first_name: firstName,
        last_name: lastName,
        company_name: companyName
      });
      
      showSuccessModal(
        'Account Created Successfully!', 
        `Welcome ${firstName}! Your account has been created. You'll be redirected to login shortly.`
      );

      setTimeout(() => {
        setShowModal(false);
        navigate('/login');
      }, 2500);

    } catch (err) {
      let errorMessage = "An unknown error occurred during signup.";
      let errorTitle = "Signup Failed";

      if (err instanceof Error) {
        errorMessage = err.message;
        
        if (errorMessage.toLowerCase().includes('email')) {
          errorTitle = 'Email Issue';
        } else if (errorMessage.toLowerCase().includes('password')) {
          errorTitle = 'Password Issue';
        } else if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('connection')) {
          errorTitle = 'Connection Problem';
        }
      }

      showErrorModal(errorTitle, errorMessage);
      console.error("Signup error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex">
        <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
          <div className="mx-auto w-full max-w-sm lg:w-96">
            <div className="mb-8">
              <div className="flex items-center">
                <img src={logoImage} alt="ProClaim Logo" className="object-contain" />
              </div>
            </div>

            {/* Form */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Create account</h2>
              <p className="text-gray-600 mb-8">Get started by entering your details.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-custom-700 focus:border-custom-700 transition-colors"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-custom-700 focus:border-custom-700 transition-colors"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                {/* Company Field */}
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-custom-700 focus:border-custom-700 transition-colors"
                    placeholder="Your Company"
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-custom-700 focus:border-custom-700 transition-colors"
                    placeholder="Enter your email"
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-custom-700 focus:border-custom-700 transition-colors"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-custom-700 focus:border-custom-700 transition-colors"
                    placeholder="••••••••"
                  />
                </div>

                {/* Sign up button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-custom hover:bg-[#252B37] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-600 transition-colors ${
                      isLoading ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating account...
                      </span>
                    ) : (
                      'Create account'
                    )}
                  </button>
                </div>
              </form>

              {/* Login link */}
              <p className="mt-6 text-center text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-custom hover:text-[#252B37] transition-colors">
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Device mockup */}
        <div className="hidden lg:block relative w-0 flex-1">
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-end">
            {/* <div className="w-96 h-2/3 bg-white rounded-l-3xl shadow-2xl border-r-0 border-4 border-gray-800 overflow-hidden"> */}
              {/* <div className="w-full h-full bg-gray-300 flex items-center justify-center"> */}
              <img src={accidentImage} alt=''/>
              {/* </div> */}
            {/* </div> */}
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        type={modalType}
        title={modalTitle}
        message={modalMessage}
        showCloseButton={modalType === 'error'}
      />
    </>
  );
};

export default Signup;