// import { useState, useRef, useEffect } from 'react';
// import { 
//   Search, 
//   Plus, 
//   Import, 
//   X,
//   Filter,
//   ChevronLeft,
//   ChevronRight,
//   MoreHorizontal,
//   MoreVertical
// } from 'lucide-react';
// import { useNavigate } from "react-router-dom";

// interface Claim {
//   id: string;
//   claimNumber: string;
//   clientName: string;
//   clientEmail: string;
//   type: string;
//   incidentDate: string;
//   assignedTo: string;
//   status: 'Processing' | 'Closed' | 'Approved';
//   priority: 'High' | 'Medium' | 'Low';
//   avatar: string;
// }

// const mockClaims: Claim[] = [
//   {
//     id: '1',
//     claimNumber: 'ACC-2024-001',
//     clientName: 'Olivia Rhye',
//     clientEmail: 'olivia@untitledui.com',
//     type: 'Vehicle damage',
//     incidentDate: 'Jan 13, 2025',
//     assignedTo: 'John Smith',
//     status: 'Processing',
//     priority: 'High',
//     avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face'
//   },
//   {
//     id: '2',
//     claimNumber: 'ACC-2024-002',
//     clientName: 'Phoenix Baker',
//     clientEmail: 'phoenix@untitledui.com',
//     type: 'Theft',
//     incidentDate: 'Jan 13, 2025',
//     assignedTo: 'John Smith',
//     status: 'Processing',
//     priority: 'High',
//     avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face'
//   },
//   {
//     id: '3',
//     claimNumber: 'ACC-2024-003',
//     clientName: 'Lana Steiner',
//     clientEmail: 'lana@untitledui.com',
//     type: 'Vehicle damage',
//     incidentDate: 'Jan 13, 2025',
//     assignedTo: 'John Smith',
//     status: 'Closed',
//     priority: 'Medium',
//     avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face'
//   },
//   {
//     id: '4',
//     claimNumber: 'ACC-2024-004',
//     clientName: 'Demi Wilkinson',
//     clientEmail: 'demi@untitledui.com',
//     type: 'Vehicle damage',
//     incidentDate: 'Jan 13, 2025',
//     assignedTo: 'John Smith',
//     status: 'Approved',
//     priority: 'Low',
//     avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face'
//   },
//   {
//     id: '5',
//     claimNumber: 'ACC-2024-005',
//     clientName: 'Candice Wu',
//     clientEmail: 'candice@untitledui.com',
//     type: 'Vehicle damage',
//     incidentDate: 'Jan 12, 2025',
//     assignedTo: 'John Smith',
//     status: 'Processing',
//     priority: 'High',
//     avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=32&h=32&fit=crop&crop=face'
//   },
//   {
//     id: '6',
//     claimNumber: 'ACC-2024-006',
//     clientName: 'Natali Craig',
//     clientEmail: 'natali@untitledui.com',
//     type: 'Vehicle damage',
//     incidentDate: 'Jan 12, 2025',
//     assignedTo: 'John Smith',
//     status: 'Processing',
//     priority: 'Medium',
//     avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=32&h=32&fit=crop&crop=face'
//   }
// ];

// function Dashboard() {
//   const [selectedClaims, setSelectedClaims] = useState<Claim[]>([]);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [activeFilters, setActiveFilters] = useState<string[]>(['All time', 'US, AU, +4']);
//   const [statusFilter, setStatusFilter] = useState<string>('');
//   const [priorityFilter, setPriorityFilter] = useState<string>('');
//   const [typeFilter, setTypeFilter] = useState<string>('');
//   const [showFilterDropdown, setShowFilterDropdown] = useState(false);
//   const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

//   const navigate = useNavigate();
//   const selectAllCheckboxRef = useRef<HTMLInputElement>(null); 

//   useEffect(() => {
//     const handleResize = () => {
//       setIsMobile(window.innerWidth < 768);
//     };
//     window.addEventListener('resize', handleResize);
//     return () => window.removeEventListener('resize', handleResize);
//   }, []);

//   const filteredClaims = mockClaims.filter(claim => {
//     const matchesSearch = searchQuery === '' || 
//       claim.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       claim.clientEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       claim.claimNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       claim.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       claim.assignedTo.toLowerCase().includes(searchQuery.toLowerCase());
    
