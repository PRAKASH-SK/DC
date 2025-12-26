import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'react-native';

// Student Pages
import Login from '../../pages/LoginPage/Login.jsx'

import Dashboard from '../../pages/StudentPages/Dashboard';
import History from '../../pages/StudentPages/History';
import ScheduledMeetings from '../../pages/StudentPages/ScheduledMeetings';
import StudentLayout from '../../pages/StudentPages/StudentLayout';
import StudentMeetingDetails from '../../pages/StudentPages/StudentMeetingDetails';
import Profile from '../../pages/StudentPages/Profile.jsx';

import FacultyLayout from '../../pages/FacultyPages/FacultyLayout';
import FacultyDashboard from '../../pages/FacultyPages/FacultyDashboard';
import FacultyHistory from '../../pages/FacultyPages/FacultyHistory';
import FacultyScheduledMeetings from '../../pages/FacultyPages/FacultySheduledMeetings';
import FacultyProfile from '../../pages/FacultyPages/FacultyProfile.jsx';
import FacultyMeetingDetails from '../../pages/FacultyPages/FacultyMeetingDetails.jsx';
import ComplaintForm from '../../pages/FacultyPages/ComplaintForm.jsx';

import AdminLayout from '../../pages/AdminPages/AdminLayout';
import AdminDashboard from '../../pages/AdminPages/AdminDashboard.jsx';
import AdminHistory from '../../pages/AdminPages/AdminHistory.jsx';
import AdminScheduledMeetings from '../../pages/AdminPages/AdminSheduledMeetings.jsx';
import AdminScheduledMeetingForm from '../../pages/AdminPages/AdminSheduledMeetingForm.jsx';
import ComplaintDetails from '../../pages/AdminPages/ComplaintDetails.jsx';
import RejectedComplaints from '../../pages/AdminPages/RejectedComplaints.jsx';
import MeetingDetails from '../../pages/AdminPages/MeetingDetails.jsx';

import { SafeAreaView } from 'react-native-safe-area-context';

const Stack = createNativeStackNavigator();

// Higher-order component to conditionally wrap with SafeAreaView
const SafeAreaWrapper = ({ children, routeName }) => {
  // Only Login page should not have SafeAreaView
  if (routeName === 'Login') {
    return children;
  }
  else if(routeName === 'ComplaintForm'){
    return children;
  }
  else if(routeName === 'ComplaintDetails'){
    return children;
  }
  else if(routeName === 'AdminScheduledMeetingForm'){
    return children;
  }
  else if(routeName === 'AdminDashboard'){
    return children;
  }
  else if(routeName === 'MeetingDetails'){
    return children;
  }
  else if(routeName === 'StudentMeetingDetails'){
    return children;
  }
  else if(routeName === 'FacultyMeetingDetails'){
    return children;
  }


  // All other pages get SafeAreaView
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffffff'}}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      {children}
    </SafeAreaView>
  );
};

