import { View, Text, StyleSheet } from 'react-native';

export default function ToolsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Academic Tools 🛠️</Text>
      <Text style={styles.subtitle}>CGPA/SGPA Calculators & Calendar.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 8,
  }
});
