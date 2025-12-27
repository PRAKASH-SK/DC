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

const LoadingView = () => (
  <SafeAreaView style={styles.container}>
    <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
    <ActivityIndicator size="large" color="#ff4444" style={{ marginTop: 40 }} />
  </SafeAreaView>
);

const ErrorView = ({ message }) => (
  <SafeAreaView style={styles.container}>
    <Text style={[styles.noComplaintsText, { marginTop: 40 }]}>{message}</Text>
  </SafeAreaView>
);

const Profile = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [counts, setCounts] = useState({
    accepted_count: 0,
    rejected_count: 0,
    resolved_count: 0,
    pending_count: 0,
  });

  // Animated flip state
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [flip, setFlip] = useState(false);
  let value = 0;
  animatedValue.addListener(({ value: val }) => (value = val));

  const frontInterpolate = animatedValue.interpolate({
    inputRange: [0, 180],
    outputRange: ["0deg", "180deg"],
  });
  const backInterpolate = animatedValue.interpolate({
    inputRange: [0, 180],
    outputRange: ["180deg", "360deg"],
  });

  // Trigger flip animation
  const flipCard = () => {
    if (value >= 90) {
      Animated.spring(animatedValue, {
        toValue: 0,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start();
      setFlip(false);
    } else {
      Animated.spring(animatedValue, {
        toValue: 180,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start();
      setFlip(true);
    }
  };

  // Fetch profile data
  const fetchProfileData = useCallback(async () => {
    try {
      setLoading(true);
      const storedId = await AsyncStorage.getItem("user_id");

      if (!storedId) {
        Alert.alert("Session Expired", "Please login again to continue.");
        navigation.replace("Login");
        return;
      }

      const res = await axios.get(
        `${API_URL}/api/faculty/profile/${Number(storedId)}`
      );

      if (res.data.success) {
        setProfile(res.data.user);
        setCounts(res.data.counts);
      } else {
        Alert.alert("Error", res.data.message || "Failed to load profile data");
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
      Alert.alert(
        "Connection Error",
        "Unable to load profile. Please check your internet connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }, [navigation]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  if (loading) {
    return <LoadingView />;
  }

  if (!profile) {
    return <ErrorView message="No profile data found" />;
  }

  const totalCount =
    Number(counts.accepted_count || 0) +
    Number(counts.rejected_count || 0) +
    Number(counts.resolved_count || 0) +
    Number(counts.pending_count || 0);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#4285f4" />
      <View style={styles.flipContainer}>
        <TouchableWithoutFeedback onPress={flipCard}>
          <View>
            {/* Front Side */}
            <Animated.View
              style={[
                styles.flipCard,
                {
                  transform: [{ rotateY: frontInterpolate }],
                },
              ]}
            >
              
              <View style={styles.idCardContainer}>
          <View style={styles.idCardinner}>
          <View style={styles.idCard}>
            {/* College Header */}
            <View style={styles.collegeHeader}>
              <View style={styles.collegeLogoContainer}>
                {/* Empty logo container - you can add your logo image here */}
                <View style={styles.logoPlaceholder}>
                  {/* Replace this View with your college logo Image component */}
                  <Image
                    source={require("../../assets/Bit_logo.png")} // Add your college logo here
                    style={styles.collegeLogo}
                    resizeMode="contain"
                  />
                </View>
              </View>
              <View style={styles.collegeTextContainer}>
                <Text style={styles.collegeName}>Bannari Amman Institute of Technology</Text>
                <Text style={styles.collegeLocation}>Sathyamangalam, Erode</Text>
              </View>
            </View>

            {/* Student Profile Section */}
            <View style={styles.profileSection}>
              <View style={styles.profileImageContainer}>
                <Image
                  source={require("../../assets/profile.jpeg")}
                  style={styles.profileImage}
                />
              </View>
              <Text style={styles.studentName}>{profile.name.toUpperCase()}</Text>
              <Text style={styles.email}>{profile.emailid}</Text>
            </View>
          </View>
          </View>
        </View>
              <View style={styles.idContainer}>
                <Text style={styles.sectionTitle}>Faculty Details</Text>
                <View style={styles.detailsContent}>
                  <DetailRow label="Name" value={profile.name} />
                  <DetailRow label="Email" value={profile.emailid} />
                  <DetailRow label="Department" value={profile.department} />
                </View>
              </View>
            </Animated.View>

            {/* Back Side */}
            <Animated.View
              style={[
                styles.flipCard,
                styles.flipCardBack,
                {
                  transform: [{ rotateY: backInterpolate }],
                },
              ]}
            >
              <View style={styles.idCardContainer}>
          <View style={styles.idCardinner}>
          <View style={styles.idCard}>
            {/* College Header */}
            <View style={styles.collegeHeader}>
              <View style={styles.collegeLogoContainer}>
                {/* Empty logo container - you can add your logo image here */}
                <View style={styles.logoPlaceholder}>
                  {/* Replace this View with your college logo Image component */}
                  <Image
                    source={require("../../assets/Bit_logo.png")} // Add your college logo here
                    style={styles.collegeLogo}
                    resizeMode="contain"
                  />
                </View>
              </View>
              <View style={styles.collegeTextContainer}>
                <Text style={styles.collegeName}>Bannari Amman Institute of Technology</Text>
                <Text style={styles.collegeLocation}>Sathyamangalam, Erode</Text>
              </View>
            </View>

            {/* Student Profile Section */}
            <View style={styles.profileSection}>
              <View style={styles.profileImageContainer}>
                <Image
                  source={require("../../assets/profile.jpeg")}
                  style={styles.profileImage}
                />
              </View>
              <Text style={styles.studentName}>{profile.name.toUpperCase()}</Text>
              <Text style={styles.email}>{profile.emailid}</Text>
            </View>
          </View>
          </View>
        </View>
              <View style={styles.idContainer}>
                <Text style={styles.sectionTitle}>Complaints Marked</Text>
                {totalCount === 0 ? (
                  <View style={styles.noComplaintsContainer}>
                    <Image
                      source={require("../../assets/No Schedules.png")}
                      style={styles.noComplaintsImage}
                    />
                    <Text style={styles.noComplaintsText}>
                      No complaints registered
                    </Text>
                    <Text style={styles.noComplaintsSubText}>
                      Keep maintaining good discipline!
                    </Text>
                  </View>
                ) : (
                  <View style={styles.statsContainer}>
                    <View style={styles.countRow}>
                      <CountCard
                        label="Accepted"
                        value={counts.accepted_count}
                        color="#28a745"
                      />
                      <CountCard
                        label="Rejected"
                        value={counts.rejected_count}
                        color="#dc3545"
                      />
                      <CountCard
                        label="Resolved"
                        value={counts.resolved_count}
                        color="#17a2b8"
                      />
                      <CountCard
                        label="Pending"
                        value={counts.pending_count}
                        color="#ffc107"
                      />
                    </View>
                    <View style={styles.totalContainer}>
                      <Text style={styles.totalLabel}>Total Complaints</Text>
                      <Text style={styles.totalValue}>{totalCount}</Text>
                    </View>
                  </View>
                )}
              </View>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </SafeAreaView>
  );
};

const DetailRow = memo(({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value || "-"}</Text>
  </View>
));

const CountCard = memo(({ label, value, color }) => (
  <View style={[styles.countCard, { borderColor: color }]}>
    <Text style={[styles.countValue, { color }]}>{value || 0}</Text>
    <Text style={styles.countLabel}>{label}</Text>
  </View>
));

DetailRow.displayName = "DetailRow";
CountCard.displayName = "CountCard";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
 flipContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    marginTop: 20,
  },
  flipCard: {
    width: 360,          // Increase width here as per your requirement
    alignSelf: "center", // Center horizontally
    backfaceVisibility: "hidden",
    minHeight: 300,
    borderRadius: 15,
    backgroundColor: "#ffffff",
    elevation: 2,
    // Ensure minimum height so front/back have equal height
  },
  flipCardBack: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 360,          // Must match front width exactly
    alignSelf: "center",
    minHeight: 300,      // Same height as front
  },
  idContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 15,
    padding: 20,
    // elevation: 2,
    // marginHorizontal: 4,
  },
  // Virtual ID Card Styles
  idCardContainer: {
    // paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 20,
    // backgroundColor: '#f442a4ff',
  },
  idCardinner: {
    backgroundColor: '#9bc4fdff',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    borderBottomLeftRadius: 90,
    borderBottomRightRadius: 90,
    overflow: 'hidden',
    // elevation: 8,
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 4,
    // },
    // shadowOpacity: 0,
    // shadowRadius: 6,
    paddingBottom: 15
    
  },
  idCard: {
    backgroundColor: '#2073f7ff',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    borderBottomLeftRadius: 90,
    borderBottomRightRadius: 90,
    overflow: 'hidden',
    elevation: 8,
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 4,
    // },
    // shadowOpacity: 0,
    // shadowRadius: 6,
  },
  collegeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  collegeLogoContainer: {
    marginRight: 15,
  },
  logoPlaceholder: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  collegeLogo: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
  },
  collegeTextContainer: {
    flex: 1,
  },
  collegeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  collegeLocation: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 10,
  },
  profileImageContainer: {
    marginBottom: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  studentName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 5,
    textAlign: 'center',
  },
  email: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4285f4",
    marginBottom: 16,
  },
  detailsContent: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4a4a4a",
  },
  detailValue: {
    fontSize: 15,
    color: "#666666",
    fontWeight: "500",
  },
  statsContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 13,
  },
  noComplaintsContainer: {
    alignItems: "center",
    padding: 1,
  },
  noComplaintsImage: {
    width: 150,
    height: 150,
    marginBottom: 16,
    opacity: 0.9,
  },
  noComplaintsText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4a4a4a",
    marginBottom: 4,
  },
  noComplaintsSubText: {
    fontSize: 14,
    color: "#666666",
  },
  countRow: {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-between",
  marginBottom: 10,
},

  countCard: {
  width: "48%",          // 👈 two cards per row
  backgroundColor: "#ffffff",
  borderRadius: 12,
  borderWidth: 2,
  height: 60,
  marginBottom: 8,
  justifyContent: "center",
  alignItems: "center",
  elevation: 1,
},

  countValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 0,
  },
  countLabel: {
    fontSize: 13,
    color: "#4a4a4a",
    fontWeight: "500",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    elevation: 1,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4a4a4a",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4285f4",
  },
});

export default Profile;
