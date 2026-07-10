import React, { useState, type JSX } from 'react';
import { FileText, Video, Figma, Check, Trash2 } from 'lucide-react';
import SetBar from '../../../claims/SetBar/SetBar';
import {
    FiMail,
    FiUploadCloud,
    FiClock,
    FiChevronDown,
    FiBold,
    FiItalic,
    FiLink,
} from 'react-icons/fi';
import { BsListOl, BsListUl } from 'react-icons/bs';

const SettingsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('My details');
    const [bioText, setBioText] = useState("I'm a Product Designer based in Melbourne, Australia. I specialise in UX/UI design, brand strategy, and Webflow development.");
    const maxBioLength = 300;
    const tabs = ['My details', 'Profile', 'Password', 'Team', 'Plan', 'Billing', 'Email', 'Notifications', 'Integrations', 'API'];

    const renderSection = (tabName: string, content: JSX.Element) => {
        return activeTab === tabName ? content : null;
    };

    return (
        <div className="bg-white min-h-screen">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <header className="pl-2 sm:pl-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-10">Settings</h1>
                    <SetBar />
                </header>

                {/* Tabs */}
                <nav className="pl-2 sm:pl-6 overflow-x-auto">
                    <ul className="flex space-x-1 sm:space-x-2 text-sm font-medium text-gray-500 whitespace-nowrap">
                        {tabs.map(tab => (
                            <li key={tab}>
                                <button
                                    onClick={() => setActiveTab(tab)}
                                    className={`inline-flex items-center justify-center p-2 sm:p-4 border-b-2 rounded-t-lg group ${activeTab === tab
                                        ? 'text-custom border-custom'
                                        : 'border-transparent hover:text-gray-600 hover:border-gray-300'
                                        }`}
                                >
                                    <span className="text-xs sm:text-sm">
                                        {tab}
                                    </span>
                                    {tab === 'Team' && <span className="bg-gray-100 text-gray-800 text-xs font-medium ml-1 sm:ml-2 px-1.5 sm:px-2.5 py-0.5 rounded-full">4</span>}
                                    {tab === 'Billing' && <span className="bg-gray-100 text-gray-800 text-xs font-medium ml-1 sm:ml-2 px-1.5 sm:px-2.5 py-0.5 rounded-full">2</span>}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* --- Form Sections --- */}
                <form className="mt-6 divide-y divide-gray-200">
                    {/* Personal Info Section */}
                    {renderSection('My details', (
                        <div className="p-4 sm:p-6">
                            <div className="py-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div>
                                        <h1 className="text-base font-weight-600 text-gray-900 mb-1 sm:mb-2">Personal info</h1>
                                        <p className="text-gray-600 text-sm font-normal">Update your personal information.</p>
                                    </div>
                                    
                                    <div className="flex gap-3 self-end sm:self-auto">
                                        <button type="button" className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base text-gray-700 bg-white border rounded-lg hover:bg-gray-200 transition-colors">
                                            Cancel
                                        </button>
                                        <button type="button" className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base text-white bg-custom rounded-lg hover:bg-purple-800 transition-colors">
                                            Save
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <hr className="w-full border-gray-200 mb-3" />
                            <div className="sm:pr-4 lg:pr-16 xl:pr-64">
                                <div className="space-y-6">
                                    {/* Name Field */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-y-2 gap-x-4 items-start">
                                        <label htmlFor="firstName" className="text-sm font-medium text-gray-700 md:pt-2">Name</label>
                                        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <input type="text" name="firstName" id="firstName" defaultValue="Oliva" className="block w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-custom-500 focus:border-custom-500 sm:text-sm" />
                                            <input type="text" name="lastName" id="lastName" defaultValue="Rhye" className="block w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-custom-500 focus:border-custom-500 sm:text-sm" />
                                        </div>
                                    </div>
                                    {/* Email Field */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-y-2 gap-x-4 items-start">
                                        <label htmlFor="email" className="text-sm font-medium text-gray-700 md:pt-2">Email address</label>
                                        <div className="relative md:col-span-2">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <FiMail className="text-gray-400 h-5 w-5" />
                                            </div>
                                            <input type="email" name="email" id="email" defaultValue="olivia@untitledui.com" className="block w-full pl-10 pr-3 py-2 text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-custom-500 focus:border-custom-500 sm:text-sm" />
                                        </div>
                                    </div>
                                    {/* Your Photo Field */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-y-2 gap-x-4 items-start">
                                        <div className="text-sm font-medium text-gray-700">
                                            <p>Your photo</p>
                                            <p className="text-xs text-gray-500 mt-1">This will be displayed on your profile.</p>
                                        </div>
                                        <div className="md:col-span-2 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                            <img className="w-16 h-16 rounded-full object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80" alt="Profile" />
                                            <div className="flex-1 w-full border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center">
                                                <div className="flex flex-col items-center justify-center">
                                                    <div className="w-8 sm:w-10 h-8 sm:h-10 mb-2 flex items-center justify-center rounded-full bg-gray-100 border border-gray-200">
                                                        <FiUploadCloud className="text-gray-500 h-4 sm:h-5 w-4 sm:w-5" />
                                                    </div>
                                                    <p className="text-xs sm:text-sm text-gray-600">
                                                        <span className="font-weight-600 text-custom cursor-pointer hover:underline">Click to upload</span> or drag and drop
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">SVG, PNG, JPG or GIF (max. 800x400px)</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <hr className="my-6 sm:my-8 border-gray-200" />
                                <div className="grid grid-cols-1 mt-6 sm:mt-10 gap-y-4 gap-x-6">
                                    <div className="space-y-6">
                                        {/* Role, Country, Timezone, Bio */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-2 gap-x-4 items-start">
                                            <label htmlFor="role" className="text-sm font-medium text-gray-700 sm:pt-2">Role</label>
                                            <div className="sm:col-span-2">
                                                <input type="text" name="role" id="role" defaultValue="Product Designer" className="block w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-custom-500 focus:border-custom-500 sm:text-sm" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-2 gap-x-4 items-start">
                                            <label htmlFor="country" className="text-sm font-medium text-gray-700 sm:pt-2">Country</label>
                                            <div className="relative sm:col-span-2">
                                                <select id="country" name="country" className="block w-full pl-4 pr-10 py-2 text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-custom-500 focus:border-custom-500 sm:text-sm appearance-none">
                                                    <option>United States</option>
                                                    <option>Canada</option>
                                                    <option>Mexico</option>
                                                </select>
                                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                    <FiChevronDown className="h-5 w-5 text-gray-400" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-2 gap-x-4 items-start">
                                            <label htmlFor="timezone" className="text-sm font-medium text-gray-700 sm:pt-2">Timezone</label>
                                            <div className="relative sm:col-span-2">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <FiClock className="text-gray-400 h-5 w-5" />
                                                </div>
                                                <select id="timezone" name="timezone" className="block w-full pl-10 pr-10 py-2 text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-custom-500 focus:border-custom-500 sm:text-sm appearance-none">
                                                    <option>Pacific Standard Time (PST) UTC-08:00</option>
                                                    <option>Eastern Standard Time (EST) UTC-05:00</option>
                                                    <option>Greenwich Mean Time (GMT) UTC+00:00</option>
                                                </select>
                                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                    <FiChevronDown className="h-5 w-5 text-gray-400" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-2 gap-x-4 items-start">
                                            <label htmlFor="bio" className="text-sm font-medium text-gray-700 sm:pt-2">
                                                Bio
                                                <span className="block text-xs text-gray-500 font-normal">Write a short intro.</span>
                                            </label>
                                            <div className="sm:col-span-2">
                                                <div className="border border-gray-300 rounded-lg">
                                                    <div className="p-2 border-b border-gray-300 flex items-center space-x-1">
                                                        <button type="button" className="p-1 sm:p-1.5 rounded hover:bg-gray-100 text-gray-500"><FiBold size={18} /></button>
                                                        <button type="button" className="p-1 sm:p-1.5 rounded hover:bg-gray-100 text-gray-500"><FiItalic size={18} /></button>
                                                        <button type="button" className="p-1 sm:p-1.5 rounded hover:bg-gray-100 text-gray-500"><FiLink size={18} /></button>
                                                        <button type="button" className="p-1 sm:p-1.5 rounded hover:bg-gray-100 text-gray-500"><BsListUl size={18} /></button>
                                                        <button type="button" className="p-1 sm:p-1.5 rounded hover:bg-gray-100 text-gray-500"><BsListOl size={18} /></button>
                                                    </div>
                                                    <textarea id="bio" rows={5} value={bioText} onChange={(e) => setBioText(e.target.value)} maxLength={maxBioLength} className="block w-full p-3 border-0 rounded-b-lg resize-none focus:ring-0 sm:text-sm text-gray-900" placeholder="Start writing..."></textarea>
                                                </div>
                                                <p className="mt-2 text-sm text-gray-500">{maxBioLength - bioText.length} characters left</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <hr className="my-6 sm:my-8 border-gray-200" />
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-6">
                                    <div className="md:col-span-1">
                                        <h2 className="text-lg font-weight-600 text-gray-900">Portfolio projects</h2>
                                        <p className="mt-1 text-sm text-gray-600">Share a few snippets of your work.</p>
                                    </div>
                                    <div className="md:col-span-2 space-y-6">
                                        {/* Uploader */}
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-10 sm:w-12 h-10 sm:h-12 mb-2 sm:mb-3 flex items-center justify-center rounded-full bg-gray-100 border-2 border-gray-200">
                                                    <FiUploadCloud className="text-gray-500 h-5 sm:h-6 w-5 sm:w-6" />
                                                </div>
                                                <p className="text-xs sm:text-sm text-gray-600">
                                                    <span className="font-weight-600 text-custom cursor-pointer hover:underline">Click to upload</span> or drag and drop
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">SVG, PNG, JPG or GIF (max. 10MB)</p>
                                            </div>
                                        </div>
                                        {/* Upload List */}
                                        <div className="bg-gray-50 flex">
                                            <div className="w-full space-y-3">
                                                {/* PDF File - Completed */}
                                                <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-5">
                                                    <div className="flex items-start gap-3 sm:gap-4">
                                                        <div className="flex-shrink-0 mt-0.5">
                                                            <FileText className="w-4 sm:w-5 h-4 sm:h-5 text-custom" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between mb-1 sm:mb-2">
                                                                <h3 className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                                                                    Tech design requirements.pdf
                                                                </h3>
                                                                <div className="w-5 sm:w-6 h-5 sm:h-6 bg-custom rounded-full flex items-center justify-center">
                                                                    <Check className="w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 text-white" />
                                                                </div>
                                                            </div>
                                                            <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">200 KB</p>
                                                            <div className="flex items-center gap-3 sm:gap-4">
                                                                <div className="flex-1 bg-gray-200 rounded-full h-1.5 sm:h-2">
                                                                    <div className="h-full bg-custom rounded-full w-full" />
                                                                </div>
                                                                <span className="text-xs sm:text-sm font-medium text-gray-700 min-w-[35px] sm:min-w-[40px] text-right">
                                                                    100%
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* MP4 File - 40% Progress */}
                                                <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-5">
                                                    <div className="flex items-start gap-3 sm:gap-4">
                                                        <div className="flex-shrink-0 mt-0.5">
                                                            <Video className="w-4 sm:w-5 h-4 sm:h-5 text-custom" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between mb-1 sm:mb-2">
                                                                <h3 className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                                                                    Dashboard prototype recording.mp4
                                                                </h3>
                                                                <button className="text-gray-400">
                                                                    <Trash2 className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                                                                </button>
                                                            </div>
                                                            <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">16 MB</p>
                                                            <div className="flex items-center gap-3 sm:gap-4">
                                                                <div className="flex-1 bg-gray-200 rounded-full h-1.5 sm:h-2">
                                                                    <div className="h-full bg-custom rounded-full" style={{ width: '40%' }} />
                                                                </div>
                                                                <span className="text-xs sm:text-sm font-medium text-gray-700 min-w-[35px] sm:min-w-[40px] text-right">
                                                                    40%
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Figma File - 80% Progress */}
                                                <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-5">
                                                    <div className="flex items-start gap-3 sm:gap-4">
                                                        <div className="flex-shrink-0 mt-0.5">
                                                            <Figma className="w-4 sm:w-5 h-4 sm:h-5 text-custom" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between mb-1 sm:mb-2">
                                                                <h3 className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                                                                    Dashboard prototype FINAL.fig
                                                                </h3>
                                                                <button className="text-gray-400">
                                                                    <Trash2 className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                                                                </button>
                                                            </div>
                                                            <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">4.2 MB</p>
                                                            <div className="flex items-center gap-3 sm:gap-4">
                                                                <div className="flex-1 bg-gray-200 rounded-full h-1.5 sm:h-2">
                                                                    <div className="h-full bg-custom rounded-full" style={{ width: '80%' }} />
                                                                </div>
                                                                <span className="text-xs sm:text-sm font-medium text-gray-700 min-w-[35px] sm:min-w-[40px] text-right">
                                                                    80%
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {/* Placeholder for other tabs */}
                    {renderSection('Password', <div className="p-6"><h2 className="text-lg font-weight-600 text-gray-900">Password Settings</h2></div>)}
                    {renderSection('Team', <div className="p-6"><h2 className="text-lg font-weight-600 text-gray-900">Team Management</h2></div>)}
                    {/* ... add placeholders for other tabs as needed */}

                    {/* --- Action Buttons --- */}
                    <div className="p-4 sm:p-6 flex justify-end gap-x-3">
                        <button type="button" className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-weight-600 text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none">
                            Cancel
                        </button>
                        <button type="submit" className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-weight-600 text-white bg-custom border border-transparent rounded-lg shadow-sm hover:bg-[#3b68ff] focus:outline-none focus:ring-2">
                            Save 
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SettingsPage;