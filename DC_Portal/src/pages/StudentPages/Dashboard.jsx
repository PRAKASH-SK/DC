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
import { useNavigation } from "@react-navigation/native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import moment from 'moment';
const Dashboard = () => {
  const navigation = useNavigation()
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [studentId, setStudentId] = useState(null);
  const [studentName, setStudentName] = useState(null);

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
  }

  // Function to auto-accept expired complaints
  const autoAcceptExpiredComplaint = async (complaintId) => {
    try {
      if (! studentId) return;
      
      const response = await axios.patch(
        `${API_URL}/api/student/action_complaint/${complaintId}/${Number(studentId)}`,
        { action: 'accept', auto_accepted: true }
      );

      if (response.data.success) {
        console.log(`Complaint ${complaintId} auto-accepted after 12 hours`);
        // Update the complaint status in state
        setComplaints((prev) =>
          prev.map((c) => 
            c.id === complaintId 
              ? { ...c, status: 'accepted', isActive: false, isVisible: true }
              :  c
          )
        );
      }
    } catch (err) {
      console.error("Auto-accept error:", err);
    }
  };

  const fetchUserIdAndComplaints = async () => {
    try {
      const storedId = await AsyncStorage.getItem('user_id');
      const storename = await AsyncStorage.getItem('user_name');

      if (! storedId) {
        navigation.navigate('Login');
        return;
      }

      setStudentId(storedId);
      setStudentName(storename);

      try {
        console.log(studentId)
        const res = await axios.get(`${API_URL}/api/student/get_complaints/${Number(storedId)}`);

        if (res.data.success) {
          const data = res.data.data. map((c) => {
            const complaintTime = new Date(c.date_time).getTime();
            const currentTime = new Date().getTime();
            const twelveHoursInMs = 12 * 60 * 60 * 1000;
            const elapsedMs = currentTime - complaintTime;
            const remainingMs = twelveHoursInMs - elapsedMs;
            const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));

            return {
              id: c.complaint_id,
              date:  c.complaint_date,
              time: c.complaint_time,
              date_time: c.date_time,
              code: c.complaint_id,
              venue: c.venue,
              status: c.status,
              details: c.complaint,
              faculty_name: c.faculty_name,
              faculty_emailid: c.faculty_emailid,
              timer: remainingSeconds,
              isActive: remainingSeconds > 0,
              isVisible: remainingSeconds > 0 || c.status?. toLowerCase() === 'resolved', // Show resolved complaints
            };
          });
          setComplaints(data);
        } else {
          setComplaints([]);
        }
      } catch (err) {
        console.error("Failed to fetch complaints:", err);
        Alert.alert("Error", "Failed to fetch complaints. Please check your connection.");
      }
    } catch (error) {
      console.error("Failed to fetch user ID:", error);
      Alert.alert("Error", "Failed to fetch user data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserIdAndComplaints();
  }, []);

  // useEffect for updating timers, hiding expired complaints, and auto-accepting
  useEffect(() => {
    const interval = setInterval(() => {
      setComplaints((prevComplaints) =>
        prevComplaints.map((complaint) => {
          // Don't update timer for resolved or already accepted/rejected complaints
          if (complaint.status?.toLowerCase() === 'resolved' || 
              complaint.status?.toLowerCase() === 'accepted' || 
              complaint.status?.toLowerCase() === 'rejected') {
            return complaint;
          }

          const newTimer = Math.max(0, complaint.timer - 1);
          
          // Auto-accept when timer reaches 0 and status is still pending
          if (newTimer === 0 && complaint.status?.toLowerCase() === 'pending' && complaint.isActive) {
            autoAcceptExpiredComplaint(complaint.id);
            return {
              ...complaint,
              timer: 0,
              isActive: false,
              isVisible: true, // Keep visible as accepted
              status: 'accepted' // Update status to accepted
            };
          }

          const shouldBeVisible = newTimer > 0;
          
          return {
            ...complaint,
            timer: newTimer,
            isActive: newTimer > 0,
            isVisible: shouldBeVisible,
          };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [studentId]); // Add studentId as dependency

  // Sort complaints:  pending first (by earliest time), then accepted/rejected/resolved (by latest time)
  const sortComplaintsByStatus = (complaintsArray) => {
    return [... complaintsArray].sort((a, b) => {
      // Priority: pending > accepted/rejected/resolved
      if (a.status === 'pending' && b.status !== 'pending') {
        return -1;
      }
      if (a.status !== 'pending' && b. status === 'pending') {
        return 1;
      }

      // Both are pending or both are accepted/rejected/resolved
      const timeA = new Date(a.date_time).getTime();
      const timeB = new Date(b.date_time).getTime();

      if (a.status === 'pending' && b.status === 'pending') {
        // For pending:  earliest first (ascending order)
        return timeA - timeB;
      } else {
        // For accepted/rejected/resolved: latest first (descending order)
        return timeB - timeA;
      }
    });
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

  // Filter and sort complaints based on search text
  const filteredComplaints = sortComplaintsByStatus(
    complaints.filter((c) => {
      if (! searchText) return true;
      if (! c.isVisible) return false;
      
      const s = searchText.toLowerCase();
      const dateStr = c.date ?  c.date.toLowerCase() : '';
      const timeStr = moment(c.time, 'HH:mm:ss').format('hh:mm: ss A').toLowerCase();

      return (
        c.faculty_name?. toLowerCase().includes(s) ||
        c.details?.toLowerCase().includes(s) ||
        c.venue?.toLowerCase().includes(s) ||
        c.status?.toLowerCase().includes(s) ||
        c.code?.toString().toLowerCase().includes(s) ||
        dateStr.includes(s) ||
        timeStr.includes(s)
      );
    })
  );

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleComplaintResponse = async (complaintId, action, reason = null) => {
    try {
      if (!studentId) {
        Alert.alert("Error", "Session expired. Please login again.");
        navigation.navigate('Login');
        return;
      }
      const response = await axios.patch(
        `${API_URL}/api/student/action_complaint/${complaintId}/${Number(studentId)}`,
        { action, reason }
      );

      if (response.data.success) {
        // Update the specific complaint status instead of removing it
        setComplaints((prev) =>
          prev.map((c) => 
            c.id === complaintId 
              ? { ...c, status: action === 'accept' ? 'accepted' : 'rejected', isActive: false }
              : c
          )
        );
        Alert.alert("Success", response.data.message);
      }
    } catch (err) {
      console.error("Response error:", err);
      Alert.alert("Error", "Failed to process your response. Please try again.");
    }
  };

  const handleAccept = (complaintId) => {
    Alert.alert("Accept Complaint", "Confirm accepting this complaint?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Accept",
        onPress: () => handleComplaintResponse(complaintId, 'accept'),
      },
    ]);
  };

  const handleRevoke = (complaintId) => {
    setSelectedComplaint(complaintId);
    setShowModal(true);
  };

  const submitRevoke = async () => {
    if (!reason. trim()) {
      Alert.alert("Error", "Please enter a reason to revoke this complaint");
      return;
    }

    await handleComplaintResponse(selectedComplaint, 'revoke', reason);
    setShowModal(false);
    setReason("");
    setSelectedComplaint(null);
  };

  const renderComplaintCard = (complaint) => {
    // Don't render if not visible
    if (!complaint.isVisible) {
      return null;
    }

    // Format time to include AM/PM
    const timeFormatted = moment(complaint.time, 'HH:mm:ss').format('hh:mm:ss A');

    return (
      <View key={complaint.id} style={[
        styles.card,
        complaint.status === 'pending' && styles.pendingCard
      ]}>
        <View style={styles.cardHeader}>
          <View style={styles.codeStatusContainer}>
            <Text style={styles.codeText}>
              {highlightText(complaint.code, searchText)}
            </Text>
            {complaint.status === 'pending' && (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>PENDING</Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles. timerText,
              complaint.timer > 0 ?  styles.activeTimer : null,
            ]}
          >
            {formatTime(complaint.timer)}
          </Text>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.complaintRow}>
            <Text style={styles.label}>Complaint By:</Text>
            <Text style={styles.valueText}>
              {highlightText(complaint.faculty_name, searchText)}
            </Text>
          </View>

          <View style={styles.complaintRow}>
            <Text style={styles.label}>Complaint Details:</Text>
            <Text style={styles.valueText}>
              {highlightText(complaint.details, searchText)}
            </Text>
          </View>

          <View style={styles.complaintRow}>
            <Text style={styles.label}>Venue:</Text>
            <Text style={styles. valueText}>
              {highlightText(complaint.venue, searchText)}
            </Text>
          </View>

          <View style={styles.complaintRow}>
            <Text style={styles.label}>Complaint Date:</Text>
            <Text style={styles.valueText}>
              {highlightText(complaint.date, searchText)}
            </Text>
          </View>

          <View style={styles.complaintRow}>
            <Text style={styles.label}>Complaint Time:</Text>
            <Text style={styles.valueText}>
              {highlightText(timeFormatted, searchText)}
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          {complaint.status === 'pending' ?  (
            <>
              <TouchableOpacity
                style={[styles.acceptButton, ! complaint.isActive && styles.disabledButton]}
                onPress={() => handleAccept(complaint. id)}
                disabled={!complaint.isActive}
              >
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.acceptButtonText}>ACCEPT</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.revokeButton, ! complaint.isActive && styles.disabledButton]}
                onPress={() => handleRevoke(complaint. id)}
                disabled={!complaint.isActive}
              >
                <Ionicons name="close-circle" size={20} color="#fff" />
                <Text style={styles.revokeButtonText}>REVOKE</Text>
              </TouchableOpacity>
            </>
          ) : complaint.status === 'accepted' ?  (
            <View style={styles.statusMessageContainer}>
              <Ionicons name="checkmark-circle" size={20} color="#2b9348" />
              <Text style={[styles.statusMessage, styles.acceptedMessage]}>
                You already accepted this complaint
              </Text>
            </View>
          ) : complaint.status === 'rejected' ? (
            <View style={styles.statusMessageContainer}>
              <Ionicons name="close-circle" size={20} color="#ef4444" />
              <Text style={[styles.statusMessage, styles.rejectedMessage]}>
                You already rejected this complaint.  Wait for enquiry meeting.
              </Text>
            </View>
          ) : complaint.status?. toLowerCase() === 'resolved' ? (
            <View style={styles.statusMessageContainer}>
              <Ionicons name="checkmark-done-circle" size={20} color="#6366f1" />
              <Text style={[styles.statusMessage, styles.resolvedMessage]}>
                This complaint has been resolved by the faculty
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  // Filter visible complaints for display logic
  const visibleComplaints = searchText 
    ? filteredComplaints 
    : sortComplaintsByStatus(complaints. filter(complaint => complaint.isVisible));

  return (
    <View style={styles.container} edges={['right', 'bottom', 'left']}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.welcomeContainer}>
        <Image
          source={require("../../assets/profile.jpeg")}
          style={styles. profileImage}
        />
        <View style={styles.welcomeTextContainer}>
          <Text style={styles.welcomeText}>Welcome, {studentName}</Text>
          <Text style={{ color: '#6366f1', fontSize: 14 }}>Your Complaint Dashboard</Text>
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
                padding:  20,
                borderRadius:  12,
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
                    : "No Active Complaints"}
                </Text>
                <Text style={{
                  textAlign: "center",
                  fontSize: 14,
                  color: "#adb5bd"
                }}>
                  {searchText 
                    ? "Try adjusting your search terms" 
                    : (complaints.length === 0 ? "You're all caught up!" : "All complaints have expired or been handled!")}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* Revoke Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles. modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={{
              fontSize: 18,
              marginBottom: 16,
              color: '#2d3436',
              fontWeight: '600'
            }}>
              Revoke Complaint
            </Text>
            <Text style={{
              fontSize: 14,
              marginBottom: 12,
              color: '#6c757d'
            }}>
              Please provide a reason for revoking this complaint:
            </Text>
            <TextInput
              placeholder="Enter your reason here..."
              value={reason}
              onChangeText={setReason}
              style={styles.input}
              multiline={true}
              numberOfLines={3}
              textAlignVertical="top"
            />
            <View style={{ flexDirection: "row", marginTop: 20 }}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#6c757d" }]}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#e63946" }]}
                onPress={submitRevoke}
              >
                <Text style={styles.modalButtonText}>Submit Revoke</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet. create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa"
  },
  welcomeContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    elevation: 2,
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
  welcomeText:  {
    fontSize: 20,
    fontWeight: "700",
    color: "#6366f1",
    marginBottom: 4
  },
  searchIconContainer:  {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#f1f3f5",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical:  10,
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
    backgroundColor: "#f8f9fa",
    fontSize: 14,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16
  },
  complaintsContainer:  {
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
  pendingCard: {
    borderColor: "#f59e0b",
    borderWidth: 2,
    elevation: 5,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  cardHeader: {
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  codeStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pendingBadge: {
    backgroundColor: '#fff3cd',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ad954b',
    letterSpacing: 0.5,
  },
  complaintRow: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: 'flex-start'
  },
  cardContent: {
    marginBottom: 0,
  },
  label:  {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
    width: 140,
  },
  codeText: {
    fontSize:  14,
    color: "#e63946",
    fontWeight: "700",
    backgroundColor: "#fff1f0",
    paddingHorizontal: 8,
    paddingVertical:  2,
    borderRadius: 4,
  },
  valueText: {
    fontSize: 14,
    color: "#495057",
    flex: 1,
    lineHeight: 20
  },
  timerText: {
    fontSize:  15,
    color: "#495057",
    fontFamily: "monospace",
    fontWeight: "600"
  },
  activeTimer:  {
    color: "#e63946",
    fontWeight: "700",
    backgroundColor: "#fff1f0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  buttonContainer: {
    flexDirection:  "row",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  acceptButton: {
    backgroundColor: "#22c55e",
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
    elevation: 2,
  },
  revokeButton: {
    backgroundColor: "#ef4444",
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical:  12,
    borderRadius:  8,
    gap: 6,
    elevation: 2,
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: "#adb5bd",
    elevation: 0,
  },
  acceptButtonText: {
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical:  12,
    paddingHorizontal: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
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
    color:  "#2b9348",
  },
  rejectedMessage: {
    color: "#ef4444",
  },
  resolvedMessage: {
    color: "#6366f1",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalBox: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 16,
    width: "85%",
    elevation: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#dee2e6",
    padding: 12,
    borderRadius: 8,
    fontSize: 15,
    backgroundColor: "#f8f9fa",
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    marginHorizontal: 6,
    borderRadius: 8,
    elevation: 1,
  },
  modalButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 14,
  },
});

export default Dashboard;