//     const matchesStatus = !statusFilter || claim.status === statusFilter;
//     const matchesPriority = !priorityFilter || claim.priority === priorityFilter;
//     const matchesType = !typeFilter || claim.type === typeFilter;
      
//     return matchesSearch && matchesStatus && matchesPriority && matchesType;
//   });

//   useEffect(() => {
//     if (selectAllCheckboxRef.current) {
//       selectAllCheckboxRef.current.indeterminate = 
//         selectedClaims.length > 0 && selectedClaims.length < filteredClaims.length;
//     }
//   }, [selectedClaims, filteredClaims]);
  
//   const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.checked) {
//       setSelectedClaims([...filteredClaims]);
//     } else {
//       setSelectedClaims([]);
//     }
//   };
    
//   const handleSelectClaim = (claim: Claim) => {
//     setSelectedClaims(prev => {
//       if (prev.some(c => c.id === claim.id)) {
//         return prev.filter(c => c.id !== claim.id);
//       } else {
//         return [...prev, claim];
//       }
//     });
//   };

//   const filterOptions = {
//     status: ['Processing', 'Closed', 'Approved'],
//     priority: ['High', 'Medium', 'Low'],
//     type: ['Vehicle damage', 'Theft', 'Property damage', 'Personal injury']
//   };

//   const removeActiveFilter = (filter: string) => {
//     setActiveFilters(prev => prev.filter(f => f !== filter));
    
//     // Clear the corresponding filter if it matches
//     if (filter.includes('Status:')) {
//       setStatusFilter('');
//     } else if (filter.includes('Priority:')) {
//       setPriorityFilter('');
//     } else if (filter.includes('Type:')) {
//       setTypeFilter('');
//     }
//   };

//   const addFilter = (type: string, value: string) => {
//     const filterLabel = `${type}: ${value}`;
//     if (!activeFilters.includes(filterLabel)) {
//       setActiveFilters(prev => [...prev, filterLabel]);
//     }
    
//     switch (type) {
//       case 'Status':
//         setStatusFilter(value);
//         break;
//       case 'Priority':
//         setPriorityFilter(value);
//         break;
//       case 'Type':
//         setTypeFilter(value);
//         break;
//     }
    
//     setShowFilterDropdown(false);
//   };

//   const clearAllFilters = () => {
//     setActiveFilters(['All time', 'US, AU, +4']);
//     setStatusFilter('');
//     setPriorityFilter('');
//     setTypeFilter('');
//     setSearchQuery('');
//   };

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'Processing':
//         return 'bg-blue-100 text-blue-800';
//       case 'Closed':
//         return 'bg-gray-100 text-gray-800';
//       case 'Approved':
//         return 'bg-green-100 text-green-800';
//       default:
//         return 'bg-gray-100 text-gray-800';
//     }
//   };

//   const getStatusDotColor = (status: string) => {
//     switch (status) {
//       case 'Processing':
//         return 'bg-blue-500';
//       case 'Approved':
//         return 'bg-green-500';
//       case 'Closed':
//         return 'bg-gray-400';
//       default:
//         return 'bg-gray-500';
//     }
//   };

//   const getPriorityDotColor = (priority: string) => {
//     switch (priority) {
//       case 'High':
//         return 'bg-red-500';
//       case 'Medium':
//         return 'bg-yellow-500';
//       case 'Low':
//         return 'bg-green-500';
//       default:
//         return 'bg-gray-500';
//     }
//   };

//   const getPriorityColor = (priority: string) => {
//     switch (priority) {
//       case 'High':
//         return 'text-red-600 bg-red-100';
//       case 'Medium':
//         return 'text-yellow-600 bg-yellow-100';
//       case 'Low':
//         return 'text-green-600 bg-green-100';
//       default:
//         return 'text-gray-600 bg-gray-100'; 
//     }
//   };

//   return (
//     <div className="min-h-screen bg-white px-4 sm:px-6 lg:pl-28 lg:pr-10">
//       {/* Main Content */}
//       <main className="py-6 sm:py-10">
//         {/* Welcome Section */}
//         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
//           <div>
//             <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-1 sm:mb-2">Welcome back, Olivia</h1>
//             <p className="text-gray-600 font-normal text-sm sm:text-base">Here's what's happening with your claims</p>
//           </div>
//           <div className="flex items-center gap-2 sm:space-x-3 w-full sm:w-auto">
//             <button className="flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm sm:text-base">
//               <Import className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
//               Import
//             </button>
//             <button 
//               onClick={() => navigate('/new-claim')} 
//               className="flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-custom text-white rounded-lg hover:bg-[#252B37] text-sm sm:text-base"
//             >
//               <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
//               Add New Claim
//             </button>
//           </div>
//         </div>

