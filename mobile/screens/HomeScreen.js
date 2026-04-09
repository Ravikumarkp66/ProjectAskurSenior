import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Animated } from 'react-native';

export default function HomeScreen({ navigation }) {
  // Placeholder student info - this will be replaced with real data from backend
  const student = {
    name: "Ravikumar K P",
    usn: "1SI23IS001",
    year: "3rd Year",
    branch: "Information Science",
    avatarColor: "#3b82f6"
  };

  const QuickAction = ({ icon, label, color, onPress }) => {
    const scale = new Animated.Value(1);

    const handlePressIn = () => {
      Animated.spring(scale, { toValue: 0.92, useNativeDriver: true }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scale, { toValue: 1, friction: 3, useNativeDriver: true }).start();
    };

    return (
      <TouchableOpacity 
        activeOpacity={0.7}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
      >
        <Animated.View style={[styles.actionItem, { transform: [{ scale }] }]}>
          <View style={[styles.actionIcon, { backgroundColor: color + '15' }]}>
            <Ionicons name={icon} size={24} color={color} />
          </View>
          <Text style={styles.actionLabel}>{label}</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const RecentItem = ({ title, sub, icon, date }) => (
    <TouchableOpacity style={styles.recentItem}>
      <View style={styles.recentIconBox}>
        <Ionicons name={icon} size={20} color="#3b82f6" />
      </View>
      <View style={styles.recentInfo}>
        <Text style={styles.recentTitle}>{title}</Text>
        <Text style={styles.recentSub}>{sub}</Text>
      </View>
      <Text style={styles.recentDate}>{date}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hey there! 👋</Text>
            <Text style={styles.welcomeText}>Welcome back to AskUrSenior</Text>
          </View>
          <TouchableOpacity style={styles.profilePic}>
             <Ionicons name="notifications-outline" size={24} color="#1e293b" />
          </TouchableOpacity>
        </View>

        {/* Dynamic Student Card */}
        <LinearGradient
          colors={['#1e293b', '#0f172a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.studentCard}
        >
          <View style={styles.cardHeader}>
            <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{student.name.charAt(0)}</Text>
            </View>
            <View style={styles.branchBadge}>
                <Text style={styles.branchText}>{student.branch}</Text>
            </View>
          </View>

          <View style={styles.cardInfo}>
             <Text style={styles.studentName}>{student.name}</Text>
             <Text style={styles.studentDetails}>{student.usn} • {student.year}</Text>
          </View>

          <View style={styles.cardStats}>
             <View style={styles.statBox}>
                <Text style={styles.statValue}>12</Text>
                <Text style={styles.statLabel}>Materials</Text>
             </View>
             <View style={styles.statDivider} />
             <View style={styles.statBox}>
                <Text style={styles.statValue}>5</Text>
                <Text style={styles.statLabel}>Downloads</Text>
             </View>
          </View>

          <View style={styles.cardFooter}>
             <View style={styles.statusIndicator}>
                <View style={styles.activeDot} />
                <Text style={styles.statusText}>Active Account</Text>
             </View>
             <Ionicons name="qr-code-outline" size={20} color="#94a3b8" />
          </View>
        </LinearGradient>

        <TouchableOpacity 
          style={styles.mainCta}
          onPress={() => navigation.navigate('Materials')}
        >
          <Text style={styles.mainCtaText}>Browse All Materials</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>

        {/* Quick Insights Section */}
        <View style={styles.insightSection}>
           <View style={styles.insightCard}>
              <View style={styles.insightIconBox}>
                 <Ionicons name="flash" size={20} color="#f59e0b" />
              </View>
              <View style={styles.insightTextContent}>
                 <Text style={styles.insightTitle}>Next Internal Exam</Text>
                 <Text style={styles.insightDesc}>Coming up in 5 days (Information Theory)</Text>
              </View>
           </View>
           <View style={styles.insightCard}>
              <View style={[styles.insightIconBox, { backgroundColor: '#eff6ff' }]}>
                 <Ionicons name="checkmark-circle" size={20} color="#3b82f6" />
              </View>
              <View style={styles.insightTextContent}>
                 <Text style={styles.insightTitle}>SEE Eligibility</Text>
                 <Text style={styles.insightDesc}>Your CIE scores are safe (Avg: 42/50)</Text>
              </View>
           </View>
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Main Hub</Text>
          <View style={styles.hubGrid}>
            <QuickAction 
                icon="document-text" 
                label="Materials" 
                color="#3b82f6" 
                onPress={() => navigation.navigate('Materials')} 
            />
            <QuickAction 
                icon="calculator" 
                label="Calculators" 
                color="#8b5cf6" 
                onPress={() => navigation.navigate('Tools')} 
            />
            <QuickAction 
                icon="calendar" 
                label="Calendar" 
                color="#10b981" 
                onPress={() => {}} // TODO: Add Calendar Screen
            />
            <QuickAction 
                icon="cloud-download" 
                label="Downloads" 
                color="#f59e0b" 
                onPress={() => {}} // TODO: Add Downloads Screen
            />
          </View>
        </View>

        {/* Recent Updates */}
        <View style={styles.section}>
            <View style={styles.titleRow}>
               <Text style={styles.sectionTitle}>Recent Material Updates</Text>
               <TouchableOpacity onPress={() => navigation.navigate('Materials')}><Text style={styles.viewMore}>View All</Text></TouchableOpacity>
            </View>
            <View style={styles.recentList}>
                <RecentItem 
                  title="DBMS Module 1" 
                  sub="Relational Algebra Concepts" 
                  icon="document-text" 
                  date="2h ago" 
                />
                <RecentItem 
                  title="OS Important Questions" 
                  sub="Process Management & Deadlocks" 
                  icon="help-circle" 
                  date="5h ago" 
                />
                <RecentItem 
                  title="Maths PYQ 2024" 
                  sub="SEE Practice Paper Set A" 
                  icon="layers" 
                  date="Yesterday" 
                />
            </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  profilePic: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  studentCard: {
    borderRadius: 24,
    padding: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    marginBottom: 32,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  branchBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  branchText: {
    color: '#60a5fa',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  studentName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  studentDetails: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 8,
  },
  statusText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 32,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  viewMore: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  hubGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  actionItem: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  emptyContent: {
    height: 120,
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 12,
  },
  cardStats: {
    flexDirection: 'row',
    marginTop: 24,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  mainCta: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 18,
    marginBottom: 32,
    gap: 10,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  mainCtaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  insightSection: {
    marginBottom: 32,
    gap: 12,
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    gap: 15,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  insightIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fffbeb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightTextContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  insightDesc: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  recentList: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  recentIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentInfo: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  recentSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  recentDate: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  }
});
