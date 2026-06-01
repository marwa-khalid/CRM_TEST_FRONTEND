import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Settings, Bell, Menu, X, LogOut } from "lucide-react";
import logoImage from "../../assets/images/Logo.png";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const user = localStorage.getItem("user_name");
  const userInitial = user ? user.charAt(0).toUpperCase() : "";
  const dispatch = useDispatch();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const claim_questionnaire_id = searchParams.get("claim_questionnaire_id");
  const details = searchParams.get("details")
  const userMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }

    function handleScroll() {
      setIsUserMenuOpen(false); // Close menu on scroll
    }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    localStorage.removeItem("activeUser");
    localStorage.removeItem("user_name");
    dispatch({ type: "RESET_STORE" });
    navigate("/login");
  };

  const navItems = [
    { label: "Home", path: "/" },
    {
      label: "Claims",
      subItems: [
        { label: "All Claims", path: "/claims" },
        { label: "New Claim", path: "/new-claim" },
        { label: "Drafts", path: "/drafts" },
      ],
    }, //,
    // { label: 'Cases', path: '/cases' },
    // { label: 'Calendar', path: '/calendar' },
    // { label: 'Tasks', path: '/tasks' }
  ];

  return (
    <>
      {!claim_questionnaire_id && !details && (
        <header className="bg-white border-b border-gray-200 fixed top-0 left-0 w-full z-[50]">
          <div className="pl-[112px] pr-[112px] md:pl-[112px] md:pr-[112px] py-5 relative">
            <div className="flex items-center justify-between">
              {/* Logo and Navigation */}
              <div className="flex items-center space-x-8">
                <div className="flex items-center">
                  <img
                    src={logoImage}
                    alt="ProClaim Logo"
                    className="mr-3 object-contain cursor-pointer h-8"
                    onClick={() => navigate("/")}
                  />
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex space-x-8">
                  {navItems.map((item) =>
                    item.subItems ? (
                      <div key={item.label} className="relative group z-9999">
                        <div className="flex font-weight-600 items-center text-gray-500 hover:text-gray-900 cursor-pointer">
                          <span>{item.label}</span>
                          <ChevronDown className="ml-1 h-4 w-4" />
                        </div>
                        <div className="absolute left-0 top-full mt-0 group-hover:flex hidden flex-col bg-white border border-gray-200 shadow-lg rounded-md min-w-[150px] !z-9999999999">
                          {item.subItems.map((subItem) => (
                            <p
                              key={subItem.label}
                              onClick={() => navigate(subItem.path)}
                              className="block px-4 py-2 text-sm font-weight-600 text-gray-600 hover:bg-gray-100 cursor-pointer"
                            >
                              {subItem.label}
                            </p>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p
                        key={item.label}
                        onClick={() => navigate(item.path)}
                        className="text-gray-500 font-weight-600 hover:text-gray-600 cursor-pointer"
                      >
                        {item.label}
                      </p>
                    )
                  )}
                </nav>
              </div>

              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 text-gray-500 hover:text-gray-900"
                  aria-label="Menu"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </button>
              </div>

              {/* Right Side Icons */}
              <div className="hidden md:flex items-center space-x-4 relative">
                {/* <button 
                onClick={() => navigate('/settings/profile')} 
                className="p-2 text-gray-400 hover:text-gray-600" 
                aria-label="Settings"
              >
                <Settings className="h-5 w-5" />
              </button> */}
                {/* <button className="p-2 text-gray-400 hover:text-gray-600" aria-label="Notifications">
                <Bell className="h-5 w-5" />
              </button> */}

                {/* User Avatar + Name */}
                {/* User Avatar + Name */}
                <div ref={userMenuRef} className="relative">
                  <div
                    className="flex items-center space-x-2 cursor-pointer"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  >
                    <div className="w-8 h-8 bg-custom rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium mt-[0.9px]">
                        {userInitial}
                      </span>
                    </div>
                  </div>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 top-12 bg-white border border-gray-200 shadow-lg rounded-md min-w-[150px] z-50">
                      <p
                        onClick={handleLogout}
                        className="flex items-center px-4 py-2 text-sm font-weight-600 text-gray-600 hover:bg-gray-100 cursor-pointer"
                      >
                        <LogOut className="mr-2 h-4 w-4" /> Logout
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
              <div className="md:hidden absolute left-0 right-0 bg-white shadow-lg z-50 border-t border-gray-200">
                <nav className="flex flex-col p-4 space-y-4">
                  {navItems.map((item) =>
                    item.subItems ? (
                      <div key={item.label} className="flex flex-col">
                        <div
                          className="flex items-center justify-between py-2 font-weight-600 text-gray-700 cursor-pointer"
                          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                          <span>{item.label}</span>
                          <ChevronDown className="h-4 w-4" />
                        </div>
                        <div className="pl-4 space-y-2">
                          {item.subItems.map((subItem) => (
                            <p
                              key={subItem.label}
                              onClick={() => {
                                navigate(subItem.path);
                                setIsMobileMenuOpen(false);
                              }}
                              className="block py-2 text-sm font-weight-600 text-gray-600 hover:bg-gray-100 cursor-pointer"
                            >
                              {subItem.label}
                            </p>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p
                        key={item.label}
                        onClick={() => {
                          navigate(item.path);
                          setIsMobileMenuOpen(false);
                        }}
                        className="py-2 font-weight-600 text-gray-700 cursor-pointer"
                      >
                        {item.label}
                      </p>
                    )
                  )}
                  <div className="flex items-center space-x-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        navigate("/settings/profile");
                        setIsMobileMenuOpen(false);
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600"
                      aria-label="Settings"
                    >
                      <Settings className="h-5 w-5" />
                    </button>
                    <button
                      className="p-2 text-gray-400 hover:text-gray-600"
                      aria-label="Notifications"
                    >
                      <Bell className="h-5 w-5" />
                    </button>
                    <div
                      className="flex items-center space-x-2 cursor-pointer"
                      onClick={handleLogout}
                    >
                      <div className="w-8 h-8 bg-custom rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {userInitial}
                        </span>
                      </div>
                    </div>
                  </div>
                </nav>
              </div>
            )}
          </div>
        </header>
      )}
    </>
  );
};

export default Header;
