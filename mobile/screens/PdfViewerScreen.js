import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Animated,
  StatusBar,
  SafeAreaView,
  Platform,
  Alert
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

const { width, height } = Dimensions.get('window');

/**
 * PdfViewerScreen - Production Level Immersive PDF Viewer (Expo Go Compatible)
 * 
 * Features:
 * - Fullscreen immersive dark layout
 * - Floating auto-hiding header
 * - Google Docs Viewer fallback for Android
 * - Secure Download system
 */
export default function PdfViewerScreen({ route, navigation }) {
  const { uri, fileName = 'Document.pdf' } = route.params || {};

  // State Management
  const [isLoading, setIsLoading] = useState(true);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  
  // Animation Refs
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const hideTimerRef = useRef(null);

  // Auto-hide header effect after 3 seconds of inactivity
  useEffect(() => {
    startAutoHideTimer();
    return () => clearTimeout(hideTimerRef.current);
  }, []);

  const startAutoHideTimer = () => {
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      toggleHeader(false);
    }, 3000);
  };

  const toggleHeader = (visible) => {
    setIsHeaderVisible(visible);
    Animated.timing(headerOpacity, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleScreenTap = () => {
    if (!isHeaderVisible) {
      toggleHeader(true);
      startAutoHideTimer();
    } else {
      toggleHeader(false);
      clearTimeout(hideTimerRef.current);
    }
  };

  const handleDownload = async () => {
    try {
      const fileUri = FileSystem.documentDirectory + fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
      const result = await FileSystem.downloadAsync(uri, fileUri);
      
      Alert.alert("Success", "Document downloaded successfully.");
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(result.uri);
      }
    } catch (error) {
      console.error("Download Error:", error);
      Alert.alert("Error", "Failed to download the document.");
    }
  };

  // Android WebView cannot render PDFs directly, so we use Google Docs Viewer
  const sourceUri = Platform.OS === 'android' 
    ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(uri)}`
    : uri;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* PDF Viewport (WebView) */}
      <View style={styles.pdfContainer} onTouchStart={handleScreenTap}>
        <WebView
          source={{ uri: sourceUri }}
          style={styles.pdf}
          onLoadEnd={() => setIsLoading(false)}
          onError={() => {
            Alert.alert("Error", "Failed to load PDF preview.");
            setIsLoading(false);
          }}
          startInLoadingState={true}
          renderLoading={() => (
             <View style={styles.loaderBackdrop}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.loadingMessage}>Opening Material...</Text>
             </View>
          )}
        />
      </View>

      {/* Floating Header Overlay */}
      <Animated.View style={[styles.headerOverlay, { opacity: headerOpacity, pointerEvents: isHeaderVisible ? 'auto' : 'none' }]}>
        <SafeAreaView style={styles.headerSafe}>
          <TouchableOpacity 
             style={styles.iconButton} 
             onPress={() => navigation.goBack()}
             activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle} numberOfLines={1}>
            {fileName}
          </Text>

          <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
            <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
          </TouchableOpacity>
        </SafeAreaView>
      </Animated.View>

      {/* Bottom Download pill */}
      <Animated.View style={[styles.footerOverlay, { opacity: headerOpacity, pointerEvents: isHeaderVisible ? 'auto' : 'none' }]}>
          <TouchableOpacity 
            style={styles.downloadPill} 
            onPress={handleDownload}
            activeOpacity={0.8}
          >
            <Ionicons name="cloud-download" size={20} color="#fff" />
            <Text style={styles.downloadText}>Download PDF</Text>
          </TouchableOpacity>
      </Animated.View>

      {isLoading && (
        <View style={styles.loaderBackdrop}>
           <ActivityIndicator size="large" color="#3b82f6" />
           <Text style={styles.loadingMessage}>Initializing Viewer...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  pdfContainer: {
    flex: 1,
    width: width,
    height: height,
  },
  pdf: {
    flex: 1,
    width: width,
    height: height,
    backgroundColor: '#121212',
  },
  loaderBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingMessage: {
    color: '#94a3b8',
    marginTop: 15,
    fontSize: 14,
    fontWeight: '500',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingBottom: 10,
    zIndex: 100,
  },
  headerSafe: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginHorizontal: 10,
  },
  footerOverlay: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  downloadPill: {
    flexDirection: 'row',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 25,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  downloadText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
