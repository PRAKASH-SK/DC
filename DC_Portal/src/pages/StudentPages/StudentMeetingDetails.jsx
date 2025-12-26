import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import moment from 'moment';

const StudentMeetingDetails = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { meeting } = route.params;
  console.log('Student Meeting Details:', meeting);

  // Attendance badge style
  let badgeStyle = styles.pendingBadge;
  let textStyle = styles.pendingText;
  
  if (meeting.attendance === 'present') {
    badgeStyle = styles.acceptedBadge;
    textStyle = styles.acceptedText;
  } else if (meeting.attendance === 'absent') {
    badgeStyle = styles.rejectedBadge;
    textStyle = styles.rejectedText;
  }

  const formatName = (name) => {
    return name ? name.charAt(0).toUpperCase() + name.slice(1).toLowerCase() : '';
  };

  const formatTime = (time) => {
    return moment(time, 'HH:mm:ss').format('hh:mm:ss A');
  };

  const formatDate = (date) => {
    return moment(date).format('DD MMM YYYY');
  };

  const formatDateTime = (dateTime) => {
    return moment(dateTime).format('DD MMM YYYY, hh:mm A');
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
        
        <Text style={styles.headerTitle}>Meeting Details</Text>
        
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
              <Text style={styles.codeText}>{meeting.id}</Text>
              <Text style={styles.complaintIdText}>{meeting.complaint_id}</Text>
            </View>
            <View style={[styles.statusBadge, badgeStyle]}>
              <Text style={[styles.statusText, textStyle]}>
                {meeting.attendance || 'scheduled'}
              </Text>
            </View>
          </View>

          {/* Meeting Date and Time */}
          <View style={styles.dateTimeContainer}>
            <View style={styles.dateTimeItem}>
              <Ionicons name="calendar-outline" size={16} color="#6366f1" />
              <Text style={styles.dateTimeText}>{formatDateTime(meeting.meeting_date_time)}</Text>
            </View>
          </View>
        </View>

        {/* Meeting Information */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={20} color="#f59e0b" />
            <Text style={styles.sectionTitle}>Meeting Information</Text>
          </View>
          
          <DetailRow label="Meeting Venue" value={meeting.meeting_venue} />
          <DetailRow label="Meeting Info" value={meeting.info || 'No additional information'} />
          <DetailRow label="Attendance" value={meeting.attendance || 'Not marked'} isLast={true} />
        </View>

        {/* Admin Information */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-circle-outline" size={20} color="#3b82f6" />
            <Text style={styles.sectionTitle}>Meeting Administrator</Text>
          </View>
          
          <DetailRow label="Admin Name" value={formatName(meeting.admin_name)} />
          <DetailRow label="Email ID" value={meeting.admin_email} />
          <DetailRow label="Department" value={meeting.admin_department} isLast={true} />
        </View>

        {/* Faculty Information */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="school-outline" size={20} color="#dc2626" />
            <Text style={styles.sectionTitle}>Faculty Information</Text>
          </View>
          
          <DetailRow label="Faculty Name" value={formatName(meeting.faculty_name)} />
          <DetailRow label="Email ID" value={meeting.faculty_email} />
          <DetailRow label="Department" value={meeting.faculty_department} isLast={true} />
        </View>

        {/* Original Complaint Details */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={20} color="#7c3aed" />
            <Text style={styles.sectionTitle}>Original Complaint Details</Text>
          </View>
          
          <DetailRow label="Complaint Status" value={meeting.fl_status} />
          <DetailRow label="Original Venue" value={meeting.fl_venue} />
          <DetailRow label="Complaint Date" value={formatDateTime(meeting.fl_date_time)} />
          <DetailRow label="Description" value={meeting.fl_complaint} />
          {meeting.revoke_message && meeting.revoke_message !== 'no' && (
            <DetailRow label="Rejection Reason" value={meeting.revoke_message} />
          )}
          <DetailRow label="Meeting Allotted" value={meeting.meeting_alloted === 'yes' ? 'Yes' : 'No'} isLast={true} />
        </View>

        {/* Important Notes for Student */}
        <View style={[styles.sectionCard, styles.notesCard]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={20} color="#059669" />
            <Text style={[styles.sectionTitle, styles.notesTitle]}>Important Information</Text>
          </View>
          
          <Text style={styles.notesText}>
            • Please arrive 10 minutes before the scheduled meeting time.{'\n'}
            • Bring all relevant documents related to your complaint.{'\n'}
            • Your attendance will be marked during the meeting.{'\n'}
            • If you cannot attend, please inform the administrator in advance.
          </Text>
        </View>
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
  codeText: {
    fontSize: 18,
    color: '#e63946',
    fontWeight: '700',
    marginBottom: 4,
  },
  complaintIdText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
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
  notesCard: {
    borderColor: '#d1fae5',
    backgroundColor: '#f0fdf4',
  },
  notesTitle: {
    color: '#059669',
  },
  notesText: {
    fontSize: 14,
    color: '#047857',
    lineHeight: 22,
    fontStyle: 'italic',
  },
});

export default StudentMeetingDetails;