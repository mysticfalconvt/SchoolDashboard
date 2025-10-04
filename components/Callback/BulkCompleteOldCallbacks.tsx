import React, { useState, useEffect, useMemo } from 'react';
import gql from 'graphql-tag';
import toast from 'react-hot-toast';
import { useUser } from '../User';
import { useGQLQuery } from '../../lib/useGqlQuery';
import { useGqlMutation } from '../../lib/useGqlMutation';
import GradientButton from '../styles/Button';

const GET_OLD_CALLBACKS = gql`
  query GET_OLD_CALLBACKS($cutoffDate: DateTime!) {
    callbacks(
      where: {
        dateAssigned: { lt: $cutoffDate }
        dateCompleted: null
      }
    ) {
      id
      title
      dateAssigned
      teacher {
        id
        name
      }
      student {
        id
        name
      }
    }
  }
`;

const UPDATE_CALLBACK_COMPLETED = gql`
  mutation UPDATE_CALLBACK_COMPLETED(
    $id: ID!
    $dateCompleted: DateTime!
    $daysLate: Int!
  ) {
    updateCallback(
      where: { id: $id }
      data: { dateCompleted: $dateCompleted, daysLate: $daysLate }
    ) {
      id
    }
  }
`;



interface CallbackPreview {
    teacherId: string;
    teacherName: string;
    callbackCount: number;
    callbackIds: string[];
}

interface OldCallback {
    id: string;
    title: string;
    dateAssigned: string;
    teacher: {
        id: string;
        name: string;
    };
    student: {
        id: string;
        name: string;
    };
}

// Helper function to calculate cutoff date (1 month ago)
const getOneMonthAgo = (): Date => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date;
};

// Helper function to group callbacks by teacher
const groupCallbacksByTeacher = (callbacks: OldCallback[]): CallbackPreview[] => {
    const grouped = callbacks.reduce((acc, callback) => {
        const teacherId = callback.teacher.id;
        if (!acc[teacherId]) {
            acc[teacherId] = {
                teacherId,
                teacherName: callback.teacher.name,
                callbackCount: 0,
                callbackIds: []
            };
        }
        acc[teacherId].callbackCount++;
        acc[teacherId].callbackIds.push(callback.id);
        return acc;
    }, {} as Record<string, CallbackPreview>);

    return Object.values(grouped).sort((a, b) =>
        a.teacherName.localeCompare(b.teacherName)
    );
};

