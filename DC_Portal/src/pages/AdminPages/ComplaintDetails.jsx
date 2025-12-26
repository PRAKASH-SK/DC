import React , { useState, useEffect }  from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import moment from 'moment';
import { API_URL } from '../../utils/env';


const ComplaintDetails = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { complaint } = route.params;
  console.log(complaint)
  console.log('Complaint Details:', complaint);

  const [meeting, setMeeting] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  // Status badge style based on status
  let badgeStyle = styles.pendingBadge;
  let textStyle = styles.pendingText;
  
  if (complaint.status === 'accepted') {
    badgeStyle = styles.acceptedBadge;
    textStyle = styles.acceptedText;
  } else if (complaint.status === 'rejected') {
    badgeStyle = styles.rejectedBadge;
    textStyle = styles.rejectedText;
  }


  useEffect(() => {
    if (!complaint?.id) return;

    const fetchMeeting = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await axios.get(`${API_URL}/api/admin/meeting_alloted/${complaint.code}`);
        if (response.data.length > 0) {
          setMeeting(response.data[0]); // assuming one meeting per complaint
        } else {
          setMeeting(null);
        }
      } catch (err) {
        setError('Failed to fetch meeting');
      } finally {
        setLoading(false);
      }
    };
    fetchMeeting();
  }, [complaint.code]);

  const formatName = (name) => {
    return name ? name.charAt(0).toUpperCase() + name.slice(1).toLowerCase() : '';
  };

  const formatTime = (time) => {
    return moment(time, 'HH:mm:ss').format('hh:mm:ss A');
  };

  const formatDate = (date) => {
    return moment(date).format('DD MMM YYYY');
  };

  const DetailRow = ({ label, value, isLast = false }) => (
    <View style={[styles.detailRow, isLast && styles.lastDetailRow]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );


  return (
    <SafeAreaView style={styles.container} edges={['right', 'bottom', 'left']}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Complaint Details</Text>
        
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Main Card */}
        <View style={styles.mainCard}>
          {/* Header Section */}
          <View style={styles.cardHeader}>
            <View style={styles.codeContainer}>
              {/* <Text style={styles.codeLabel}>Complaint ID</Text> */}
              <Text style={styles.codeText}>{complaint.code}</Text>
            </View>
            <View style={[styles.statusBadge, badgeStyle]}>
              <Text style={[styles.statusText, textStyle]}>
                {complaint.status}
              </Text>
            </View>
          </View>

          {/* Date and Time */}
          <View style={styles.dateTimeContainer}>
            <View style={styles.dateTimeItem}>
              <Ionicons name="calendar-outline" size={16} color="#6366f1" />
              <Text style={styles.dateTimeText}>{formatDate(complaint.date)}</Text>
            </View>
            <View style={styles.dateTimeItem}>
              <Ionicons name="time-outline" size={16} color="#6366f1" />
              <Text style={styles.dateTimeText}>{formatTime(complaint.time)}</Text>
            </View>
          </View>
        </View>

        {/* Student Information */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={20} color="#059669" />
            <Text style={styles.sectionTitle}>Student Information</Text>
          </View>
          
          <DetailRow label="Name" value={formatName(complaint.student_name)} />
          <DetailRow label="Register Number" value={complaint.student_reg_num} />
          <DetailRow label="Email ID" value={complaint.student_emailid} />
          <DetailRow label="Department" value={complaint.student_department} />
          <DetailRow label="Year" value={complaint.student_year} isLast={true} />
        </View>

        {/* Faculty Information */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="school-outline" size={20} color="#dc2626" />
            <Text style={styles.sectionTitle}>Faculty Information</Text>
          </View>
          
          <DetailRow label="Name" value={formatName(complaint.faculty_name)} />
          <DetailRow label="Email ID" value={complaint.faculty_email} />
          <DetailRow label="Department" value={complaint.faculty_department} isLast={true} />
        </View>

        {/* Complaint Details */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={20} color="#7c3aed" />
            <Text style={styles.sectionTitle}>Complaint Details</Text>
          </View>
          
          <DetailRow label="Venue" value={complaint.venue} />
          <DetailRow label="Description" value={complaint.details} />
        </View>

        {/* Rejection Message (if applicable) */}
        {complaint.status === 'rejected' && complaint.reject_message && (
          <View style={[styles.sectionCard, styles.rejectionCard]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="close-circle-outline" size={20} color="#ef4444" />
              <Text style={[styles.sectionTitle, styles.rejectionTitle]}>Rejection Reason</Text>
            </View>
            
            <Text style={styles.rejectionMessage}>
              {complaint.reject_message}
            </Text>

            {complaint.meeting_alloted !=="yes"
            ?
             (<TouchableOpacity
                            style={[ styles.meetingbutton]}
                            onPress={() => { navigation.navigate('AdminScheduledMeetingForm', 
                              { complaintId: complaint.id ,studentId:complaint.student_id,facultyId:complaint.faculty_id}); }}
                          >
              <Text style={styles.meetingbuttonText}>Allot Meeting</Text>
            </TouchableOpacity>)
            : ( <View style={styles.meetingallotedText}>
            <Text style={styles.meetingbuttonText}>Meeting is already alloted for this rejected complaint</Text>
            </View>
          )
            }

          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: Platform.OS === 'ios' ? 65 : 45,
    
    backgroundColor: '#fff',
    // Removed borderBottomWidth and borderBottomColor
    elevation: 2,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f1f3f5',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3436',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  mainCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  codeContainer: {
    flex: 1,
  },
  codeLabel: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
    marginBottom: 4,
  },
  codeText: {
    fontSize: 18,
    color: '#e63946',
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  pendingBadge: { backgroundColor: '#fff3cd' },
  pendingText: { color: '#ad954b' },
  acceptedBadge: { backgroundColor: '#dcfce7' },
  acceptedText: { color: '#22c55e' },
  rejectedBadge: { backgroundColor: '#fcdcdc' },
  rejectedText: { color: '#ef4444' },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateTimeText: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
    marginLeft: 8,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  lastDetailRow: {
    marginBottom: 0,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c757d',
    width: 120,
  },
  detailValue: {
    fontSize: 14,
    color: '#495057',
    flex: 1,
    lineHeight: 20,
  },
  descriptionText: {
    lineHeight: 22,
  },
  rejectionCard: {
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  rejectionTitle: {
    color: '#ef4444',
  },
  rejectionMessage: {
    fontSize: 14,
    color: '#dc2626',
    lineHeight: 22,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  meetingbutton: {
    backgroundColor: "#ff9100ff",
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    elevation: 1,
  },
  meetingbuttonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 14,
  },
  meetingallotedText: {
    backgroundColor: "#ff3c00ff",
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    elevation: 1,
  },
});

export default ComplaintDetails;