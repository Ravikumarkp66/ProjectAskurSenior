/* ═══════════════════════════════════════════════════════════════════
   LostFoundPage Component
   Main Container Page for Lost & Found Module
═══════════════════════════════════════════════════════════════════ */

import React from 'react';
import { Plus } from 'lucide-react';
import { useLostFound } from '../hooks/useLostFound';
import LostFoundHeader from '../components/LostFoundHeader';
import LostFoundTabs from '../components/LostFoundTabs';
import LostFoundSearch from '../components/LostFoundSearch';
import LostFoundGrid from '../components/LostFoundGrid';
import RaiseQueryModal from '../components/RaiseQueryModal';
import ClaimModal from '../components/ClaimModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import ResolveConfirmModal from '../components/ResolveConfirmModal';
import LostFoundDetailsPage from './LostFoundDetailsPage';

const LostFoundPage = ({ initialTab }) => {
    const {
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

        currentUser,
        userRoleMode,
        setUserRoleMode,

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

        addQuery,
        updateQuery,
        deleteQuery,
        resolveQuery,
        submitClaim,
        sendChatMessage,
        resetMockData,
    } = useLostFound(initialTab);

    // Handlers for modal actions
    const handleRaiseClick = () => {
        setEditingItem(null);
        setIsRaiseModalOpen(true);
    };

    const handleFormSubmit = (formData) => {
        if (editingItem) {
            updateQuery(editingItem.id, formData);
        } else {
            addQuery(formData);
        }
    };

    const handleEditItem = (item) => {
        setEditingItem(item);
        setIsRaiseModalOpen(true);
    };

    const handleDeleteClick = (item) => {
        setItemToConfirm(item);
        setIsDeleteModalOpen(true);
    };

    const handleResolveClick = (item) => {
        setItemToConfirm(item);
        setIsResolveModalOpen(true);
    };

    const handleClaimClick = (item) => {
        setItemToConfirm(item);
        setIsClaimModalOpen(true);
    };

    // If an item is selected for details view, render LostFoundDetailsPage
    if (selectedItem) {
        return (
            <div className="min-h-screen bg-[#0D1117] text-[#E6EDF3] p-3 sm:p-6 md:p-8">
                <LostFoundDetailsPage
                    item={selectedItem}
                    currentUser={currentUser}
                    onBack={() => setSelectedItemId(null)}
                    onEdit={() => handleEditItem(selectedItem)}
                    onDelete={() => handleDeleteClick(selectedItem)}
                    onResolve={() => handleResolveClick(selectedItem)}
                    onClaim={() => handleClaimClick(selectedItem)}
                    onSendMessage={sendChatMessage}
                />

                {/* Modals triggered from details page */}
                <RaiseQueryModal
                    isOpen={isRaiseModalOpen}
                    onClose={() => {
                        setIsRaiseModalOpen(false);
                        setEditingItem(null);
                    }}
                    onSubmit={handleFormSubmit}
                    initialData={editingItem}
                />

                <ClaimModal
                    isOpen={isClaimModalOpen}
                    onClose={() => setIsClaimModalOpen(false)}
                    item={itemToConfirm}
                    onSubmitClaim={submitClaim}
                />

                <DeleteConfirmModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    item={itemToConfirm}
                    onConfirmDelete={deleteQuery}
                />

                <ResolveConfirmModal
                    isOpen={isResolveModalOpen}
                    onClose={() => setIsResolveModalOpen(false)}
                    item={itemToConfirm}
                    onConfirmResolve={resolveQuery}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0D1117] text-[#E6EDF3] p-3 sm:p-6 md:p-8 space-y-4 sm:space-y-5 pb-24 md:pb-8 relative">
            {/* Header */}
            <LostFoundHeader onRaiseQuery={handleRaiseClick} />

            {/* Tab Controls */}
            <LostFoundTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                counts={tabCounts}
            />

            {/* Search & Filters */}
            <LostFoundSearch
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                sortOption={sortOption}
                onSortChange={setSortOption}
                totalCount={filteredItems.length}
            />

            {/* Item Card Grid */}
            <LostFoundGrid
                items={filteredItems}
                activeTab={activeTab}
                hasSearchQuery={!!searchQuery}
                onClearSearch={() => setSearchQuery('')}
                onRaiseQuery={handleRaiseClick}
                onSelectItem={setSelectedItemId}
            />

            {/* Mobile Floating Action Button (FAB) */}
            <button
                type="button"
                onClick={handleRaiseClick}
                className="fixed bottom-20 right-4 z-40 md:hidden flex items-center gap-2 px-4 py-3 rounded-full font-extrabold text-xs text-white shadow-2xl transition-transform active:scale-95 border border-orange-400/30 backdrop-blur-md"
                style={{
                    background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                    boxShadow: '0 8px 25px rgba(249, 115, 22, 0.45)'
                }}
                aria-label="Raise Lost & Found Query"
            >
                <Plus size={18} className="stroke-[3]" />
                <span>Report</span>
            </button>

            {/* Modals */}
            <RaiseQueryModal
                isOpen={isRaiseModalOpen}
                onClose={() => {
                    setIsRaiseModalOpen(false);
                    setEditingItem(null);
                }}
                onSubmit={handleFormSubmit}
                initialData={editingItem}
            />

            <ClaimModal
                isOpen={isClaimModalOpen}
                onClose={() => setIsClaimModalOpen(false)}
                item={itemToConfirm}
                onSubmitClaim={submitClaim}
            />

            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                item={itemToConfirm}
                onConfirmDelete={deleteQuery}
            />

            <ResolveConfirmModal
                isOpen={isResolveModalOpen}
                onClose={() => setIsResolveModalOpen(false)}
                item={itemToConfirm}
                onConfirmResolve={resolveQuery}
            />
        </div>
    );
};

export default LostFoundPage;