export default function BulkCompleteOldCallbacks() {
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [oldCallbacks, setOldCallbacks] = useState<OldCallback[]>([]);
    const [previewData, setPreviewData] = useState<CallbackPreview[]>([]);
    const [isCompleting, setIsCompleting] = useState(false);
    const [queryKey, setQueryKey] = useState(0);

    const user = useUser();

    // Memoize the cutoff date to prevent infinite re-renders
    const cutoffDate = useMemo(() => getOneMonthAgo(), []);

    // Fetch old callbacks when modal is open
    const { data, isLoading: queryLoading, error: queryError } = useGQLQuery(
        `oldCallbacks-${queryKey}`,
        GET_OLD_CALLBACKS,
        { cutoffDate: cutoffDate.toISOString() },
        {
            enabled: showModal,
            refetchOnMount: true,
            refetchOnWindowFocus: false
        }
    );

    // Mutation for completing individual callbacks
    const [updateCallbackCompleted, { loading: mutationLoading }] = useGqlMutation(
        UPDATE_CALLBACK_COMPLETED
    );

    // Process query data and handle errors
    useEffect(() => {
        if (queryError) {
            setError('Failed to fetch old callbacks. Please try again.');
            setLoading(false);
        } else if (data?.callbacks) {
            setOldCallbacks(data.callbacks);
            setLoading(false);
        } else if (queryLoading) {
            setLoading(true);
            setError(null);
        }
    }, [data, queryLoading, queryError]);

    // Update preview data when callbacks change
    useEffect(() => {
        if (oldCallbacks.length > 0) {
            const grouped = groupCallbacksByTeacher(oldCallbacks);
            setPreviewData(grouped);
        } else {
            setPreviewData([]);
        }
    }, [oldCallbacks]);

    // Check if user has permission
    if (!user?.isSuperAdmin) {
        return null;
    }

    const handleOpenModal = () => {
        setQueryKey(prev => prev + 1); // Force a fresh query
        setShowModal(true);
        setError(null);
        setOldCallbacks([]);
        setPreviewData([]);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setOldCallbacks([]);
        setPreviewData([]);
        setError(null);
    };

    const handleCancel = () => {
        handleCloseModal();
    };

    const handleConfirm = async () => {
        if (oldCallbacks.length === 0) return;

        setIsCompleting(true);
        setError(null);

        try {
            const dateCompleted = new Date();
            let completedCount = 0;
            let failedCount = 0;

            // Process callbacks one by one
            for (const callback of oldCallbacks) {
                try {
                    const dateAssigned = new Date(callback.dateAssigned);
                    const daysLate = Math.round(
                        (dateCompleted.getTime() - dateAssigned.getTime()) / (1000 * 60 * 60 * 24)
                    );

                    await updateCallbackCompleted({
                        id: callback.id,
                        dateCompleted: dateCompleted.toISOString(),
                        daysLate
                    });

                    completedCount++;
                } catch (callbackError) {
                    console.error(`Failed to complete callback ${callback.id}:`, callbackError);
                    failedCount++;
                }
            }

            if (completedCount > 0) {
                toast.success(`Successfully completed ${completedCount} callback${completedCount !== 1 ? 's' : ''}`);
            }

            if (failedCount > 0) {
                toast.error(`Failed to complete ${failedCount} callback${failedCount !== 1 ? 's' : ''}`);
            }

            handleCloseModal();
        } catch (err) {
            console.error('Error completing callbacks:', err);
            setError('Failed to complete callbacks. Please try again.');
        } finally {
            setIsCompleting(false);
        }
    };

    return (
        <div>
            <GradientButton
                style={{ marginTop: '10px' }}
                onClick={handleOpenModal}
            >
                Bulk Complete Old Callbacks
            </GradientButton>

            {showModal && (
                <>
                    {/* Backdrop overlay */}
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-40"
                        onClick={handleCloseModal}
                    />

                    {/* Modal */}
                    <div className="fixed z-50 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11/12 max-w-xl h-auto rounded-3xl bg-gradient-to-tr from-[var(--red)] to-[var(--blue)] overflow-hidden border-2 border-[var(--blue)] shadow-2xl">
                        <div className="flex justify-between items-center p-4 border-b border-[var(--blue)]">
                            <h4 className="text-white text-xl font-semibold">
                                Bulk Complete Old Callbacks
                            </h4>
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="w-8 h-8 text-white bg-[var(--redTrans)] hover:bg-[var(--blue)] rounded-full flex items-center justify-center text-lg font-bold transition-colors duration-200"
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-6 max-h-[80vh] overflow-y-auto">
                            {(loading || mutationLoading) && (
                                <div className="text-center text-white">
                                    <p>{mutationLoading ? 'Completing callbacks...' : 'Loading old callbacks...'}</p>
                                </div>
                            )}

                            {error && (
                                <div className="mb-4 p-4 bg-red-600 bg-opacity-30 border border-red-400 rounded-lg">
                                    <p className="text-white text-sm">{error}</p>
                                </div>
                            )}

                            {!loading && !mutationLoading && !error && previewData.length === 0 && (
                                <div className="text-center text-white">
                                    <p>No old callbacks found to complete.</p>
                                </div>
                            )}

                            {!loading && !mutationLoading && !error && previewData.length > 0 && (
                                <div className="space-y-4">
                                    <div className="bg-white bg-opacity-10 p-3 rounded">
                                        <h4 className="text-white font-semibold mb-2">
                                            📋 Callbacks to Complete
                                        </h4>
                                        <p className="text-white text-sm mb-3">
                                            Total callbacks: <strong>{oldCallbacks.length}</strong>
                                        </p>
                                        <div className="space-y-1 max-h-32 overflow-y-auto">
                                            {previewData.map((preview) => (
                                                <div key={preview.teacherId} className="text-white text-sm">
                                                    <strong>{preview.teacherName}</strong> - {preview.callbackCount} callback{preview.callbackCount !== 1 ? 's' : ''}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex justify-end space-x-3">
                                        <button
                                            type="button"
                                            onClick={handleCancel}
                                            disabled={isCompleting}
                                            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleConfirm}
                                            disabled={isCompleting}
                                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                                        >
                                            {isCompleting ? 'Completing...' : 'Confirm'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}