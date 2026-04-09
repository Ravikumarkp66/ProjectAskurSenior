import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  SafeAreaView,
  FlatList,
  Modal,
  Dimensions,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { WebView } from 'react-native-webview';
import { Animated } from 'react-native';

const { height } = Dimensions.get('window');

const MaterialCard = ({ item, onPreview, onDownload, processingId }) => {
  const isProcessing = processingId === item.id;
  const scale = new Animated.Value(1);

  const handlePressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(scale, { toValue: 1, friction: 3, useNativeDriver: true }).start();

  return (
    <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
      <Pressable 
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.fileIconBox}>
            <Ionicons name="document-text" size={26} color="#3b82f6" />
          </View>
          <View style={styles.titleArea}>
            <Text style={styles.fileName} numberOfLines={1}>{item.fileName}</Text>
            <Text style={styles.subjectMeta}>{item.subjectCode} • {item.subjectName}</Text>
          </View>
          <View style={styles.tagBadge}>
            <Text style={styles.tagText}>{item.type}</Text>
          </View>
        </View>

        <View style={styles.cardInfo}>
           <View style={styles.metaRow}>
              <Ionicons name="person-outline" size={14} color="#94a3b8" />
              <Text style={styles.metaText}>By {item.uploadedBy}</Text>
           </View>
           <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={14} color="#94a3b8" />
              <Text style={styles.metaText}>{item.year} Year</Text>
           </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardActions}>
          <View style={styles.sizeInfo}>
             <Text style={styles.sizeText}>{item.size}</Text>
          </View>
          <View style={styles.buttonGroup}>
             <TouchableOpacity 
               style={styles.previewBtn} 
               onPress={() => onPreview(item)}
               disabled={!!processingId}
             >
                <Text style={styles.previewBtnText}>Preview</Text>
             </TouchableOpacity>
             <TouchableOpacity 
               style={[styles.downloadBtn, isProcessing && { opacity: 0.7 }]} 
               onPress={() => onDownload(item)}
               disabled={!!processingId}
             >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="cloud-download-outline" size={20} color="#fff" />
                )}
             </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const SubjectCard = ({ name, count, onPress }) => {
  const scale = new Animated.Value(1);

  const handlePressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(scale, { toValue: 1, friction: 3, useNativeDriver: true }).start();

  return (
    <Animated.View style={[styles.subjectCard, { transform: [{ scale }] }]}>
      <Pressable 
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={styles.subjectCardContent}
      >
        <View style={styles.subjectCardIcon}>
          <Ionicons name="folder-open" size={28} color="#3b82f6" />
        </View>
        <View style={styles.subjectCardInfo}>
          <Text style={styles.subjectCardTitle}>{name}</Text>
          <Text style={styles.subjectCardCount}>{count} Materials Available</Text>
        </View>
        <View style={styles.chevronBox}>
           <Ionicons name="chevron-forward" size={20} color="#3b82f6" />
        </View>
      </Pressable>
    </Animated.View>
  );
};

const EmptyState = () => (
  <View style={styles.emptyStateContainer}>
    <View style={styles.emptyStateIconBox}>
      <Ionicons name="search-outline" size={48} color="#94a3b8" />
    </View>
    <Text style={styles.emptyStateTitle}>Find your materials</Text>
    <Text style={styles.emptyStateSub}>Select filters or search to begin</Text>
  </View>
);