//         {/* Stats Cards */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
//           {[
//             { title: 'Total claims', value: '247', change: '↑ 40%', trend: 'up' },
//             { title: 'Open cases', value: '34', change: '↑ 3%', trend: 'up' },
//             { title: 'Pending tasks', value: '18', change: '↓ 8%', trend: 'down' },
//             { title: 'Urgent claims', value: '7', change: '↑ 20%', trend: 'up' }
//           ].map((stat, index) => (
//             <div key={index} className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200">
//               <div className="flex items-center justify-between">
//                 <h3 className="text-sm sm:text-base font-semibold text-gray-900">{stat.title}</h3>
//                 <MoreVertical className="h-5 w-5 text-gray-400"/>
//               </div>
//               <div className="text-2xl sm:text-[36px] font-semibold text-gray-900 leading-tight sm:leading-[44px] mb-1 sm:mb-2">
//                 {stat.value}
//               </div>
//               <div className="flex items-center text-xs sm:text-sm">
//                 <span className={`font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
//                   {stat.change}
//                 </span>
//                 <span className="ml-1 text-gray-500 font-medium">
//                   vs last month
//                 </span>
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* Filters and Search */}
//         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-10 gap-4">
//           <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
//             {activeFilters.map((filter) => (
//               <div key={filter} className="flex items-center bg-white border border-gray-500/50 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2">
//                 <span className="text-xs sm:text-sm font-medium text-gray-700">{filter}</span>
//                 <button 
//                   onClick={() => removeActiveFilter(filter)}
//                   className="ml-1.5 sm:ml-2 text-gray-700 hover:text-gray-600"
//                 >
//                   <X className="h-3 w-3 sm:h-4 sm:w-4 text-custom" />
//                 </button>
//               </div>
//             ))}
            
//             {/* Filter Dropdown */}
//             <div className="relative">
//               <button 
//                 onClick={() => setShowFilterDropdown(!showFilterDropdown)}
//                 className="flex items-center text-xs sm:text-sm px-2.5 py-1.5 sm:px-3 sm:py-2 bg-white border border-gray-500/50 rounded-lg font-medium text-gray-700 hover:text-gray-900"
//               >
//                 <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
//                 More filters
//               </button>
              
//               {showFilterDropdown && (
//                 <div className="absolute top-full left-0 mt-1 sm:mt-2 w-48 sm:w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
//                   <div className="p-3 sm:p-4">
//                     <div className="flex items-center justify-between mb-2 sm:mb-3">
//                       <h3 className="text-xs sm:text-sm font-semibold text-gray-900">Filters</h3>
//                       <button 
//                         onClick={clearAllFilters}
//                         className="text-xs text-custom hover:text-purple-800"
//                       >
//                         Clear all
//                       </button>
//                     </div>
                    
//                     {/* Status Filter */}
//                     <div className="mb-3 sm:mb-4">
//                       <label className="block text-xs font-medium text-gray-700 mb-1 sm:mb-2">Status</label>
//                       <div className="space-y-1">
//                         {filterOptions.status.map((status) => (
//                           <button
//                             key={status}
//                             onClick={() => addFilter('Status', status)}
//                             className="block w-full text-left px-2 py-1 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 rounded"
//                           >
//                             {status}
//                           </button>
//                         ))}
//                       </div>
//                     </div>
                    
//                     {/* Priority Filter */}
//                     <div className="mb-3 sm:mb-4">
//                       <label className="block text-xs font-medium text-gray-700 mb-1 sm:mb-2">Priority</label>
//                       <div className="space-y-1">
//                         {filterOptions.priority.map((priority) => (
//                           <button
//                             key={priority}
//                             onClick={() => addFilter('Priority', priority)}
//                             className="block w-full text-left px-2 py-1 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 rounded"
//                           >
//                             {priority}
//                           </button>
//                         ))}
//                       </div>
//                     </div>
                    
