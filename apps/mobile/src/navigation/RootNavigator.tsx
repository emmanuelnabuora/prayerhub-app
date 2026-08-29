import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import PrayScreen from '../screens/PrayScreen';
import LiveScreen from '../screens/LiveScreen';
import RoomScreen from '../screens/RoomScreen';
import CommunityScreen from '../screens/CommunityScreen';
import GroupDetailScreen from '../screens/GroupDetailScreen';
import OrganizationsScreen from '../screens/OrganizationsScreen';
import OrganizationDetailScreen from '../screens/OrganizationDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import JournalScreen from '../screens/JournalScreen';
import ConversationsScreen from '../screens/ConversationsScreen';
import ChatScreen from '../screens/ChatScreen';
import BibleReaderScreen from '../screens/BibleReaderScreen';
import FeedScreen from '../screens/FeedScreen';
import TestimoniesScreen from '../screens/TestimoniesScreen';
import SearchScreen from '../screens/SearchScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import AssistantScreen from '../screens/AssistantScreen';
import { theme, colors } from '../theme';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();
const ProfileStack = createNativeStackNavigator();
const LiveStack = createNativeStackNavigator();
const CommunityStack = createNativeStackNavigator();
const PrayStack = createNativeStackNavigator();
const HomeStack = createNativeStackNavigator();

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} />
      <ProfileStack.Screen name="Journal" component={JournalScreen} />
      <ProfileStack.Screen name="Conversations" component={ConversationsScreen} />
      <ProfileStack.Screen name="Chat" component={ChatScreen} />
    </ProfileStack.Navigator>
  );
}

// Live is a stack so tapping a room pushes into the full-screen RoomScreen
// (dark, audio-focused UI) without the tab bar competing for space.
function LiveStackNavigator() {
  return (
    <LiveStack.Navigator screenOptions={{ headerShown: false }}>
      <LiveStack.Screen name="LiveHome" component={LiveScreen} />
      <LiveStack.Screen name="Room" component={RoomScreen} />
    </LiveStack.Navigator>
  );
}

// Community is a stack so tapping a group pushes into its detail view (members,
// recurring schedule, group-scoped prayer requests).
function CommunityStackNavigator() {
  return (
    <CommunityStack.Navigator screenOptions={{ headerShown: false }}>
      <CommunityStack.Screen name="CommunityHome" component={CommunityScreen} />
      <CommunityStack.Screen name="GroupDetail" component={GroupDetailScreen} />
      <CommunityStack.Screen name="Organizations" component={OrganizationsScreen} />
      <CommunityStack.Screen name="OrganizationDetail" component={OrganizationDetailScreen} />
    </CommunityStack.Navigator>
  );
}

// Pray hosts the BibleReader too — <ScriptureLink> taps and the Home daily-verse
// card both land here, since Scripture and prayer are the two content types most
// often cross-referenced against each other.
function PrayStackNavigator() {
  return (
    <PrayStack.Navigator screenOptions={{ headerShown: false }}>
      <PrayStack.Screen name="PrayHome" component={PrayScreen} />
      <PrayStack.Screen name="BibleReader" component={BibleReaderScreen} />
    </PrayStack.Navigator>
  );
}

// Home is the social hub: the dashboard itself, plus the community Feed,
// Testimonies, discovery Search, and other users' profiles — the content types
// from the master plan's "Social" phase that don't have their own tab.
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeDashboard" component={HomeScreen} />
      <HomeStack.Screen name="Feed" component={FeedScreen} />
      <HomeStack.Screen name="Testimonies" component={TestimoniesScreen} />
      <HomeStack.Screen name="Search" component={SearchScreen} />
      <HomeStack.Screen name="UserProfile" component={UserProfileScreen} />
      <HomeStack.Screen name="BibleReader" component={BibleReaderScreen} />
      <HomeStack.Screen name="Chat" component={ChatScreen} />
      <HomeStack.Screen name="Assistant" component={AssistantScreen} />
    </HomeStack.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.flame,
          tabBarInactiveTintColor: colors.mutedText,
          tabBarStyle: {
            backgroundColor: colors.parchment,
            borderTopColor: colors.divider,
          },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeStackNavigator}
          options={{ tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} /> }}
        />
        <Tab.Screen
          name="Pray"
          component={PrayStackNavigator}
          options={{ tabBarIcon: ({ color, size }) => <Ionicons name="hand-left-outline" color={color} size={size} /> }}
        />
        <Tab.Screen
          name="Live"
          component={LiveStackNavigator}
          options={{ tabBarIcon: ({ color, size }) => <Ionicons name="radio-outline" color={color} size={size} /> }}
        />
        <Tab.Screen
          name="Community"
          component={CommunityStackNavigator}
          options={{ tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" color={color} size={size} /> }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileStackNavigator}
          options={{ tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} /> }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
