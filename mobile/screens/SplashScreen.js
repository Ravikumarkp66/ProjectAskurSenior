import { View, Text } from 'react-native';
import { useEffect } from 'react';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    setTimeout(() => {
      navigation.replace('Main');
    }, 2000);
  }, []);

  return (
    <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#0f172a' }}>
      <Text style={{ color:'#fff', fontSize:24, fontWeight: 'bold' }}>AskUrSenior 🚀</Text>
    </View>
  );
}
