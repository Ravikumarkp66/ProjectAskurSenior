import { useState, useCallback } from 'react';
import { apiV2 } from '../../../../../services/authService';
import toast from 'react-hot-toast';

export const useOfficialResult = () => {
    const [officialResult, setOfficialResult] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [fetchError, setFetchError] = useState(null);

    const openModal = useCallback(() => {
        setFetchError(null);
        setIsModalOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        if (!isFetching) {
            setIsModalOpen(false);
            setFetchError(null);
        }
    }, [isFetching]);

    const fetchOfficialResult = useCallback(async (usn, dobDay, dobMonth, dobYear) => {
        setIsFetching(true);
        setFetchError(null);

        try {
            const res = await apiV2.fetchOfficialResult({
                usn,
                dobDay,
                dobMonth,
                dobYear
            });

            if (res.data?.success && res.data.data) {
                setOfficialResult(res.data.data);
                setIsModalOpen(false);
                toast.success('Official result fetched successfully!');
            } else {
                setFetchError(res.data?.message || 'Failed to fetch official result.');
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to fetch official result. Please try again.';
            setFetchError(message);
        } finally {
            setIsFetching(false);
        }
    }, []);

    return {
        officialResult,
        isModalOpen,
        isFetching,
        fetchError,
        openModal,
        closeModal,
        fetchOfficialResult
    };
};
