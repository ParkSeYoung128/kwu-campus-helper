import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { RootTabParamList } from '../types';
import { HomeScreen } from '../screens/HomeScreen';
import { CafeteriaScreen } from '../screens/CafeteriaScreen';
import { DDayScreen } from '../screens/DDayScreen';
import { MeetingScreen } from '../screens/MeetingScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator<RootTabParamList>();
const HomeStack = createNativeStackNavigator();
const CafeteriaStack = createNativeStackNavigator();
const DDayStack = createNativeStackNavigator();
const MeetingStack = createNativeStackNavigator();
const SettingsStack = createNativeStackNavigator();

// 각 탭에 대한 Stack Navigator
const HomeStackNavigator = () => {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
    </HomeStack.Navigator>
  );
};

const CafeteriaStackNavigator = () => {
  return (
    <CafeteriaStack.Navigator>
      <CafeteriaStack.Screen
        name="CafeteriaMain"
        component={CafeteriaScreen}
        options={{
          title: '학식 메뉴',
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTintColor: '#333',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
    </CafeteriaStack.Navigator>
  );
};

const DDayStackNavigator = () => {
  return (
    <DDayStack.Navigator>
      <DDayStack.Screen
        name="DDayMain"
        component={DDayScreen}
        options={{
          title: '과제/시험 D-day',
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTintColor: '#333',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
    </DDayStack.Navigator>
  );
};

const MeetingStackNavigator = () => {
  return (
    <MeetingStack.Navigator>
      <MeetingStack.Screen
        name="MeetingMain"
        component={MeetingScreen}
        options={{
          title: '회의 시간 조율',
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTintColor: '#333',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
    </MeetingStack.Navigator>
  );
};

const SettingsStackNavigator = () => {
  return (
    <SettingsStack.Navigator>
      <SettingsStack.Screen
        name="SettingsMain"
        component={SettingsScreen}
        options={{
          title: '설정',
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTintColor: '#333',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
    </SettingsStack.Navigator>
  );
};

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#999',
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#eee',
            paddingBottom: 4,
            paddingTop: 4,
            height: 60,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeStackNavigator}
          options={{
            tabBarLabel: '홈',
            tabBarIcon: ({ color, size }) => (
              <Text style={{ color, fontSize: size }}>🏠</Text>
            ),
          }}
        />
        <Tab.Screen
          name="Cafeteria"
          component={CafeteriaStackNavigator}
          options={{
            tabBarLabel: '학식',
            tabBarIcon: ({ color, size }) => (
              <Text style={{ color, fontSize: size }}>🍽️</Text>
            ),
          }}
        />
        <Tab.Screen
          name="DDay"
          component={DDayStackNavigator}
          options={{
            tabBarLabel: 'D-day',
            tabBarIcon: ({ color, size }) => (
              <Text style={{ color, fontSize: size }}>📅</Text>
            ),
          }}
        />
        <Tab.Screen
          name="Meeting"
          component={MeetingStackNavigator}
          options={{
            tabBarLabel: '회의',
            tabBarIcon: ({ color, size }) => (
              <Text style={{ color, fontSize: size }}>👥</Text>
            ),
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsStackNavigator}
          options={{
            tabBarLabel: '설정',
            tabBarIcon: ({ color, size }) => (
              <Text style={{ color, fontSize: size }}>⚙️</Text>
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};
