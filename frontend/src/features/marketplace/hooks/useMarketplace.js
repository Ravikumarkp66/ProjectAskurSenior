/* ═══════════════════════════════════════════════════════════════════
   useMarketplace HOOK
   State management & mock API abstraction layer for Marketplace
═══════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuthContext } from '../../../context/AuthContext';
import { INITIAL_MARKETPLACE_LISTINGS } from '../mock/marketplaceMockData';
import { filterMarketplaceItems } from '../utils/marketplace.utils';
import { LISTING_STATUS } from '../constants/marketplace.constants';

const STORAGE_KEY = 'askursenior_marketplace_listings';

export const useMarketplace = (initialCategory = 'all') => {
    const { user: authUser } = useAuthContext();

    // ── Persistent state for marketplace listings ──────────────────
    const [listings, setListings] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (!saved) return INITIAL_MARKETPLACE_LISTINGS;
            const parsed = JSON.parse(saved);
            const cleanListings = Array.isArray(parsed) ? parsed.filter(i => !i.id?.startsWith('listing-0')) : [];
            return cleanListings;
        } catch (e) {
            console.error('Error reading marketplace state from localStorage:', e);
            return INITIAL_MARKETPLACE_LISTINGS;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(listings));
        } catch (e) {
            console.error('Error saving marketplace state:', e);
        }
    }, [listings]);

    // ── Active Filters & Navigation ───────────────────────────────
    const [activeCategory, setActiveCategory] = useState(initialCategory);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedConditions, setSelectedConditions] = useState([]); // e.g. ['NEW', 'GOOD']
    const [minPrice, setMinPrice] = useState(0);
    const [maxPrice, setMaxPrice] = useState(25000);
    const [sortOption, setSortOption] = useState('newest');

    // Tab view: 'all' vs 'my_listings'
    const [myListingsOnly, setMyListingsOnly] = useState(false);

    // ── Modals & Drawers state ────────────────────────────────────
    const [selectedItemId, setSelectedItemId] = useState(null);
    const [isSellModalOpen, setIsSellModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isMarkSoldModalOpen, setIsMarkSoldModalOpen] = useState(false);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const [itemToConfirm, setItemToConfirm] = useState(null);

    // ── Authenticated User Object ─────────────────────────────────
    const currentUser = useMemo(() => {
        return {
            id: authUser?._id || authUser?.id || 'user-ravi',
            name: authUser?.name || authUser?.fullName || 'Ravi Kumar',
            email: authUser?.email || 'ravikumar@college.edu',
            avatar: authUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser?.name || 'Ravi'}`,
            branch: authUser?.branch || authUser?.department || 'Information Science',
            year: authUser?.year || authUser?.academicYear || '3rd Year',
            isAdmin: authUser?.isAdmin || false,
        };
    }, [authUser]);

    // ── Filtered Listings Calculation ─────────────────────────────
    const filteredListings = useMemo(() => {
        let list = listings;

        if (myListingsOnly) {
            list = list.filter(item => item.seller?.id === currentUser.id);
        }

        return filterMarketplaceItems(list, {
            category: activeCategory,
            search: searchQuery,
            conditions: selectedConditions,
            minPrice,
            maxPrice,
            sort: sortOption,
        });
    }, [listings, myListingsOnly, currentUser.id, activeCategory, searchQuery, selectedConditions, minPrice, maxPrice, sortOption]);

    // Active vs Sold counts
    const categoryCounts = useMemo(() => {
        const counts = { all: listings.filter(i => i.status === LISTING_STATUS.ACTIVE).length };
        listings.forEach(item => {
            if (item.status === LISTING_STATUS.ACTIVE) {
                counts[item.category] = (counts[item.category] || 0) + 1;
            }
        });
        return counts;
    }, [listings]);

    // Selected item detail object
    const selectedItem = useMemo(() => {
        if (!selectedItemId) return null;
        return listings.find(i => i.id === selectedItemId) || null;
    }, [listings, selectedItemId]);

    // ── Data Mutations (Mock API endpoints) ──────────────────────

    // CREATE LISTING (POST /api/marketplace)
    const addListing = useCallback((formData) => {
        const newListing = {
            id: `listing-${Date.now()}`,
            title: formData.title,
            category: formData.category,
            price: Number(formData.price),
            condition: formData.condition,
            description: formData.description,
            location: formData.location || 'SIT Campus',
            status: LISTING_STATUS.ACTIVE,
            createdAt: new Date().toISOString(),
            images: formData.images && formData.images.length > 0 ? formData.images : [],
            seller: {
                id: currentUser.id,
                name: currentUser.name,
                email: currentUser.email,
                avatar: currentUser.avatar,
                branch: currentUser.branch,
                year: currentUser.year,
            },
            messages: [],
        };

        setListings(prev => [newListing, ...prev]);
        setIsSellModalOpen(false);
        setEditingItem(null);
        toast.success('Successfully posted your marketplace listing!');
        return newListing;
    }, [currentUser]);

    // EDIT LISTING (PATCH /api/marketplace/:id)
    const updateListing = useCallback((itemId, updatedFields) => {
        setListings(prev => prev.map(item => {
            if (item.id === itemId) {
                return {
                    ...item,
                    ...updatedFields,
                    updatedAt: new Date().toISOString()
                };
            }
            return item;
        }));
        setIsSellModalOpen(false);
        setEditingItem(null);
        toast.success('Listing updated successfully!');
    }, []);

    // DELETE LISTING (DELETE /api/marketplace/:id)
    const deleteListing = useCallback((itemId) => {
        setListings(prev => prev.filter(i => i.id !== itemId));
        if (selectedItemId === itemId) {
            setSelectedItemId(null);
        }
        setIsDeleteModalOpen(false);
        setItemToConfirm(null);
        toast.success('Listing deleted.');
    }, [selectedItemId]);

    // MARK AS SOLD (PATCH /api/marketplace/:id/sold)
    const markAsSold = useCallback((itemId) => {
        setListings(prev => prev.map(item => {
            if (item.id === itemId) {
                return {
                    ...item,
                    status: LISTING_STATUS.SOLD,
                    soldAt: new Date().toISOString()
                };
            }
            return item;
        }));
        setIsMarkSoldModalOpen(false);
        setItemToConfirm(null);
        toast.success('Item marked as SOLD!');
    }, []);

    // SEND PRIVATE CHAT MESSAGE (POST /api/marketplace/:id/chat)
    const sendChatMessage = useCallback((itemId, text) => {
        if (!text || !text.trim()) return;

        const newMsg = {
            id: `msg-${Date.now()}`,
            senderId: currentUser.id,
            senderName: currentUser.name,
            text: text.trim(),
            timestamp: new Date().toISOString()
        };

        setListings(prev => prev.map(item => {
            if (item.id === itemId) {
                return {
                    ...item,
                    messages: [...(item.messages || []), newMsg]
                };
            }
            return item;
        }));
    }, [currentUser]);

    // Reset dataset to initial mock state
    const resetMockData = useCallback(() => {
        setListings(INITIAL_MARKETPLACE_LISTINGS);
        localStorage.removeItem(STORAGE_KEY);
        setSelectedItemId(null);
        toast.success('Reset marketplace data to initial mock listings');
    }, []);

    return {
        // Data & State
        listings,
        filteredListings,
        categoryCounts,
        activeCategory,
        setActiveCategory,
        searchQuery,
        setSearchQuery,
        selectedConditions,
        setSelectedConditions,
        minPrice,
        setMinPrice,
        maxPrice,
        setMaxPrice,
        sortOption,
        setSortOption,
        myListingsOnly,
        setMyListingsOnly,
        selectedItem,
        setSelectedItemId,

        // User
        currentUser,

        // Modals state
        isSellModalOpen,
        setIsSellModalOpen,
        editingItem,
        setEditingItem,
        isDeleteModalOpen,
        setIsDeleteModalOpen,
        isMarkSoldModalOpen,
        setIsMarkSoldModalOpen,
        isFilterDrawerOpen,
        setIsFilterDrawerOpen,
        itemToConfirm,
        setItemToConfirm,

        // Actions
        addListing,
        updateListing,
        deleteListing,
        markAsSold,
        sendChatMessage,
        resetMockData,
    };
};
