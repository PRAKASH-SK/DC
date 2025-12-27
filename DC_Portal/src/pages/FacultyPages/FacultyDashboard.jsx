import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Image,
  RefreshControl,
} from "react-native";
import axios from "axios";
import { API_URL } from '../../utils/env'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from 'react-native-vector-icons/Ionicons';
import moment from 'moment';
const FacultyDashboard = () => {
  const navigation = useNavigation()
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvingComplaint, setResolvingComplaint] = useState(null); // Track which complaint is being resolved

  const [reason, setReason] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [facultyId, setFacultyId] = useState(null);
  const [facultyName, setFacultyName] = useState(null);

  const [refreshing, setRefreshing] = useState(false);
  
  // Add search related states
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchText, setSearchText] = useState("");

  // Toggle search visibility and reset search text when closing
  const toggleSearch = () => {
    if (searchVisible) {
      setSearchText("");
    }
    setSearchVisible(!searchVisible);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUserIdAndComplaints();
  };

  const fetchUserIdAndComplaints = async () => {
    try {
      const storedId = await AsyncStorage.getItem('user_id');
      const storename = await AsyncStorage.getItem('user_name');
      if (! storedId) {
        navigation.navigate('Login');
        return;
      }
      setFacultyId(storedId);
      setFacultyName(storename);

      const res = await axios.get(`${API_URL}/api/faculty/get_complaints/${Number(storedId)}`);
      if (res.data.success) {
        const sixHoursInMs = 6 * 60 * 60 * 1000;
        const data = res.data.data. map((c) => {
          const complaintTime = new Date(c. date_time).getTime();
          const elapsedMs = Date.now() - complaintTime;
          const remainingMs = sixHoursInMs - elapsedMs;
          const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));
          return {
            id: c.complaint_id,
            date:  c.complaint_date,
            time: c.complaint_time,
            code: c.complaint_id,
            venue: c.venue,
            status: c.status?. toLowerCase(),
            details: c.complaint,
            student_name: c. student_name,
            student_reg_num: c.student_reg_num,
            student_emailid: c.student_emailid,
            timer:  remainingSeconds,
            isActive: remainingSeconds > 0,
            isVisible: remainingSeconds > 0 || c.status?. toLowerCase() === 'resolved', // Show resolved complaints
          };
        });
        setComplaints(data);
      } else {
        setComplaints([]);
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to fetch complaints");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchUserIdAndComplaints();
  }, [facultyId]);

  // Add focus effect to refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (facultyId) {
        fetchUserIdAndComplaints();
      }
    }, [facultyId])
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setComplaints((prevComplaints) =>
        prevComplaints.map((complaint) => {
          // Don't update timer for resolved complaints
          if (complaint.status === 'resolved') {
            return complaint;
          }
          
          const newTimer = Math.max(0, complaint.timer - 1);
          const shouldBeVisible = newTimer > 0;
          
          return {
            ... complaint,
            timer: newTimer,
            isActive: newTimer > 0,
            isVisible: shouldBeVisible,
          };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [complaints]);

  // Handle resolve complaint
  const handleResolveComplaint = async (complaintId) => {
    Alert.alert(
      'Resolve Complaint',
      'Are you sure you want to mark this complaint as resolved?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Resolve',
          onPress: async () => {
            setResolvingComplaint(complaintId);
            try {
              const response = await axios.post(
                `${API_URL}/api/faculty/resolve_complaint/${complaintId}`
              );

              if (response.data.success) {
                // Update local state
                setComplaints(prevComplaints =>
                  prevComplaints.map(c =>
                    c.id === complaintId
                      ? { ...c, status: 'resolved', isActive:  false }
                      : c
                  )
                );
                Alert.alert('Success', 'Complaint marked as resolved');
              } else {
                Alert.alert('Error', response.data.message || 'Failed to resolve complaint');
              }
            } catch (error) {
              console.error('Resolve error:', error);
              Alert.alert(
                'Error',
                error.response?.data?.message || 'Failed to resolve complaint.  Please try again.'
              );
            } finally {
              setResolvingComplaint(null);
            }
          }
        }
      ]
    );
  };

  // Add highlight helper function
  const highlightText = (text, searchText) => {
    if (!searchText) return <Text>{text}</Text>;
    const string = text?. toString() ??  '';
    const lowerText = string.toLowerCase();
    const lowerSearch = searchText.toLowerCase();
    const index = lowerText.indexOf(lowerSearch);

    if (index === -1) return <Text>{text}</Text>;

    const before = string.slice(0, index);
    const match = string.slice(index, index + searchText.length);
    const after = string.slice(index + searchText.length);

    return (
      <Text>
        {before}
        <Text style={{ backgroundColor: '#fff176', color: '#000' }}>{match}</Text>
        {after}
      </Text>
    );
  };

  
  // Filter complaints based on search text
