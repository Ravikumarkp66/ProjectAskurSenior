import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SubjectDetailsScreen({ route, navigation }) {
  // Defensive check for params
  const { subject = 'Subject' } = route.params || {};

  const years = [
    { id: '1', title: '1st Year', info: 'Basic Engineering' },
    { id: '2', title: '2nd Year', info: 'Core Technical' },
    { id: '3', title: '3rd Year', info: 'Advanced Technical' },
    { id: '4', title: '4th Year', info: 'Projects & Electives' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color="#1e293b" />
            </TouchableOpacity>
            <View style={styles.titleBox}>
                <Text style={styles.subjectTitle}>{subject}</Text>
                <Text style={styles.subtitle}>Select Academic Year</Text>
            </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {years.map((year) => (
                <TouchableOpacity 
                    key={year.id} 
                    style={styles.yearCard}
                    onPress={() => {
                        // For now we'll just show it's clickable
                        // navigation.navigate('MaterialsList', { subject, year: year.title })
                    }}
                >
                    <View style={styles.yearIconBox}>
                        <Text style={styles.yearIconText}>{year.id}</Text>
                    </View>
                    <View style={styles.yearInfo}>
                        <Text style={styles.yearTitle}>{year.title}</Text>
                        <Text style={styles.yearSubinfo}>{year.info}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                </TouchableOpacity>
            ))}

            <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={20} color="#3b82f6" />
                <Text style={styles.infoText}>
                    Materials are organized by academic years to match your curriculum.
                </Text>
            </View>
        </ScrollView>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  titleBox: {
    flex: 1,
  },
  subjectTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  scrollContent: {
    padding: 20,
  },
  yearCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  yearIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  yearIconText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  yearInfo: {
    flex: 1,
  },
  yearTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  yearSubinfo: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 16,
    marginTop: 10,
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#3b82f6',
    fontWeight: '500',
    lineHeight: 18,
  }
});
