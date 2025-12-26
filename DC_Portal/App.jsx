import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import Routes from './src/Components/Routes/Routes';
import { enableScreens } from 'react-native-screens';

enableScreens();

const App = () => {
  return (
    <View style={styles.container}>
      <Routes />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
});

export default App;