// ✅ UPDATED: Filter and sort complaints (Pending first)
const filteredComplaints = complaints
  .filter((c) => {
    if (!searchText) return true;
    if (!c. isVisible) return false;
    
    const s = searchText. toLowerCase();
    const dateStr = c.date ? c.date. toLowerCase() : '';
    const timeStr = moment(c.time, 'HH:mm:ss').format('hh:mm:ss A').toLowerCase();

    return (
      c.student_name?.toLowerCase().includes(s) ||
      c.student_reg_num?.toLowerCase().includes(s) ||
      c.details?.toLowerCase().includes(s) ||
      c.venue?.toLowerCase().includes(s) ||
      c.status?.toLowerCase().includes(s) ||
      c.code?.toString().toLowerCase().includes(s) ||
      dateStr.includes(s) ||
      timeStr.includes(s)
    );
  })
  // ✅ Sort:  Pending first, then others (accepted, rejected, resolved)
  .sort((a, b) => {
    // Define status priority:  pending = 0, others = 1
    const getPriority = (status) => {
      if (status === 'pending') return 0;
      if (status === 'accepted') return 1;
      if (status === 'rejected') return 2;
      if (status === 'resolved') return 3;
      return 4;
    };

    const priorityA = getPriority(a.status);
    const priorityB = getPriority(b.status);

    // Sort by priority first
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // If same priority, sort by timer (for pending complaints)
    // Show complaints with more time remaining first
    if (a.status === 'pending' && b. status === 'pending') {
      return b.timer - a.timer;
    }

    // For other statuses, maintain original order
    return 0;
  });

  const renderComplaintCard = (complaint) => {
    // Don't render if not visible
    if (!complaint.isVisible) {
      return null;
    }

    const isResolving = resolvingComplaint === complaint.id;

    // Add status badge style based on status
    let badgeStyle = styles.pendingBadge;
    let textStyle = styles.pendingText;
    
    if (complaint.status === 'accepted') {
      badgeStyle = styles.acceptedBadge;
      textStyle = styles.acceptedText;
    } else if (complaint.status === 'rejected') {
      badgeStyle = styles.rejectedBadge;
      textStyle = styles.rejectedText;
    } else if (complaint.status === 'resolved') {
      badgeStyle = styles.resolvedBadge;
      textStyle = styles.resolvedText;
    }
    
    // Format time to include AM/PM
    const timeFormatted = moment(complaint.time, 'HH:mm: ss').format('hh:mm:ss A');

    return (
      <View key={complaint.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.codeText}>
            {highlightText(complaint.code, searchText)}
          </Text>
          <View style={[styles.statusBadge, badgeStyle]}>
            <Text style={[styles. statusText, textStyle]}>
              {highlightText(complaint.status, searchText)}
            </Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.complaintRow}>
            <Text style={styles.label}>Student Name:</Text>
            <Text style={styles.valueText}>
              {highlightText(
                complaint.student_name
                  ? complaint.student_name.charAt(0).toUpperCase() + complaint.student_name. slice(1).toLowerCase()
                  : '',
                searchText
              )}
            </Text>
          </View>

          <View style={styles. complaintRow}>
            <Text style={styles.label}>Register Number:</Text>
            <Text style={styles.valueText}>
              {highlightText(complaint.student_reg_num, searchText)}
            </Text>
          </View>

          <View style={styles.complaintRow}>
            <Text style={styles. label}>Complaint Details:</Text>
            <Text style={styles.valueText}>
              {highlightText(complaint. details, searchText)}
            </Text>
          </View>

          <View style={styles.complaintRow}>
            <Text style={styles.label}>Venue:</Text>
            <Text style={styles.valueText}>
              {highlightText(complaint.venue, searchText)}
            </Text>
          </View>

          <View style={styles.complaintRow}>
            <Text style={styles.label}>Complaint Date:</Text>
            <Text style={styles.valueText}>
              {highlightText(complaint.date, searchText)}
            </Text>
            <Text style={styles.valueText}>
              {highlightText(timeFormatted, searchText)}
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            {complaint.status === 'pending' ?  (
              <>
                <TouchableOpacity
                  style={[
                    styles.editbutton,
                    !complaint.isActive && styles.disabledButton
                  ]}
                  disabled={!complaint.isActive}
                  onPress={() => {
                    if (complaint.isActive) {
                      navigation.navigate('ComplaintForm', { 
                        complaintId: complaint.id 
                      });
                    }
                  }}
                >
                  <Ionicons name="create-outline" size={18} color="#fff" />
                  <Text style={styles.editbuttonText}>EDIT</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.revokeButton,
                    (! complaint.isActive || isResolving) && styles.disabledButton
                  ]}
                  disabled={!complaint. isActive || isResolving}
                  onPress={() => handleResolveComplaint(complaint. id)}
                >
                  {isResolving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-done-outline" size={18} color="#fff" />
                      <Text style={styles.revokeButtonText}>RESOLVE</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            ) : complaint.status === 'accepted' ? (
              <View style={styles.statusMessageContainer}>
                <Ionicons name="checkmark-circle" size={20} color="#2b9348" />
                <Text style={[styles.statusMessage, styles.acceptedMessage]}>
                  He/She already accepted this complaint
                </Text>
              </View>
            ) : complaint.status === 'rejected' ? (
              <View style={styles.statusMessageContainer}>
                <Ionicons name="close-circle" size={20} color="#e63946" />
                <Text style={[styles.statusMessage, styles.rejectedMessage]}>
                  He/She already rejected this complaint. Wait for enquiry meeting. 
                </Text>
              </View>
            ) : complaint.status === 'resolved' ? (
              <View style={styles. statusMessageContainer}>
                <Ionicons name="checkmark-done-circle" size={20} color="#6366f1" />
                <Text style={[styles.statusMessage, styles.resolvedMessage]}>
                  This complaint has been resolved
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  // Filter visible complaints for display logic
  const visibleComplaints = searchText ?  filteredComplaints : complaints
  .filter(complaint => complaint.isVisible)
  .sort((a, b) => {
    const getPriority = (status) => {
      if (status === 'pending') return 0;
      if (status === 'accepted') return 1;
      if (status === 'rejected') return 2;
      if (status === 'resolved') return 3;
      return 4;
    };

    const priorityA = getPriority(a.status);
    const priorityB = getPriority(b.status);

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    if (a.status === 'pending' && b.status === 'pending') {
      return b.timer - a.timer;
    }

    return 0;
  });

  return (
    <View style={styles.container} edges={['right', 'bottom', 'left']}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.welcomeContainer}>
        <Image
          source={require("../../assets/profile.jpeg")}
          style={styles.profileImage}
        />
        <View style={styles.welcomeTextContainer}>
          <Text style={styles.welcomeText}>Welcome, {facultyName}</Text>
          <Text style={{ color: '#6c757d', fontSize: 14 }}>Your Complaint Dashboard</Text>
        </View>
        <TouchableOpacity 
          style={styles.searchIconContainer}
          onPress={toggleSearch}
        >
          <Ionicons 
            name={searchVisible ? "close-outline" : "search-outline"} 
            size={24} 
            color="#6366f1" 
          />
        </TouchableOpacity>
      </View>
      
      {searchVisible && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search complaints..."
            value={searchText}
            onChangeText={setSearchText}
            autoFocus={true}
          />
        </View>
      )}

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems:  'center' }}>
          <ActivityIndicator size="large" color="#e63946" />
          <Text style={{ marginTop: 12, color: '#6c757d', fontSize: 14 }}>Loading complaints...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing}  
              onRefresh={handleRefresh}
              colors={['#e63946']}
              tintColor="#e63946"
            />
          }
        >
          <View style={styles.complaintsContainer}>
            {visibleComplaints.length > 0 ? (
              visibleComplaints.map(renderComplaintCard).filter(card => card !== null)
            ) : (
              <View style={{
                alignItems: 'center',
                marginTop: 40,
                backgroundColor: '#fff',
                padding: 20,
                borderRadius: 12,
                elevation: 2
              }}>
                <Ionicons name="document-text-outline" size={64} color="#d1d5db" />
                <Text style={{
                  textAlign: "center",
                  fontSize: 16,
                  color: "#6c757d",
                  marginTop: 16,
                  marginBottom: 8,
                  fontWeight: '500'
                }}>
                  {searchText 
                    ? "No complaints match your search criteria" 
                    : "You haven't booked any complaints at this moment."}
                </Text>
                {! searchText && (
                  <Text style={{
                    textAlign: "center",
                    fontSize: 14,
                    color: "#9ca3af"
                  }}>
                    Tap the + button to create a new complaint
                  </Text>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('ComplaintForm')}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa"
  },
 welcomeContainer: {
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: 20,
  paddingTop: 20,  // Changed from 8
  paddingBottom: 16, // Added for consistency
  backgroundColor: "#fff",
  borderBottomWidth: 1,
  borderBottomColor: "#e9ecef",
  elevation: 2,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity:  0.05,
  shadowRadius: 4,
},
welcomeText: {
  fontSize:  24,  // Changed from 20 for consistency
  fontWeight: "600",  // Changed from 700
  color: "#6366f1",  // Changed to purple
  marginBottom: 0  // Changed from 4
},
searchIconContainer: {
  padding: 8,
  borderRadius: 20,
  backgroundColor: "#f1f3f5",
},
searchContainer: {
  paddingHorizontal: 16,
  paddingVertical: 10,
  backgroundColor: "#fff",
  borderBottomWidth: 1,
  borderBottomColor: "#e9ecef",
},
searchInput: {
  height: 40,
  borderColor: "#d1d5db",
  borderWidth: 1,
  borderRadius: 8,
  paddingHorizontal: 12,
  backgroundColor: "#f9fafb",  // Changed to match history
  fontSize: 14,
},
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  welcomeTextContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16
  },
  complaintsContainer: {
    paddingBottom: 80
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  cardHeader:  {
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  cardContent: {
    // marginBottom: 12,
  },
  complaintRow: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: 'flex-start'
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
    width: 140,
  },
  codeText: {
    fontSize:  14,
    color: "#e63946",
    fontWeight:  "700",
    backgroundColor: "#fff1f0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  valueText: {
    fontSize: 14,
    color: "#495057",
    flex: 1,
    lineHeight: 20
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    borderRadius: 4,
    textTransform: "capitalize",
  },
  pendingBadge: { backgroundColor: "#fff3cd" },
  pendingText: { color: "#ad954b" },
  acceptedBadge: { backgroundColor: "#dcfce7" },
  acceptedText: { color: "#22c55e" },
  rejectedBadge: { backgroundColor:  "#fcdcdc" },
  rejectedText: { color: "#ef4444" },
  resolvedBadge: { backgroundColor: "#e0e7ff" },
  resolvedText: { color: "#6366f1" },
  buttonContainer: {
    flexDirection:  "row",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  editbutton: {
    backgroundColor: "#ffbf00ff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    elevation: 2,
    flexDirection: 'row',
    alignItems:  'center',
    justifyContent: 'center',
    gap: 6,
  },
  revokeButton: {
    backgroundColor: "#32a954ff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    elevation:  2,
    flexDirection:  'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  disabledButton: {
    backgroundColor: "#adb5bd",
    elevation: 0,
  },
  editbuttonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 14,
  },
  revokeButtonText:  {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 14,
  },
  statusMessageContainer:  {
    flex: 1,
    flexDirection: 'row',
    alignItems:  'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f8f9fa",
    borderRadius:  8,
    gap: 8,
  },
  statusMessage: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
    flex: 1,
  },
  acceptedMessage: {
    color: "#2b9348",
  },
  rejectedMessage: {
    color: "#e63946",
  },
  resolvedMessage: {
    color: "#6366f1",
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right:  20,
    backgroundColor: '#e63946',
    width: 60,
    height:  60,
    borderRadius:  30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
    zIndex: 99,
  },
});

export default FacultyDashboard;