import React, { useState } from 'react';
import { TagInput } from '../../../components/TagInput/TagInput';
import { ReferrerConfigurations } from '../ReferrerConfigurations/ReferrerConfiguration';
import SetBar from '../../../components/SetBar/SetBar';
interface Tag {
  id: string;
  label: string;
}

interface SystemField {
  id: string;
  label: string;
  tags: Tag[];
}

export const SystemConfigurations: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'system' | 'referrer'>('system');
  
  const [systemFields, setSystemFields] = useState<SystemField[]>([
    {
      id: 'claimType',
      label: 'Claim Type',
      tags: [
        { id: '1', label: 'Label' },
        { id: '2', label: 'Label' }
      ]
    },
    {
      id: 'handler',
      label: 'Handler',
      tags: [
        { id: '3', label: 'Label' },
        { id: '4', label: 'Label' }
      ]
    },
    {
      id: 'targetDebt',
      label: 'Target Debt',
      tags: [
        { id: '5', label: 'Label' },
        { id: '6', label: 'Label' }
      ]
    },
    {
      id: 'howDidCustomerFindUs',
      label: 'How Did Customer Find Us',
      tags: [
        { id: '7', label: 'Label' },
        { id: '8', label: 'Label' }
      ]
    },
    {
      id: 'caseStatus',
      label: 'Case Status',
      tags: [
        { id: '9', label: 'Label' },
        { id: '10', label: 'Label' }
      ]
    },
    {
      id: 'presentFilePosition',
      label: 'Present File Position',
      tags: [
        { id: '11', label: 'Label' },
        { id: '12', label: 'Label' }
      ]
    },
    {
      id: 'Prospects of File',
      label: 'Prospects of File',
      tags: [
        { id: '11', label: 'Label' },
        { id: '12', label: 'Label' }
      ]
    },{
      id: 'Staff Name (for Staff Marketing)',
      label: 'Staff Name (for Staff Marketing)',
      tags: [
        { id: '11', label: 'Label' },
        { id: '12', label: 'Label' }
      ]
    }
  ]);

  const updateFieldTags = (fieldId: string, newTags: Tag[]) => {
    setSystemFields(fields =>
      fields.map(field =>
        field.id === fieldId ? { ...field, tags: newTags } : field
      )
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-4 py-8 pl-16 bg-white">
       <h1 className="text-3xl font-bold text-gray-900 mb-10">Settings</h1>
      {/* Main Tabs */}
      <SetBar />
      {/* Sub Tabs */}
      <div className="flex gap-8 mb-8 border-b border-gray-200">
        <button
          onClick={() => setActiveSubTab('system')}
          className={`pb-3 text-sm font-medium transition-colors ${
            activeSubTab === 'system'
              ? 'text-custom border-b-2 border-custom'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          System Configurations
        </button>
        <button
          onClick={() => setActiveSubTab('referrer')}
          className={`pb-3 text-sm font-medium transition-colors ${
            activeSubTab === 'referrer'
              ? 'text-custom border-b-2 border-custom'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Referrer Configurations
        </button>
      </div>

      {/* Content */}
      {activeSubTab === 'system' && (
        <div>
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">System Values</h2>
              <p className="text-gray-600 text-sm">Add, edit and delete the values of the following setups</p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button className="px-4 py-2 text-white bg-custom rounded-md hover:bg-[#3b68ff] transition-colors">
                Save
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            {systemFields.map((field) => (
              <div key={field.id} className="grid grid-cols-12 gap-6 items-start ">
                <div className="col-span-3">
                  <label className="block text-sm py-3 font-medium text-gray-700">
                    {field.label}
                  </label>
                </div>
                <div className="col-span-9 placeholder:text-gray-400">
                  <TagInput
                    tags={field.tags}
                    onTagsChange={(newTags) => updateFieldTags(field.id, newTags)}
                    placeholder="Type here..."
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'referrer' && (
        <ReferrerConfigurations />
      )}
    </div>
  );
};

export default SystemConfigurations;