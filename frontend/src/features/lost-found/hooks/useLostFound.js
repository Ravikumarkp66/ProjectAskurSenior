/* ═══════════════════════════════════════════════════════════════════
   useLostFound HOOK
   State management & data flow for Lost & Found module
═══════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuthContext } from '../../../context/AuthContext';
import { INITIAL_MOCK_ITEMS } from '../mock/lostFoundMockData';
import { filterLostFoundItems } from '../utils/lostFound.utils';
import { TAB_TYPES, MOCK_USER_ROLES } from '../constants/lostFound.constants';

const STORAGE_KEY = 'askursenior_lost_found_items';

export const useLostFound = (initialTab = TAB_TYPES.LOST) => {
    const { user: authUser } = useAuthContext();

    // ── Persistent state for items (starts empty) ──────────────────
    const [items, setItems] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (!saved) return INITIAL_MOCK_ITEMS;
            const parsed = JSON.parse(saved);
            // Filter out old fake mock item IDs if present
            const cleanItems = Array.isArray(parsed) ? parsed.filter(i => !i.id?.startsWith('lf-lost-') && !i.id?.startsWith('lf-found-') && !i.id?.startsWith('lf-resolved-')) : [];
            return cleanItems;
        } catch (e) {
            console.error('Error reading lost & found state from localStorage:', e);
            return INITIAL_MOCK_ITEMS;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch (e) {
            console.error('Error saving lost & found state:', e);
        }
    }, [items]);

    // ── Active Filters & Tabs ─────────────────────────────────────
    const [activeTab, setActiveTab] = useState(initialTab);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [sortOption, setSortOption] = useState('newest');

    // ── Active Selected Item & Modals State ───────────────────────
    const [selectedItemId, setSelectedItemId] = useState(null);
    const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
    const [itemToConfirm, setItemToConfirm] = useState(null);

    // Role mode toggle (Student vs Admin)
    const [userRoleMode, setUserRoleMode] = useState(authUser?.isAdmin ? MOCK_USER_ROLES.ADMIN : MOCK_USER_ROLES.STUDENT);

    const currentUser = useMemo(() => {
        const userId = authUser?._id || authUser?.id || 'user-1';
        const userName = authUser?.name || authUser?.fullName || 'Student User';
        const userEmail = authUser?.email || '';
        const userBranch = authUser?.branch || authUser?.department || 'Engineering';
        const userYear = authUser?.year || authUser?.academicYear || 'Student';

        if (userRoleMode === MOCK_USER_ROLES.ADMIN) {
            return {
                id: userId,
                name: userName,
                email: userEmail,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`,
                branch: userBranch,
                year: userYear,
                isAdmin: true
            };
        }

        return {
            id: userId,
            name: userName,
            email: userEmail,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`,
            branch: userBranch,
            year: userYear,
            isAdmin: authUser?.isAdmin || false
        };
    }, [authUser, userRoleMode]);

    // ── Filtered Items calculation ───────────────────────────────
    const filteredItems = useMemo(() => {
        return filterLostFoundItems(items, {
            tab: activeTab,
            search: searchQuery,
            category: categoryFilter,
            sort: sortOption,
        });
    }, [items, activeTab, searchQuery, categoryFilter, sortOption]);

    // Items count per tab
    const tabCounts = useMemo(() => {
        const lostCount = items.filter(i => i.type === 'lost' && i.status !== 'resolved' && !i.isResolved).length;
        const foundCount = items.filter(i => i.type === 'found' && i.status !== 'resolved' && !i.isResolved).length;
        const resolvedCount = items.filter(i => i.status === 'resolved' || i.isResolved).length;
        return { lost: lostCount, found: foundCount, resolved: resolvedCount };
    }, [items]);

    // Selected item detail object
    const selectedItem = useMemo(() => {
        if (!selectedItemId) return null;
        return items.find(i => i.id === selectedItemId) || null;
    }, [items, selectedItemId]);

    // ── Data Mutations ──────────────────────────────────────────

    // CREATE QUERY
    const addQuery = useCallback((queryData) => {
        const newItem = {
            id: `query-${Date.now()}`,
            type: queryData.type, // 'lost' | 'found'
            status: 'active',
            isResolved: false,
            title: queryData.title,
            category: queryData.category || 'other',
            description: queryData.description,
            location: queryData.location,
            date: queryData.date || new Date().toISOString(),
            createdAt: new Date().toISOString(),
            image: queryData.image || null,
            postedBy: {
                id: currentUser.id,
                name: currentUser.name,
                email: currentUser.email,
                avatar: currentUser.avatar,
                branch: currentUser.branch,
                year: currentUser.year,
            },
            claims: [],
            messages: [],
        };

        setItems(prev => [newItem, ...prev]);
        setIsRaiseModalOpen(false);
        setEditingItem(null);
        setActiveTab(queryData.type);
        toast.success(`Successfully posted ${queryData.type.toUpperCase()} item query!`);
        return newItem;
    }, [currentUser]);

    // EDIT QUERY
    const updateQuery = useCallback((itemId, updatedFields) => {
        setItems(prev => prev.map(item => {
            if (item.id === itemId) {
                return {
                    ...item,
                    ...updatedFields,
                    updatedAt: new Date().toISOString()
                };
            }
            return item;
        }));
        setIsRaiseModalOpen(false);
        setEditingItem(null);
        toast.success('Item query updated successfully!');
    }, []);

    // DELETE QUERY
    const deleteQuery = useCallback((itemId) => {
        setItems(prev => prev.filter(i => i.id !== itemId));
        if (selectedItemId === itemId) {
            setSelectedItemId(null);
        }
        setIsDeleteModalOpen(false);
        setItemToConfirm(null);
        toast.success('Query deleted successfully.');
    }, [selectedItemId]);

    // RESOLVE QUERY
    const resolveQuery = useCallback((itemId) => {
        setItems(prev => prev.map(item => {
            if (item.id === itemId) {
                return {
                    ...item,
                    status: 'resolved',
                    isResolved: true,
                    resolvedAt: new Date().toISOString()
                };
            }
            return item;
        }));
        setIsResolveModalOpen(false);
        setItemToConfirm(null);
        toast.success('Item marked as RESOLVED! Moved to Resolved tab.');
    }, []);

    // CLAIM ITEM
    const submitClaim = useCallback((itemId, reason) => {
        const newClaim = {
            id: `claim-${Date.now()}`,
            userId: currentUser.id,
            userName: currentUser.name,
            reason: reason,
            createdAt: new Date().toISOString()
        };

        const initialMsg = {
            id: `msg-${Date.now()}`,
            senderId: currentUser.id,
            senderName: currentUser.name,
            text: `[Claim Request]: ${reason}`,
            timestamp: new Date().toISOString()
        };

        setItems(prev => prev.map(item => {
            if (item.id === itemId) {
                const existingClaims = item.claims || [];
                const existingMessages = item.messages || [];
                return {
                    ...item,
                    claims: [...existingClaims, newClaim],
                    messages: [...existingMessages, initialMsg]
                };
            }
            return item;
        }));

        setIsClaimModalOpen(false);
        toast.success('Claim request submitted! Private chat is now active.');
    }, [currentUser]);

    // SEND PRIVATE CHAT MESSAGE
    const sendChatMessage = useCallback((itemId, text) => {
        if (!text || !text.trim()) return;

        const newMsg = {
            id: `msg-${Date.now()}`,
            senderId: currentUser.id,
            senderName: currentUser.name,
            text: text.trim(),
            timestamp: new Date().toISOString()
        };

        setItems(prev => prev.map(item => {
            if (item.id === itemId) {
                return {
                    ...item,
                    messages: [...(item.messages || []), newMsg]
                };
            }
            return item;
        }));
    }, [currentUser]);

    // Reset items state to empty
    const resetMockData = useCallback(() => {
        setItems([]);
        localStorage.removeItem(STORAGE_KEY);
        setSelectedItemId(null);
        toast.success('Cleared all items.');
    }, []);

    return {
        // Data & state
        items,
        filteredItems,
        tabCounts,
        activeTab,
        setActiveTab,
        searchQuery,
        setSearchQuery,
        categoryFilter,
        setCategoryFilter,
        sortOption,
        setSortOption,
        selectedItem,
        setSelectedItemId,

        // User role & permission checks
        currentUser,
        userRoleMode,
        setUserRoleMode,

        // Modals state
        isRaiseModalOpen,
        setIsRaiseModalOpen,
        editingItem,
        setEditingItem,
        isClaimModalOpen,
        setIsClaimModalOpen,
        isDeleteModalOpen,
        setIsDeleteModalOpen,
        isResolveModalOpen,
        setIsResolveModalOpen,
        itemToConfirm,
        setItemToConfirm,

        // Actions
        addQuery,
        updateQuery,
        deleteQuery,
        resolveQuery,
        submitClaim,
        sendChatMessage,
        resetMockData,
    };
};
