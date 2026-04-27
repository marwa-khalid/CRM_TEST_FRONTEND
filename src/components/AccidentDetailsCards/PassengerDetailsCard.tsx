import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import AddPassengerModal from './AddPassenger.tsx';
import { User2, Pencil, Trash2, Loader2 } from "lucide-react";
import { getPassengerById, deletePassenger } from '../../services/Accidents/Cards/cards.tsx';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-responsive-modal/styles.css';
import { Modal } from 'react-responsive-modal';
import { FaTimes } from 'react-icons/fa';
import { MdOutlineClose } from 'react-icons/md';

interface Address {
    address: string;
    postcode: string;
    mobile_tel: string;
    email: string;
    id: number;
}

interface Passenger {
    id: number;
    claim_id: number;
    tenant_id: number;
    gender: string;
    first_name: string;
    surname: string;
    address: Address;
}

interface PassengersModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddPassenger: (passenger: any) => void;
    refreshKey?: number;
    onEditPassenger?: (id: number) => void;
    onDeletePassenger?: (id: number) => void;
    claimId?: number; // Add claimId as a prop
}

const PassengersModal = ({
    isOpen,
    onClose,
    onAddPassenger,
    refreshKey = 0,
    onEditPassenger,
    onDeletePassenger,
    claimId: propClaimId
}: PassengersModalProps) => {
    const { id } = useParams()
    const reduxClaimId = useSelector((state: any) => state.claim?.claimId || state.isClosed?.claimId);
    const claimId = propClaimId || reduxClaimId || id;

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [passengers, setPassengers] = useState<Passenger[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [confirmationOpen, setConfirmationOpen] = useState(false);
    const [selectedPassengerId, setSelectedPassengerId] = useState<number | null>(null);

    const fetchPassengers = useCallback(async (forceId?: number) => {
        const cid = Number.isFinite(forceId as number)
            ? (forceId as number)
            : Number(claimId);

        if (!Number.isFinite(cid) || cid <= 0) {
            setError('No valid claim ID found');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await getPassengerById(cid);

            let passengersData: Passenger[] = [];
            if (Array.isArray(response)) {
                passengersData = response;
            } else if (response?.passengers && Array.isArray(response.passengers)) {
                passengersData = response.passengers;
            } else if (response?.data && Array.isArray(response.data)) {
                passengersData = response.data;
            } else if (response?.detail) {
                passengersData = [];
            } else {
                passengersData = [];
            }

            setPassengers(passengersData);
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || 'Failed to fetch passengers');
        } finally {
            setLoading(false);
        }
    }, [claimId]);


    const handleDeletePassenger = async (passengerId: number) => {
        setDeletingId(passengerId);
        try {
            await deletePassenger(passengerId);
            setPassengers(prev => prev.filter(p => p.id !== passengerId));

            if (onDeletePassenger) {
                onDeletePassenger(passengerId);
            }
            toast.success('Passenger detail deleted successfully')
        } catch (err: any) {
            toast.error('Unable to delete passenger')
            console.error('Error deleting passenger:', err);

            setError(err.response?.data?.message || err.message || 'Failed to delete passenger');
        } finally {
            setDeletingId(null);
            fetchPassengers()
        }
    };

    useEffect(() => {
        if (!isOpen) {
            setPassengers([]);
            setError(null);
            return;
        }

        const cid = Number(claimId);
        if (!Number.isFinite(cid) || cid <= 0) {
            setError('No valid claim ID found');
            return;
        }

        fetchPassengers(cid);
    }, [isOpen, claimId, refreshKey, fetchPassengers]);


    const handleAddNewPassenger = () => {
        if (!claimId) {
            setError('Cannot add passenger - no claim ID available');
            return;
        }
        setIsAddModalOpen(true);
    };

    const handleConfirmAddPassenger = (passengerData: any) => {
        setPassengers(prev => [...prev, passengerData]);
        setIsAddModalOpen(false);
    };

    const formatPassengerName = (passenger: Passenger) => {
        const titleMap: { [key: string]: string } = {
            mr: 'Mr.',
            mrs: 'Mrs.',
            ms: 'Ms.',
            miss: 'Miss',
            dr: 'Dr.',
            male: 'Mr.',
            female: 'Ms.'
        };

        const title = titleMap[passenger.gender?.toLowerCase()] || '';
        return `${title} ${passenger.first_name} ${passenger.surname}`.trim();
    };

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
                        <div className="flex justify-center">
                            <div className='rounded-full border-8 border-gray-300/10'>
                                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#414651]/10 text-custom">
                                    <User2 className="w-6 h-6" />
                                </div>
                            </div>
                        </div>

                        <h2 className="text-xl font-weight-600 mb-2 text-center text-gray-800">Passengers Details</h2>
                        <p className="text-sm text-gray-600 mb-6 text-center">
                            The list of the added passengers is below
                        </p>


                        {loading && (
                            <div className="flex justify-center items-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-custom" />
                                <span className="ml-2 text-gray-600">Loading passengers...</span>
                            </div>
                        )}



                        {!loading && !error && (
                            <div className="space-y-4 max-h-84 mb-2 overflow-y-auto">
                                {passengers.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        No passengers found for this claim
                                    </div>
                                ) : (
                                    passengers.map((passenger) => (
                                        <div
                                            key={passenger.id}
                                            className="border-b border-gray-200 flex justify-between items-start hover:bg-gray-50 transition-colors p-2"
                                        >
                                            <div className="flex-1 mb-1">
                                                <h4 className="font-weight-600 text-gray-800">
                                                    {formatPassengerName(passenger)}
                                                </h4>
                                                <p className="text-sm text-gray-600">
                                                    {passenger.address?.address}
                                                    {passenger.address?.postcode && `, ${passenger.address.postcode}`}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {passenger.address?.mobile_tel} • {passenger.address?.email}
                                                </p>
                                            </div>

                                            <div className="flex space-x-2 ml-4">
                                                <button
                                                    onClick={() => onEditPassenger?.(passenger.id)}
                                                    className="p-2 text-gray-600 hover:text-blue-600"
                                                    title="Edit"
                                                    disabled={deletingId === passenger.id}
                                                >
                                                    <Pencil className="w-4 h-4 text-custom" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedPassengerId(passenger.id);
                                                        setConfirmationOpen(true);
                                                    }}
                                                    className="p-2 text-gray-600 hover:text-red-600"
                                                    title="Delete"
                                                    disabled={deletingId === passenger.id}
                                                >
                                                    {deletingId === passenger.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    ))
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
                                onClick={handleAddNewPassenger}
                                className="px-5 py-2.5 bg-custom text-white rounded-lg hover:bg-[#252B37] transition-colors font-medium w-full h-12 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading || !claimId}
                            >
                                Add New Passenger
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <AddPassengerModal
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false)
                    fetchPassengers()
                }}
                onConfirm={handleConfirmAddPassenger}
                claimId={claimId}
            />

            <Modal
                open={confirmationOpen}
                onClose={() => setConfirmationOpen(false)}
                center
                closeIcon={<FaTimes size={18} className="text-gray-500 hover:text-gray-700" />}
            >
                <div className="p-4">
                    <h2 className="text-lg font-weight-600 text-gray-800 mb-3">
                        Are you sure?
                    </h2>
                    <p className="text-sm text-gray-600 mb-6">
                        Do you really want to delete this passenger?
                    </p>
                    <div className="flex justify-end space-x-3">
                        <button
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                            onClick={() => {
                                if (selectedPassengerId !== null) {
                                    handleDeletePassenger(selectedPassengerId);
                                    setConfirmationOpen(false);
                                    setSelectedPassengerId(null);
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

export default PassengersModal;