export default function MaterialsScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState(null);
  
  // Filter States
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedBatch, setSelectedBatch] = useState('All');
  const [activeFilterModal, setActiveFilterModal] = useState(null); // 'Year', 'Subject', 'Type', 'Batch'
  const [materialLimit, setMaterialLimit] = useState(6);

  const [materials, setMaterials] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoadingFeed(true);
    try {
      const { getMaterials } = require('../services/api');
      // Fetching up to 100 docs for more robust filtering locally
      const data = await getMaterials("?limit=100");
      console.log("MOBILE_DEBUG: Received materials count:", data?.documents?.length);
      if (data && data.documents) {
        // Map backend document to what the UI expects
        const formatted = data.documents.map(doc => ({
          id: doc._id,
          fileName: doc.originalName || doc.fileName || 'Document.pdf',
          fileUrl: doc.fileUrl,
          subjectCode: doc.subjectCode || 'UNK',
          subjectName: doc.subjectName || 'Unknown Subject',
          uploadedBy: doc.uploadedBy?.name || 'User',
          type: doc.documentType?.toUpperCase() || 'NOTES',
          year: doc.year ? (doc.year === '1' || doc.year === 1 ? '1st' : doc.year === '2' || doc.year === 2 ? '2nd' : doc.year === '3' || doc.year === 3 ? '3rd' : doc.year === '4' || doc.year === 4 ? '4th' : `${doc.year}`) : '1st',
          batch: doc.batch || '2024',
          size: `${Math.round(doc.fileSize / 1024)} KB`,
          date: new Date(doc.createdAt).toLocaleDateString()
        }));
        setMaterials(formatted);
      }
    } catch (e) {
      console.warn("Failed to fetch materials:", e);
    } finally {
      setLoadingFeed(false);
    }
  };

  const handlePreview = async (item) => {
    try {
      const { getPreviewUrl } = require('../services/api');
      const response = await getPreviewUrl(item.id);
      
      if (response && response.previewUrl) {
        navigation.navigate('PdfViewer', { 
          uri: response.previewUrl,
          fileName: item.fileName 
        });
      } else {
        Alert.alert("Error", "Could not generate preview link.");
      }
    } catch (e) {
      console.warn("Failed to get preview URL:", e);
      Alert.alert("Error", "Connection to server failed.");
    }
  };

  const handleDownload = async (item) => {
    try {
      setProcessingId(item.id);

      const { getDownloadUrl } = require('../services/api');
      const response = await getDownloadUrl(item.id);
      
      let downloadUrl = item.fileUrl; // fallback
      if (response && response.downloadUrl) {
          downloadUrl = response.downloadUrl;
      }
      
      console.log("Downloading from S3 URL:", downloadUrl);

      const fileUri = FileSystem.documentDirectory + item.fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
      const result = await FileSystem.downloadAsync(downloadUrl, fileUri);
      
      Alert.alert("Success!", "File downloaded successfully.");
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(result.uri);
      }
    } catch (error) {
      console.error("Download Error:", error);
      Alert.alert("Download failed", "An error occurred.");
    } finally {
      setProcessingId(null);
    }
  };

  // derived state for filtering logic
  const isFilterActive = selectedYear !== 'All' || selectedType !== 'All' || selectedBatch !== 'All' || selectedSubject !== 'All';
  const hasSearch = searchQuery.trim().length > 0;

  const filteredMaterials = materials.filter(item => {
      const matchSearch = item.fileName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.subjectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.subjectName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchYear = selectedYear === 'All' || item.year === selectedYear;
      const matchType = selectedType === 'All' || item.type === selectedType;
      const matchSubject = selectedSubject === 'All' || item.subjectName === selectedSubject;
      const matchBatch = selectedBatch === 'All' || item.batch === selectedBatch;
      return matchSearch && matchYear && matchType && matchSubject && matchBatch;
  });

  const getListData = () => {
    // 1. Empty State
    // Removed: Only show empty if results are truly empty
    if (filteredMaterials.length === 0 && (isFilterActive || hasSearch)) {
       return [];
    }
    
    // 2. Show Subjects
    if (selectedSubject === 'All') {
       const groupMap = {};
       filteredMaterials.forEach(m => {
          if (!groupMap[m.subjectName]) groupMap[m.subjectName] = 0;
          groupMap[m.subjectName]++;
       });
       return Object.keys(groupMap).map(key => ({ isSubject: true, name: key, count: groupMap[key] }));
    } 
    
    // 3. Show Limited Materials
    return filteredMaterials.slice(0, materialLimit);
  };

  const getModalOptions = () => {
    switch(activeFilterModal) {
      case 'Year': return ['All', '1st', '2nd', '3rd', '4th'];
      case 'Type': return ['All', 'NOTES', 'SEE', 'INTERNALS'];
      case 'Batch': return ['All', '2024', '2025', '2026', '2027'];
      case 'Subject': 
          return ['All', ...new Set(materials.map(m => m.subjectName))].filter(Boolean);
      default: return [];
    }
  };

  const getModalSelected = () => {
    switch(activeFilterModal) {
      case 'Year': return selectedYear;
      case 'Type': return selectedType;
      case 'Batch': return selectedBatch;
      case 'Subject': return selectedSubject;
      default: return 'All';
    }
  };

  const setModalOption = (opt) => {
    switch(activeFilterModal) {
      case 'Year': setSelectedYear(opt); setSelectedSubject('All'); break; // reset subject if year changes
      case 'Type': setSelectedType(opt); setSelectedSubject('All'); break;
      case 'Batch': setSelectedBatch(opt); setSelectedSubject('All'); break;
      case 'Subject': setSelectedSubject(opt); setMaterialLimit(6); break;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Search Header */}
        <View style={styles.searchHeader}>
           <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#94a3b8" />
              <TextInput 
                placeholder="Search subjects or materials..." 
                style={styles.input}
                value={searchQuery}
                onChangeText={(t) => { setSearchQuery(t); setSelectedSubject('All'); }} // Reset subject on raw search
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                   <Ionicons name="close-circle" size={18} color="#94a3b8" />
                </TouchableOpacity>
              )}
           </View>
        </View>

        {/* 🚀 NEW: Horizontal Filter Chips */}
        <View style={styles.filterBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
             <TouchableOpacity style={[styles.filterChip, selectedYear !== 'All' && styles.filterChipActive]} onPress={() => setActiveFilterModal('Year')}>
                <Text style={[styles.filterChipText, selectedYear !== 'All' && styles.filterChipTextActive]}>{selectedYear === 'All' ? 'Year' : selectedYear}</Text>
                <Ionicons name="chevron-down" size={14} color={selectedYear !== 'All' ? '#fff' : '#64748b'} />
             </TouchableOpacity>
             <TouchableOpacity style={[styles.filterChip, selectedSubject !== 'All' && styles.filterChipActive]} onPress={() => setActiveFilterModal('Subject')}>
                <Text style={[styles.filterChipText, selectedSubject !== 'All' && styles.filterChipTextActive]}>{selectedSubject === 'All' ? 'Subject' : selectedSubject}</Text>
                <Ionicons name="chevron-down" size={14} color={selectedSubject !== 'All' ? '#fff' : '#64748b'} />
             </TouchableOpacity>
             <TouchableOpacity style={[styles.filterChip, selectedType !== 'All' && styles.filterChipActive]} onPress={() => setActiveFilterModal('Type')}>
                <Text style={[styles.filterChipText, selectedType !== 'All' && styles.filterChipTextActive]}>{selectedType === 'All' ? 'Type' : selectedType}</Text>
                <Ionicons name="chevron-down" size={14} color={selectedType !== 'All' ? '#fff' : '#64748b'} />
             </TouchableOpacity>
             <TouchableOpacity style={[styles.filterChip, selectedBatch !== 'All' && styles.filterChipActive]} onPress={() => setActiveFilterModal('Batch')}>
                <Text style={[styles.filterChipText, selectedBatch !== 'All' && styles.filterChipTextActive]}>{selectedBatch === 'All' ? 'Batch' : selectedBatch}</Text>
                <Ionicons name="chevron-down" size={14} color={selectedBatch !== 'All' ? '#fff' : '#64748b'} />
             </TouchableOpacity>
          </ScrollView>
        </View>

        {/* 🚀 NEW: Material Count Feedback */}
        { (isFilterActive || hasSearch) && (
            <View style={styles.materialCountBar}>
               <Ionicons name="bar-chart" size={16} color="#3b82f6" />
               <Text style={styles.materialCountText}>{filteredMaterials.length} Materials Found</Text>
            </View>
        )}

        {/* Feed */}
        <FlatList
          data={getListData()}
          renderItem={({ item }) => {
            if (item.isSubject) {
               return <SubjectCard name={item.name} count={item.count} onPress={() => { setSelectedSubject(item.name); setMaterialLimit(6); }} />
            }
            return <MaterialCard 
                item={item} 
                onPreview={handlePreview} 
                onDownload={handleDownload} 
                processingId={processingId}
            />
          }}
          keyExtractor={(item, index) => item.id || `sub-${index}`}
          contentContainerStyle={styles.feedContent}
          ListHeaderComponent={() => (
             <View style={styles.listHeader}>
                <Text style={styles.listHeaderTitle}>
                   {selectedSubject === 'All' ? 'All Subjects' : selectedSubject}
                </Text>
                <Text style={styles.listHeaderSub}>
                   {filteredMaterials.length} materials discovered
                </Text>
             </View>
          )}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState />}
          ListFooterComponent={() => {
              if (selectedSubject !== 'All' && filteredMaterials.length > materialLimit) {
                  return (
                      <TouchableOpacity style={styles.viewMoreBtn} onPress={() => setMaterialLimit(prev => prev + 6)}>
                          <Text style={styles.viewMoreText}>Load More</Text>
                      </TouchableOpacity>
                  )
              }
              return null;
          }}
        />


        {/* 🚀 NEW: Dynamic Bottom Sheet Filter Modal */}
        <Modal visible={!!activeFilterModal} transparent={true} animationType="slide">
          <Pressable style={styles.modalOverlay} onPress={() => setActiveFilterModal(null)}>
            <View style={styles.filterModal} onStartShouldSetResponder={() => true}>
               <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select {activeFilterModal}</Text>
                  <TouchableOpacity onPress={() => setActiveFilterModal(null)}>
                     <Ionicons name="close" size={24} color="#0f172a" />
                  </TouchableOpacity>
               </View>

               <View style={styles.filterSection}>
                  <View style={styles.filterChips}>
                    {getModalOptions().map(opt => (
                       <TouchableOpacity 
                         key={opt} 
                         onPress={() => { setModalOption(opt); setActiveFilterModal(null); }} 
                         style={[styles.modalChip, getModalSelected() === opt && styles.activeModalChip]}
                       >
                         <Text style={[styles.modalChipText, getModalSelected() === opt && styles.activeModalChipText]}>{opt}</Text>
                       </TouchableOpacity>
                    ))}
                  </View>
               </View>
            </View>
          </Pressable>
        </Modal>

        {/* FAB */}
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('Upload')}>
          <Ionicons name="add" size={32} color="#fff" />
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fafafa' },
  
  searchHeader: { flexDirection: 'row', padding: 20, gap: 12, alignItems: 'center', backgroundColor: '#fff' },
  searchBar: { flex: 1, flexDirection: 'row', backgroundColor: '#f1f5f9', height: 50, borderRadius: 15, alignItems: 'center', paddingHorizontal: 15, gap: 10 },
  input: { flex: 1, fontSize: 15, color: '#1e293b' },
  
  filterBar: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 15, backgroundColor: '#fff' },
  filterScroll: { paddingHorizontal: 20, gap: 10 },
  filterChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, gap: 6 },
  filterChipActive: { backgroundColor: '#3b82f6' },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  filterChipTextActive: { color: '#fff' },
  
  materialCountBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  materialCountText: { fontSize: 13, fontWeight: 'bold', color: '#1e3a8a' },

  subjectCard: { 
    backgroundColor: '#fff', 
    marginHorizontal: 20, 
    borderRadius: 24, 
    marginTop: 15, 
    borderWidth: 1, 
    borderColor: '#f1f5f9', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 6 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 10,
    elevation: 3
  },
  subjectCardContent: {
    padding: 24, 
    flexDirection: 'row', 
    alignItems: 'center', 
  },
  subjectCardIcon: { 
    width: 60, 
    height: 60, 
    borderRadius: 18, 
    backgroundColor: '#eff6ff', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 18 
  },
  subjectCardInfo: { flex: 1 },
  subjectCardTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginBottom: 4 },
  subjectCardCount: { fontSize: 13, color: '#94a3b8', fontWeight: '600' },
  chevronBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  listHeader: { paddingHorizontal: 20, paddingTop: 10, marginBottom: 5 },
  listHeaderTitle: { fontSize: 22, fontWeight: 'bold', color: '#0f172a' },
  listHeaderSub: { fontSize: 13, color: '#64748b', marginTop: 4 },

  emptyStateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80, paddingHorizontal: 20, marginTop: 50 },
  emptyStateIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyStateTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginBottom: 8 },
  emptyStateSub: { fontSize: 14, color: '#64748b', textAlign: 'center' },
  
  viewMoreBtn: { marginHorizontal: 20, marginVertical: 20, backgroundColor: '#f1f5f9', paddingVertical: 15, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  viewMoreText: { fontSize: 14, fontWeight: 'bold', color: '#475569' },

  feedContent: { paddingBottom: 120 },
  card: { 
    backgroundColor: '#ffffff', 
    marginHorizontal: 20, 
    borderRadius: 24, 
    padding: 20, 
    marginTop: 15, 
    borderWidth: 1, 
    borderColor: '#f1f5f9', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 6 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 10,
    elevation: 3
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  fileIconBox: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  titleArea: { flex: 1 },
  fileName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  subjectMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  tagBadge: { backgroundColor: '#f8fafc', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#f1f5f9' },
  tagText: { fontSize: 10, fontWeight: '800', color: '#3b82f6', textTransform: 'uppercase' },
  cardInfo: { flexDirection: 'row', gap: 15, marginBottom: 16 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#f8fafc', marginBottom: 16 },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sizeInfo: { backgroundColor: '#f8fafc', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  sizeText: { fontSize: 12, color: '#64748b', fontWeight: 'bold' },
  buttonGroup: { flexDirection: 'row', gap: 10 },
  previewBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  previewBtnText: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  downloadBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  
  // 🍿 PREVIEW MODAL STYLES
  previewSafe: { flex: 1, backgroundColor: '#fff' },
  previewHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  previewTitleBox: { flex: 1 },
  previewFileName: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  previewSubtitle: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
  webViewContainer: { flex: 1 },
  webView: { flex: 1 },
  webLoader: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loaderText: { marginTop: 12, fontSize: 14, color: '#94a3b8' },
  previewFooter: { padding: 20, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  fullDownloadBtn: { height: 54, backgroundColor: '#3b82f6', borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  fullDownloadText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  filterModal: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, maxHeight: height * 0.8 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  filterSection: { marginBottom: 24 },
  filterChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  modalChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  activeModalChip: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  modalChipText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  activeModalChipText: { color: '#fff' },
  
  fab: { 
    position: 'absolute', 
    bottom: 40, 
    right: 25, 
    width: 68, 
    height: 68, 
    borderRadius: 34, 
    backgroundColor: '#0f172a', 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 10, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 6 }, 
    shadowOpacity: 0.4, 
    shadowRadius: 12 
  }
});