const Routes = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false }}
      >
        {/* Login Page - No SafeAreaView */}
        <Stack.Screen name="Login">
          {(props) => (
            <SafeAreaWrapper routeName="Login">
              <Login {...props} />
            </SafeAreaWrapper>
          )}
        </Stack.Screen>

        {/* Student Pages - With SafeAreaView */}
        <Stack.Screen name="StudentLayout">
          {(props) => (
            <SafeAreaWrapper routeName="StudentLayout">
              <StudentLayout {...props} />
            </SafeAreaWrapper>
          )}
        </Stack.Screen>
        <Stack.Screen name="Dashboard">
          {(props) => (
            <SafeAreaWrapper routeName="Dashboard">
              <Dashboard {...props} />
            </SafeAreaWrapper>
          )}
        </Stack.Screen>
        <Stack.Screen name="History">
          {(props) => (
            <SafeAreaWrapper routeName="History">
              <History {...props} />
            </SafeAreaWrapper>
          )}
        </Stack.Screen>

        <Stack.Screen name="ScheduledMeetings">
          {(props) => (
            <SafeAreaWrapper routeName="ScheduledMeetings">
              <ScheduledMeetings {...props} />
            </SafeAreaWrapper>
          )}
        </Stack.Screen>

         <Stack.Screen name="StudentMeetingDetails">
          {(props) => (
            <SafeAreaWrapper routeName="StudentMeetingDetails">
              <StudentMeetingDetails {...props} />
            </SafeAreaWrapper>
          )}
        </Stack.Screen>
        
        <Stack.Screen name="Profile">
          {(props) => (
            <SafeAreaWrapper routeName="Profile">
              <Profile {...props} />
            </SafeAreaWrapper>
          )}
        </Stack.Screen>

        {/* Faculty Pages - With SafeAreaView */}
        <Stack.Screen name="FacultyLayout">
          {(props) => (
            <SafeAreaWrapper routeName="FacultyLayout">
              <FacultyLayout {...props} />
            </SafeAreaWrapper>
          )}
        </Stack.Screen>
        <Stack.Screen name="FacultyDashboard">
          {(props) => (
            <SafeAreaWrapper routeName="FacultyDashboard">
              <FacultyDashboard {...props} />
            </SafeAreaWrapper>
          )}
        </Stack.Screen>
        <Stack.Screen name="FacultyHistory">
          {(props) => (
            <SafeAreaWrapper routeName="FacultyHistory">
              <FacultyHistory {...props} />
            </SafeAreaWrapper>
          )}
        </Stack.Screen>
        <Stack.Screen name="FacultyScheduledMeetings">
          {(props) => (
            <SafeAreaWrapper routeName="FacultyScheduledMeetings">
              <FacultyScheduledMeetings {...props} />
            </SafeAreaWrapper>
          )}
        </Stack.Screen>
        <Stack.Screen name="FacultyMeetingDetails">
          {(props) => (
            <SafeAreaWrapper routeName="FacultyMeetingDetails">
              <FacultyMeetingDetails {...props} />
            </SafeAreaWrapper>
          )}
        </Stack.Screen>
        <Stack.Screen name="FacultyProfile">
          {(props) => (
            <SafeAreaWrapper routeName="FacultyProfile">
              <FacultyProfile {...props} />
            </SafeAreaWrapper>
          )}
        </Stack.Screen>
        <Stack.Screen name="ComplaintForm">
          {(props) => (
            <SafeAreaWrapper routeName="ComplaintForm">
              <ComplaintForm {...props} />
            </SafeAreaWrapper>
          )}
        </Stack.Screen>

        {/* Admin Pages - With SafeAreaView */}
        <Stack.Screen name="AdminLayout">
          {(props) => (
            <SafeAreaWrapper routeName="AdminLayout">
              <AdminLayout {...props} />
            </SafeAreaWrapper>
          )}
        </Stack.Screen>
        <Stack.Screen name="AdminDashboard">
          {(props) => (
            <SafeAreaWrapper routeName="AdminDashboard">
              <AdminDashboard {...props} />
            </SafeAreaWrapper>
          )}
        </Stack.Screen>
        <Stack.Screen name="AdminHistory">
          {(props) => (
            <SafeAreaWrapper routeName="AdminHistory">
              <AdminHistory {...props} />
            </SafeAreaWrapper>
          )}
        </Stack.Screen>

        <Stack.Screen name="RejectedComplaints">
          {(props) => (
            <SafeAreaWrapper routeName="RejectedComplaints">
              <RejectedComplaints {...props} />
            </SafeAreaWrapper>
          )}
        </Stack.Screen>
        
        <Stack.Screen name="AdminScheduledMeetingForm">
          {(props) => (
            <SafeAreaWrapper routeName="AdminScheduledMeetingForm">
              <AdminScheduledMeetingForm {...props} />
            </SafeAreaWrapper>
          )}
        </Stack.Screen>
        <Stack.Screen name="AdminScheduledMeetings">
          {(props) => (
            <SafeAreaWrapper routeName="AdminScheduledMeetings">
              <AdminScheduledMeetings {...props} />
            </SafeAreaWrapper>
          )}
        </Stack.Screen>
        <Stack.Screen name="MeetingDetails">
          {(props) => (
            <SafeAreaWrapper routeName="MeetingDetails">
              <MeetingDetails {...props} />
            </SafeAreaWrapper>
          )}
        </Stack.Screen>
         <Stack.Screen name="ComplaintDetails">
          {(props) => (
            <SafeAreaWrapper routeName="ComplaintDetails">
              <ComplaintDetails {...props} />
            </SafeAreaWrapper>
          )}
        </Stack.Screen>

      </Stack.Navigator>
      
    </NavigationContainer>
  ); 
};

export default Routes;