//                     {/* Type Filter */}
//                     <div>
//                       <label className="block text-xs font-medium text-gray-700 mb-1 sm:mb-2">Type</label>
//                       <div className="space-y-1">
//                         {filterOptions.type.map((type) => (
//                           <button
//                             key={type}
//                             onClick={() => addFilter('Type', type)}
//                             className="block w-full text-left px-2 py-1 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 rounded"
//                           >
//                             {type}
//                           </button>
//                         ))}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>

//           <div className="relative w-full sm:w-auto">
//             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
//             <input
//               type="text"
//               placeholder="Search"
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               className="w-full sm:w-64 md:w-80 h-10 sm:h-11 pl-9 pr-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-custom focus:border-custom-800"
//             />
//           </div>
//         </div>

//         {/* Claims Table */}
//         <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
//           {/* Table Header */}
//           <div className="px-4 sm:px-6 py-3 border-b border-gray-200">
//             <div className="flex items-center justify-between">
//               <h2 className="text-base sm:text-lg font-semibold text-gray-900">Recent claims</h2>
//               <MoreHorizontal className="h-5 w-5 text-gray-400" />
//             </div>
//           </div>

//           {/* Table */}
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead className="bg-zinc-50 border-b border-gray-200">
//                 <tr>
//                   <th className="px-4 sm:px-6 py-3 text-left">
//                     <label className="inline-flex items-center">
//                       <input
//                         type="checkbox"
//                         ref={selectAllCheckboxRef}
//                         checked={selectedClaims.length === filteredClaims.length && filteredClaims.length > 0}
//                         onChange={handleSelectAll}
//                         className="hidden"
//                       />
//                       <span className={`w-4 h-4 sm:w-5 sm:h-5 border rounded flex items-center justify-center 
//                         ${selectedClaims.length === filteredClaims.length && filteredClaims.length > 0 
//                           ? 'bg-purple-500/30 border-custom' 
//                           : selectedClaims.length > 0
//                           ? 'bg-purple-500/30 border-custom'
//                           : 'border-gray-300'}`}>
//                         {selectedClaims.length === filteredClaims.length && filteredClaims.length > 0 ? (
//                           <svg className="w-2.5 h-2.5 text-custom" viewBox="0 0 20 20" fill="currentColor">
//                             <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
//                           </svg>
//                         ) : selectedClaims.length > 0 ? (
//                           <svg className="w-2.5 h-2.5 text-custom" viewBox="0 0 20 20" fill="currentColor">
//                             <path fillRule="evenodd" d="M4 10a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z" clipRule="evenodd" />
//                           </svg>
//                         ) : null}
//                       </span>
//                     </label>
//                   </th>
//                   <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-600 whitespace-nowrap">
//                     Client↓
//                   </th>
//                   <th className="px-2 sm:px-4 py-3 text-xs font-medium text-gray-600 whitespace-nowrap">
//                     Claim number
//                   </th>
//                   <th className="px-2 sm:px-4 py-3 text-xs font-medium text-gray-600 whitespace-nowrap">
//                     Type
//                   </th>
//                   <th className="px-2 sm:px-4 py-3 text-xs font-medium text-gray-600 whitespace-nowrap">
//                     Incident date↓
//                   </th>
//                   {!isMobile && (
//                     <>
//                       <th className="px-2 sm:px-4 py-3 text-center text-xs font-medium text-gray-600 whitespace-nowrap">
//                         Assigned to
//                       </th>
//                       <th className="px-2 sm:px-4 py-3 text-center text-xs font-medium text-gray-600 whitespace-nowrap">
//                         Status
//                       </th>
//                       <th className="px-2 sm:px-4 py-3 text-center text-xs font-medium text-gray-600 whitespace-nowrap">
//                         Priority
//                       </th>
//                     </>
//                   )}
//                   <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-600 whitespace-nowrap">
//                     {isMobile ? 'Actions' : ''}
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {filteredClaims.length > 0 ? (
//                   filteredClaims.map((claim) => (
//                     <tr key={claim.id} className="hover:bg-gray-50">
//                       <td className="px-4 sm:px-6 py-4">
//                         <label className="inline-flex items-center">
//                           <input
//                             type="checkbox"
//                             checked={selectedClaims.some(c => c.id === claim.id)}
//                             onChange={() => handleSelectClaim(claim)}
//                             className="hidden"
//                           />
//                           <span className={`w-4 h-4 sm:w-5 sm:h-5 border rounded flex items-center justify-center 
//                             ${selectedClaims.some(c => c.id === claim.id)
//                               ? 'bg-purple-500/30 border-custom' 
//                               : 'border-gray-300'}`}>
//                             {selectedClaims.some(c => c.id === claim.id) && (
//                               <svg className="w-2.5 h-2.5 text-custom" viewBox="0 0 20 20" fill="currentColor">
//                                 <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
//                               </svg>
//                             )}
//                           </span>
//                         </label>
//                       </td>
//                       <td className="px-2 sm:px-4 py-4">
//                         <div className="flex items-start">
//                           <img 
//                             src={claim.avatar} 
//                             alt={claim.clientName}
//                             className="w-8 h-8 rounded-full mr-2 sm:mr-3"
//                           />
//                           <div>
//                             <div className="text-sm font-medium text-gray-900">{claim.clientName}</div>
//                             {!isMobile && (
//                               <div className="text-xs sm:text-sm text-gray-500">{claim.clientEmail}</div>
//                             )}
//                           </div>
//                         </div>
//                       </td>
//                       <td className="px-2 sm:px-4 py-4 text-xs sm:text-sm font-medium text-black whitespace-nowrap">
//                         {claim.claimNumber}
//                       </td>
//                       <td className="px-2 sm:px-4 py-4 text-xs sm:text-sm text-gray-600 whitespace-nowrap">
//                         {claim.type}
//                       </td>
//                       <td className="px-2 sm:px-4 py-4 text-xs sm:text-sm text-gray-600 whitespace-nowrap">
//                         {claim.incidentDate}
//                       </td>
//                       {!isMobile && (
//                         <>
//                           <td className="px-2 sm:px-4 py-4 text-xs sm:text-sm text-gray-600 text-center whitespace-nowrap">
//                             {claim.assignedTo}
//                           </td>
//                           <td className="px-2 sm:px-4 py-4 text-center">  
//                             <span className={`inline-flex px-1.5 py-1 text-xs font-medium rounded-full ${getStatusColor(claim.status)}`}>
//                               {!isMobile && (
//                                 <span className={`w-1.5 h-1.5 rounded-full mt-1 mr-1 sm:mr-2 ${getStatusDotColor(claim.status)}`}></span>
//                               )}
//                               {claim.status}
//                             </span>
//                           </td>
//                           <td className="px-2 sm:px-4 py-4 text-center">
//                             <span className={`inline-flex px-1.5 py-1 text-xs font-medium rounded-full ${getPriorityColor(claim.priority)}`}>
//                               {!isMobile && (
//                                 <span className={`w-1.5 h-1.5 rounded-full mt-1 mr-1 sm:mr-2 ${getPriorityDotColor(claim.priority)}`}></span>
//                               )}
//                               {claim.priority}
//                             </span>
//                           </td>
//                         </>
//                       )}
//                       <td className="px-2 sm:px-4 py-4">
//                         <button className="text-gray-400 hover:text-gray-600">
//                           <MoreVertical className="h-4 w-4" />
//                         </button>
//                       </td>
//                     </tr>
//                   ))
//                 ) : (
//                   <tr>
//                     <td colSpan={isMobile ? 6 : 9} className="px-4 sm:px-6 py-12 text-center">
//                       <div className="text-gray-500">
//                         <Search className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
//                         <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">No claims found</h3>
//                         <p className="text-xs sm:text-sm">Try adjusting your search or filter criteria</p>
//                       </div>
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>

//           {/* Pagination */}
//           <div className="px-4 sm:px-6 border-t border-gray-200">
//             <div className="flex justify-end p-3 sm:p-4">
//               <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden">
//                 <button className="flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-100">
//                   <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
//                   {!isMobile && 'Previous'}
//                 </button>

//                 <button className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-gray-900 border-l border-gray-200 bg-gray-100">
//                   1
//                 </button>
//                 <button className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 border-l border-gray-200">
//                   2
//                 </button>
//                 <button className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 border-l border-gray-200">
//                   3
//                 </button>
//                 <span className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-400 border-l border-gray-200">...</span>
//                 <button className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 border-l border-gray-200">
//                   8
//                 </button>
//                 <button className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 border-l border-gray-200">
//                   9
//                 </button>
//                 <button className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 border-l border-gray-200">
//                   10
//                 </button>

//                 <button className="flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-100 border-l border-gray-200">
//                   {!isMobile && 'Next'}
//                   <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// }

// export default Dashboard;
import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Briefcase, 
  Calendar, 
  CheckSquare, 
  BarChart3, 
  Settings, 
  HelpCircle, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Plus,
  MoreVertical
} from 'lucide-react';
import Logo from "../../assets/images/Group 2608219.svg";
const Dashboard: React.FC = () => {
  const sidebarItems = [
    { name: "Dashboard", icon: LayoutDashboard, active: false },
    { name: "Claims", icon: FileText, active: true },
    { name: "Cases", icon: Briefcase, active: false },
    { name: "Calendar", icon: Calendar, active: false },
    { name: "Tasks", icon: CheckSquare, active: false },
    { name: "Reports", icon: BarChart3, active: false },
  ];

  const claimsData = Array(6).fill({
    client: "Olivia Rhye",
    email: "olivia@gmail.com",
    claimNo: "ACC-2024-001",
    type: "Vehicle damage",
    date: "Jan 13, 2025",
    assigned: "John Smith",
    status: "PENDING",
    priority: "HIGH",
  });

  return (
    <div className="flex min-h-screen bg-white font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-gray-100 flex flex-col shadow-lg z-10 shrink-0">
        <div className="p-6 mb-4">
          <div className="w-8 h-8 bg-blue-600 rounded-md">
            <img src={Logo} alt="" className='p-1' />
            </div>
          {/* Logo Placeholder */}
        </div>

        <nav className="flex-1">
          {sidebarItems.map((item) => (
            <div
              key={item.name}
              className={`flex items-center gap-3 px-8 py-3 cursor-pointer transition-colors ${
                item.active
                  ? "bg-blue-50 border-l-4 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <item.icon size={18} />
              <span className="text-sm font-medium">{item.name}</span>
            </div>
          ))}

          <div className="mt-8 px-8 mb-2">
            <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">
              Platform
            </span>
          </div>

          <div className="flex items-center gap-3 px-8 py-3 text-gray-600 hover:bg-gray-50 cursor-pointer">
            <Settings size={18} />
            <span className="text-sm font-medium">Settings</span>
          </div>
          <div className="flex items-center gap-3 px-8 py-3 text-gray-600 hover:bg-gray-50 cursor-pointer">
            <HelpCircle size={18} />
            <span className="text-sm font-medium">Help</span>
          </div>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER SECTION */}
        <header className="p-10 pb-4">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">Claims</h1>

          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              {/* SEARCH */}
              <div className="relative w-64">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search Claims"
                  className="w-full pl-11 pr-4 py-3 bg-gray-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                />
              </div>

              {/* FILTERS */}
              <button className="flex items-center gap-2 px-4 py-3 border border-blue-200 rounded-lg text-blue-600 text-sm font-semibold hover:bg-blue-50 transition-colors">
                <Filter size={16} />
                Filter
              </button>
              <button className="flex items-center gap-2 px-4 py-3 border border-blue-200 rounded-lg text-blue-600 text-sm font-semibold hover:bg-blue-50 transition-colors">
                <ArrowUpDown size={16} />
                Sort
              </button>
            </div>

            {/* ACTION BUTTON */}
            <button className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-all shadow-md active:scale-95">
              <Plus size={18} />
              Add New Claim
            </button>
          </div>
        </header>

        {/* TABLE SECTION */}
        <section className="px-10 flex-1 overflow-auto pb-10">
          <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="p-4 w-10">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Claim No.
                  </th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Incident Date
                  </th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">
                    Status
                  </th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">
                    Priority
                  </th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {claimsData.map((claim, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">
                          {claim.client}
                        </span>
                        <span className="text-xs text-gray-500">
                          {claim.email}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-gray-600">
                      {claim.claimNo}
                    </td>
                    <td className="p-4 text-xs text-gray-600">{claim.type}</td>
                    <td className="p-4 text-xs text-gray-600">{claim.date}</td>
                    <td className="p-4 text-xs text-gray-600">
                      {claim.assigned}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center">
                        <span className="px-2 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded">
                          PENDING
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center">
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded">
                          HIGH
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
