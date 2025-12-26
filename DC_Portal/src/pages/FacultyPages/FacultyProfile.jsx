import React, { useEffect, useState, useCallback, memo, useRef } from "react";
import { useNavigation } from "@react-navigation/native";
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  Alert,
  StatusBar,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated,
} from "react-native";
import axios from "axios";
import { API_URL } from "../../utils/env";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";




const FacultyProfile =()=>{
    <View style={{ flex: 1, padding: 16 }}>
        <Text style={{ flexWrap: 'wrap' }}>
            profile
        </Text>
    </View>
}


export default FacultyProfile