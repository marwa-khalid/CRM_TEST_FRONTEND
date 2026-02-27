// Updated PoliceModal.tsx
import { useState, useEffect } from 'react';
import AddPoliceModal from './AddPolice';
import { User2, Pencil, Trash2, Loader2 } from "lucide-react";
import { createPoliceDetail, deletePoliceDetail, getPoliceDetails, type PoliceDetail as ApiPoliceDetail } from '../../services/Accidents/Cards/cards';
import 'react-responsive-modal/styles.css';
import { Modal } from 'react-responsive-modal';
import { useParams } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { MdOutlineClose } from 'react-icons/md';

interface PoliceDetail {
    id: number;
    officerName: string;
    badgeNumber: string;
    stationName: string;
    stationAddress: string;
    incidentReportTaken: string;
    reportReceivedDate: string;
    additionalInformation: string;
}

interface PoliceModalProps {
    isOpen: boolean;
    onClose: () => void;
    accidentId: number;
    onAddPoliceDetail: (policeDetail: any) => void;
    onEditPolice?: (id: number) => void;
    onDeletePoliceDetail?: (id: number) => void;
}

const PoliceModal = ({
    isOpen,
    onClose,
    claimId,
    onAddPoliceDetail,
    onEditPolice,
    onDeletePoliceDetail
}: PoliceModalProps) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [policeDetails, setPoliceDetails] = useState<PoliceDetail[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmationOpen, setConfirmationOpen] = useState(false);
    const [selectedPoliceId, setSelectedPoliceId] = useState<number | null>(null);

    const { id } = useParams()
    const searchParams = new URLSearchParams(window.location.search);
    const claimID = searchParams.get('claimid');

    const fetchPoliceDetails = async () => {

        setLoading(true);
        setError(null);
        try {
            const apiPoliceDetails = await getPoliceDetails(id || claimID);
            setPoliceDetails(apiPoliceDetails);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch police details');
            console.error('Error fetching police details:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && (id || claimID)) {
            fetchPoliceDetails();
        }
    }, [isOpen, claimID]);

    const handleAddNewPoliceDetail = () => {
        setIsAddModalOpen(true);
    };

    const formatIncidentReport = (incidentReportTaken: string) => {
        return incidentReportTaken === 'true' ? 'Yes' : 'No';
    };

    const handleDeletePolice = async (id: number) => {
        try {
            await deletePoliceDetail(id)
            await fetchPoliceDetails()
            toast.success('Police detail deleted successfully')
        } catch (e) { }
    }

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg w-full max-w-xl mx-4 shadow-xl">
                    <div className="p-6">
                        <div className='flex justify-end'>
                            <MdOutlineClose onClick={() => {
                                onClose()
                            }} className='text-20 cursor-pointer' />
                        </div>
                        {/* Top Icon */}
                        <div className="flex justify-center">
                            <div className='rounded-full border-8 border-gray-300/10'>
                                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#414651]/10 text-custom">
                                    <User2 className="w-6 h-6" />
                                </div>
                            </div>
                        </div>

                        <h2 className="text-xl font-semibold mb-2 text-center text-gray-800">Police Details</h2>
                        <p className="text-sm text-gray-600 mb-6 text-center">
                            The list of the police officers who attended is below
                        </p>

                        {loading && (
                            <div className="flex justify-center items-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-custom" />
                                <span className="ml-2 text-gray-600">Loading police details...</span>
                            </div>
                        )}

                        {error && (
                            <div className="text-center py-4 text-red-600 bg-red-50 rounded-lg mb-4">
                                {error}
                                <button
                                    onClick={fetchPoliceDetails}
                                    className="ml-2 text-custom hover:underline"
                                >
                                    Try again
                                </button>
                            </div>
                        )}

                        {!loading && !error && (
                            <div className="space-y-4 max-h-84 mb-2 overflow-y-auto">
                                {policeDetails.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        No police details added yet
                                    </div>
                                ) : (
                                    policeDetails.map((detail) => {
                                        return (
                                            <div
                                                key={detail.id}
                                                className="border-b border-gray-200 flex justify-between items-start hover:bg-gray-50 transition-colors p-2"
                                            >
                                                <div className="flex-1 mb-1">
                                                    <h4 className="font-semibold text-gray-800">{detail.name}</h4>
                                                    <p className="text-sm text-gray-600">Address: {detail.station_address}</p>
                                                    <p className="text-sm text-gray-600">Referrence: {detail.reference_no}</p>
                                                    <p className="text-sm text-gray-600">
                                                        Report Taken: {formatIncidentReport(detail.incidentReportTaken)}
                                                    </p>
                                                    {detail.reportReceivedDate && (
                                                        <p className="text-sm text-gray-600">
                                                            Report Date: {detail.reportReceivedDate}
                                                        </p>
                                                    )}
                                                    {detail.additionalInformation && (
                                                        <p className="text-sm text-gray-600 mt-1">{detail.additionalInformation}</p>
                                                    )}
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex space-x-2 ml-4">
                                                    <button
                                                        onClick={() => onEditPolice?.(detail.id)}
                                                        className="p-2 text-gray-600 hover:text-blue-600"
                                                        title="Edit"
                                                    >
                                                        <Pencil className="w-4 h-4 text-custom" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedPoliceId(detail.id);
                                                            setConfirmationOpen(true);
                                                        }}
                                                        className="p-2 text-gray-600 hover:text-red-600"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        )

                                    })
                                )}
                            </div>
                        )}

                        <div className="flex justify-center w-full space-x-3 pt-4">
                            <button
                                onClick={onClose}
                                className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium w-full h-12"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddNewPoliceDetail}
                                className="px-5 py-2.5 bg-custom text-white rounded-lg hover:bg-[#252B37] transition-colors font-medium w-full h-12 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading || isSubmitting || !(claimID || id)}
                            >
                                {loading ? 'Loading...' : isSubmitting ? 'Adding...' : 'Add Police Detail'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <AddPoliceModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onConfirm={() => fetchPoliceDetails()}
                claimId={claimID || id}
                editingPoliceId={''}
            />
            <Modal
                open={confirmationOpen}
                onClose={() => setConfirmationOpen(false)}
                center
                closeIcon={<FaTimes size={18} className="text-gray-500 hover:text-gray-700" />}
            >
                <div className="p-4">
                    <h2 className="text-lg font-semibold text-gray-800 mb-3">
                        Are you sure?
                    </h2>
                    <p className="text-sm text-gray-600 mb-6">
                        Do you really want to delete this police entry?
                    </p>
                    <div className="flex justify-end space-x-3">
                        <button
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                            onClick={() => {
                                if (selectedPoliceId !== null) {
                                    handleDeletePolice(selectedPoliceId);
                                    setConfirmationOpen(false);
                                    setSelectedPoliceId(null);
                                }
                            }}
                        >
                            Yes, Delete
                        </button>
                        <button
                            className="px-4 py-2 bg-white text-gray-800 border rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
                            onClick={() => setConfirmationOpen(false)}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default PoliceModal;