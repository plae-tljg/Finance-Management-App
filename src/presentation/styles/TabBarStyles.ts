import { StyleSheet, ViewStyle, TextStyle, Platform } from 'react-native';

interface TabBarStyles {
  tabBar: ViewStyle;
  tabBarLabel: TextStyle;
  headerStyle: ViewStyle;
  headerTintColor: string;
  headerTitleStyle: TextStyle;
  activeTintColor: string;
  inactiveTintColor: string;
}

export const tabBarStyles: TabBarStyles = {
  tabBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    height: Platform.OS === 'android' ? 80 : 49,
    paddingBottom: Platform.OS === 'android' ? 20 : 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  tabBarLabel: {
    fontSize: 12,
    marginBottom: Platform.OS === 'android' ? 3 : 0,
  },
  headerStyle: {
    backgroundColor: '#f4511e',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerTintColor: '#fff',
  headerTitleStyle: {
    fontWeight: 'bold',
  },
  activeTintColor: '#f4511e',
  inactiveTintColor: 'gray',
}; 