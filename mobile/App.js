import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import MainTabs from './screens/MainTabs';
import SplashScreen from './screens/SplashScreen';
import SubjectDetailsScreen from './screens/SubjectDetailsScreen';
import PdfViewerScreen from './screens/PdfViewerScreen';
import { StatusBar } from 'expo-status-bar';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator 
        initialRouteName="Splash"
        screenOptions={{ 
            headerShown: false,
            cardStyle: { backgroundColor: '#fff' }
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="SubjectDetails" component={SubjectDetailsScreen} />
        <Stack.Screen name="PdfViewer" component={PdfViewerScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
