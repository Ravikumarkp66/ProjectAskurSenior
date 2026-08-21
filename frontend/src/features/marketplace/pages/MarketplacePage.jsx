/* ═══════════════════════════════════════════════════════════════════
   MarketplacePage Component
   Main Page for Campus Marketplace
═══════════════════════════════════════════════════════════════════ */

import React from 'react';
import { Plus } from 'lucide-react';
import { useMarketplace } from '../hooks/useMarketplace';
import MarketplaceHeader from '../components/MarketplaceHeader';
import MarketplaceCategories from '../components/MarketplaceCategories';
import MarketplaceSearch from '../components/MarketplaceSearch';
import MarketplaceFilters from '../components/MarketplaceFilters';
import MarketplaceGrid from '../components/MarketplaceGrid';
import SellItemModal from '../components/SellItemModal';
import DeleteListingModal from '../components/DeleteListingModal';
import MarkSoldModal from '../components/MarkSoldModal';
import MarketplaceDetailsPage from './MarketplaceDetailsPage';

const MarketplacePage = ({ initialCategory }) => {
    const {
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

        currentUser,

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

        addListing,
        updateListing,
        deleteListing,
        markAsSold,
        sendChatMessage,
        resetMockData,
    } = useMarketplace(initialCategory);

    // Handlers
    const handleSellClick = () => {
        setEditingItem(null);
        setIsSellModalOpen(true);
    };

    const handleFormSubmit = (formData) => {
        if (editingItem) {
            updateListing(editingItem.id, formData);
        } else {
            addListing(formData);
        }
    };

    const handleEditClick = (item) => {
        setEditingItem(item);
        setIsSellModalOpen(true);
    };

    const handleDeleteClick = (item) => {
        setItemToConfirm(item);
        setIsDeleteModalOpen(true);
    };

    const handleMarkSoldClick = (item) => {
        setItemToConfirm(item);
        setIsMarkSoldModalOpen(true);
    };

    const handleToggleCondition = (condId) => {
        setSelectedConditions(prev =>
            prev.includes(condId) ? prev.filter(c => c !== condId) : [...prev, condId]
        );
    };

    const handlePriceChange = (min, max) => {
        setMinPrice(min);
        setMaxPrice(max);
    };

    const handleResetFilters = () => {
        setSelectedConditions([]);
        setMinPrice(0);
        setMaxPrice(25000);
        setSearchQuery('');
    };

    const activeFilterCount = (selectedConditions.length > 0 ? 1 : 0) + (maxPrice < 25000 ? 1 : 0);

    // If an item is selected for details view, render MarketplaceDetailsPage
    if (selectedItem) {
        return (
            <div className="min-h-screen bg-[#0D1117] text-[#E6EDF3] p-4 sm:p-6 md:p-8">
                <MarketplaceDetailsPage
                    item={selectedItem}
                    currentUser={currentUser}
                    onBack={() => setSelectedItemId(null)}
                    onEdit={() => handleEditClick(selectedItem)}
                    onDelete={() => handleDeleteClick(selectedItem)}
                    onMarkSold={() => handleMarkSoldClick(selectedItem)}
                    onSendMessage={sendChatMessage}
                />

                {/* Modals from details view */}
                <SellItemModal
                    isOpen={isSellModalOpen}
                    onClose={() => {
                        setIsSellModalOpen(false);
                        setEditingItem(null);
                    }}
                    onSubmit={handleFormSubmit}
                    initialData={editingItem}
                />

                <DeleteListingModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    item={itemToConfirm}
                    onConfirmDelete={deleteListing}
                />

                <MarkSoldModal
                    isOpen={isMarkSoldModalOpen}
                    onClose={() => setIsMarkSoldModalOpen(false)}
                    item={itemToConfirm}
                    onConfirmSold={markAsSold}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0D1117] text-[#E6EDF3] p-3 sm:p-6 md:p-8 space-y-4 sm:space-y-5 pb-24 md:pb-8 relative">
            {/* Header */}
            <MarketplaceHeader
                onSellClick={handleSellClick}
                myListingsOnly={myListingsOnly}
                onToggleMyListings={setMyListingsOnly}
            />

            {/* Categories */}
            <MarketplaceCategories
                activeCategory={activeCategory}
                onSelectCategory={setActiveCategory}
                counts={categoryCounts}
            />

            {/* Search & Filters */}
            <MarketplaceSearch
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                sortOption={sortOption}
                onSortChange={setSortOption}
                activeFilterCount={activeFilterCount}
                onOpenFilters={() => setIsFilterDrawerOpen(true)}
                totalCount={filteredListings.length}
            />

            {/* Product Grid */}
            <MarketplaceGrid
                items={filteredListings}
                hasSearchQuery={!!searchQuery || activeFilterCount > 0}
                onClearFilters={handleResetFilters}
                onSellClick={handleSellClick}
                isMyListings={myListingsOnly}
                onSelectItem={setSelectedItemId}
            />

            {/* Mobile Floating Action Button (FAB) */}
            <button
                type="button"
                onClick={handleSellClick}
                className="fixed bottom-20 right-4 z-40 md:hidden flex items-center gap-2 px-4 py-3 rounded-full font-extrabold text-xs text-white shadow-2xl transition-transform active:scale-95 border border-emerald-400/30 backdrop-blur-md"
                style={{
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    boxShadow: '0 8px 25px rgba(16, 185, 129, 0.45)'
                }}
                aria-label="Sell Something"
            >
                <Plus size={18} className="stroke-[3]" />
                <span>Sell</span>
            </button>

            {/* Modals */}
            <SellItemModal
                isOpen={isSellModalOpen}
                onClose={() => {
                    setIsSellModalOpen(false);
                    setEditingItem(null);
                }}
                onSubmit={handleFormSubmit}
                initialData={editingItem}
            />

            <MarketplaceFilters
                isOpen={isFilterDrawerOpen}
                onClose={() => setIsFilterDrawerOpen(false)}
                selectedConditions={selectedConditions}
                onToggleCondition={handleToggleCondition}
                minPrice={minPrice}
                maxPrice={maxPrice}
                onPriceChange={handlePriceChange}
                onResetFilters={handleResetFilters}
            />

            <DeleteListingModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                item={itemToConfirm}
                onConfirmDelete={deleteListing}
            />

            <MarkSoldModal
                isOpen={isMarkSoldModalOpen}
                onClose={() => setIsMarkSoldModalOpen(false)}
                item={itemToConfirm}
                onConfirmSold={markAsSold}
            />
        </div>
    );
};

export default MarketplacePage;
