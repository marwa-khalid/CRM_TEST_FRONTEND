import React, { useState } from 'react';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';

interface Referrer {
  id: string;
  companyName: string;
  address: string;
  postcode: string;
  tpCapture: 'Allowed' | 'Not Allowed';
  contactName: string;
  contactInitials: string;
  contactPhone: string;
  avatar?: string;
}

export const ReferrerConfigurations: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newReferrer, setNewReferrer] = useState({
    companyName: 'Rapid Claims Ltd',
    address: 'T23 Main Street, London',
    postcode: 'SW1A 1AA',
    tpCapture: 'Allowed' as 'Allowed' | 'Not Allowed',
    contactName: 'Drivia Roye',
    contactPhone: '+44 20 7123 4567'
  });
  const totalPages = 10;

  const referrers: Referrer[] = [
    {
      id: '1',
      companyName: 'Rapid Claims Ltd',
      address: '799, Oak Avenue, Birmingham, UK',
      postcode: 'SW1A 1AA',
      tpCapture: 'Allowed',
      contactName: 'Olivia Rhye',
      contactInitials: 'OR',
      contactPhone: '+44 20 7123 4567',
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=32&h=32&fit=crop&crop=face'
    },
    {
      id: '2',
      companyName: 'Rapid Claims Ltd',
      address: '799, Oak Avenue, Birmingham, UK',
      postcode: 'SW1A 1AA',
      tpCapture: 'Allowed',
      contactName: 'Phoenix Baker',
      contactInitials: 'PB',
      contactPhone: '+44 20 7123 4567',
      avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=32&h=32&fit=crop&crop=face'
    },
    {
      id: '3',
      companyName: 'Rapid Claims Ltd',
      address: '799, Oak Avenue, Birmingham, UK',
      postcode: 'SW1A 1AA',
      tpCapture: 'Allowed',
      contactName: 'Lana Steiner',
      contactInitials: 'LS',
      contactPhone: '+44 20 7123 4567'
    },
    {
      id: '4',
      companyName: 'Rapid Claims Ltd',
      address: '799, Oak Avenue, Birmingham, UK',
      postcode: 'SW1A 1AA',
      tpCapture: 'Not Allowed',
      contactName: 'Demi Wilkinson',
      contactInitials: 'DW',
      contactPhone: '+44 20 7123 4567'
    },
    {
      id: '5',
      companyName: 'Rapid Claims Ltd',
      address: '799, Oak Avenue, Birmingham, UK',
      postcode: 'SW1A 1AA',
      tpCapture: 'Allowed',
      contactName: 'Candice Wu',
      contactInitials: 'CW',
      contactPhone: '+44 20 7123 4567',
      avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=32&h=32&fit=crop&crop=face'
    },
    {
      id: '6',
      companyName: 'Rapid Claims Ltd',
      address: '799, Oak Avenue, Birmingham, UK',
      postcode: 'SW1A 1AA',
      tpCapture: 'Allowed',
      contactName: 'Natali Craig',
      contactInitials: 'NC',
      contactPhone: '+44 20 7123 4567'
    }
  ];

  const getStatusColor = (status: string) => {
    return status === 'Allowed' ? 'text-purple-600' : 'text-red-600';
  };

  const getStatusDot = (status: string) => {
    return status === 'Allowed' ? 'bg-custom' : 'bg-red-600';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewReferrer(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically save the new referrer to your backend
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Add Button */}
      <div className="flex justify-between items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search for referrers"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-500 focus:border-custom-500 outline-none"
          />
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="ml-4 flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add New Referrer
        </button>
      </div>
      
      {/* Referrer Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto relative">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-700">
              <div className="col-span-6">Company Name</div>
              <div className="col-span-1">Postcode</div>
              <div className="col-span-1">TP Capture</div>
              <div className="col-span-3">Contact Name</div>
              <div className="col-span-1"></div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-gray-200">
              {referrers.map((referrer) => (
                <div key={referrer.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                  {/* Company Name */}
                  <div className="col-span-6">
                    <div className="font-medium text-gray-900">{referrer.companyName}</div>
                    <div className="text-xs text-gray-500">{referrer.address}</div>
                  </div>

                  {/* Postcode */}
                  <div className="col-span-1 flex text-xs items-center">
                    <span className="text-gray-900">{referrer.postcode}</span>
                  </div>

                  {/* TP Capture */}
                  <div className="col-span-1 text-xs flex items-center">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusDot(referrer.tpCapture)}`}></div>
                      <span className={`text-xs font-medium ${getStatusColor(referrer.tpCapture)}`}>
                        {referrer.tpCapture}
                      </span>
                    </div>
                  </div>

                  {/* Contact Name */}
                  <div className="col-span-3 flex items-center">
                    <div className="flex items-center gap-3">
                      {referrer.avatar ? (
                        <img
                          src={referrer.avatar}
                          alt={referrer.contactName}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-purple-600">
                            {referrer.contactInitials}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{referrer.contactName}</div>
                        <div className="text-xs text-gray-500">{referrer.contactPhone}</div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex gap-2">
                    <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="border-t border-gray-200 bg-white px-6 py-3">
              <div className="flex items-center justify-between">
                {/* Page info on the left */}
                <div className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </div>

                {/* Buttons on the right */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add New Referrer Modal - Updated Design */}
      {showAddModal && (
        <div className="fixed inset-0  bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-lg p-4 w-full  max-w-md">
          
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-purple-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-purple-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-4 0H9m4 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v12m4 0V9" />
              </svg>
            </div>
          </div>
      
          {/* Title */}
          <h3 className="text-xl font-semibold text-center mt-4">Add New Referrer</h3>
          <p className="text-sm text-gray-500 text-center mt-1">
            Enter the referrer details below
          </p>
      
          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input
                type="text"
                name="companyName"
                value={newReferrer.companyName}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-500 focus:border-custom-500 outline-none"
              />
            </div>
      
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                name="address"
                value={newReferrer.address}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-500 focus:border-custom-500 outline-none"
              />
            </div>
      
            {/* Postcode + TP Capture side by side */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
                <input
                  type="text"
                  name="postcode"
                  value={newReferrer.postcode}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-500 focus:border-custom-500 outline-none"
                />
              </div>
      
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">TP Capture</label>
                <select
                  name="tpCapture"
                  value={newReferrer.tpCapture}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-500 focus:border-custom-500 outline-none"
                >
                  <option value="Allowed">Allowed</option>
                  <option value="Not Allowed">Not Allowed</option>
                </select>
              </div>
            </div>
      
            {/* Contact Name + Phone side by side */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                <input
                  type="text"
                  name="contactName"
                  value={newReferrer.contactName}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-500 focus:border-custom-500 outline-none"
                />
              </div>
      
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
                <input
                  type="text"
                  name="contactPhone"
                  value={newReferrer.contactPhone}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-500 focus:border-custom-500 outline-none"
                />
              </div>
            </div>
      
            {/* Buttons */}
            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-lg hover:bg-[#3b68ff] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-500"
              >
                Confirm
              </button>
            </div>
          </form>
        </div>
      </div>
      
      )}
    </div>
  );
};