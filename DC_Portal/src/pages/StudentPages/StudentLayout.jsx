import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Dashboard from "./Dashboard";
import History from "./History";
import ScheduledMeetings from "./ScheduledMeetings";
import Profile from '../StudentPages/Profile'
import { View } from "react-native";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';



const Tab = createBottomTabNavigator();

export default function StudentLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            switch (route.name) {
              case 'Dashboard':
                iconName = 'home';
                break;
              case 'History':
                iconName = 'history';
                break;
              case 'ScheduledMeetings':
                iconName = 'calendar-clock';
                break;
              case 'Profile':
                iconName = 'account';
                break;
              default:
                iconName = 'help';
            }

            return <Icon name={iconName} size={size} color={focused ? '#0066cc' : '#666666'} />;
          },
          tabBarActiveTintColor: 'blue',
          tabBarInactiveTintColor: 'gray',
          tabBarLabelStyle: { fontSize: 12, fontWeight: 'bold' },
          tabBarStyle: {
            paddingBottom: 15,
            height: 65,
            alignContent: 'flex-end',
            backgroundColor: 'white',
          },
        })}
      >
        <Tab.Screen name="Dashboard" component={Dashboard} />
        <Tab.Screen name="History" component={History} />
        <Tab.Screen name="ScheduledMeetings" component={ScheduledMeetings} />
        <Tab.Screen name="Profile" component={Profile} />
      </Tab.Navigator>
    </View>
  );
}




// import React from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';

// // Student Pages
// import Login from '../../pages/LoginPage/Login';
// import Dashboard from '../../pages/StudentPages/Dashboard';
// import History from '../../pages/StudentPages/History';
// import ScheduledMeetings from '../../pages/StudentPages/ScheduledMeetings';
// import StudentLayout from '../../pages/StudentPages/StudentLayout';

// const Stack = createNativeStackNavigator();

// const StudentRoutes = () => {
//   return (
//     <NavigationContainer>
//       <Stack.Navigator
//         initialRouteName="Login"
//         screenOptions={{ headerShown: false }}
//       >
//         {/* Login Page */}
//         <Stack.Screen name="Login" component={Login} />

//         {/* Student (wrapper for Dashboard , History , Scheduled Meetings , Student Layout) */}
//         <Stack.Screen name="StudentLayout" component={StudentLayout} />
//         <Stack.Screen name="Dashboard" component={Dashboard} />
//         <Stack.Screen name="History" component={History} />
//         <Stack.Screen name="ScheduledMeetings" component={ScheduledMeetings} />


//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// };

// export default StudentRoutes;

