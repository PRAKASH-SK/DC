import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Modal,
  Dimensions,
} from "react-native";
import axios from "axios";
import { API_URL } from '../../utils/env'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from 'react-native-vector-icons/Ionicons';
import moment from 'moment';

const { width } = Dimensions.get('window');

// ✅ NEW: Sort Options Component
const SortOptions = ({ selectedSort, onSortChange }) => {
  const sortOptions = [
    { label: 'All', value: 'all', icon: 'list-outline', color: '#6366f1' },
    { label: 'Scheduled', value:  'scheduled', icon: 'time-outline', color: '#ad954b' },
    { label:  'Present', value: 'present', icon: 'checkmark-circle-outline', color: '#22c55e' },
    { label: 'Absent', value:  'absent', icon: 'close-circle-outline', color:  '#ef4444' },
  ];

  return (
    <View style={styles.sortContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sortScrollContent}
      >
        {sortOptions.map((option) => {
          const isSelected = selectedSort === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.sortChip,
                isSelected && { backgroundColor: option.color }
              ]}
              onPress={() => onSortChange(option.value)}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={option.icon} 
                size={18} 
                color={isSelected ? '#fff' : option.color} 
              />
              <Text style={[
                styles.sortChipText,
                isSelected && styles.sortChipTextActive
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const AdminScheduleMeetings = () => {
  const navigation = useNavigation();
  
  // ✅ ALL useState hooks at the top
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminId, setAdminId] = useState(null);
  const [adminName, setAdminName] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(moment());
  const [submittingAttendance, setSubmittingAttendance] = useState({});
  const [submittingComplaintAction, setSubmittingComplaintAction] = useState({});
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateFilter, setDateFilter] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(moment(new Date()));
  const [tempSelectedDate, setTempSelectedDate] = useState(moment(new Date()));
  const [selectedSort, setSelectedSort] = useState('all');  // ✅ NEW
  const [sortVisible, setSortVisible] = useState(false);    // ✅ NEW

  // Refs for timers
  const timeUpdateInterval = useRef(null);
  const autoRefreshInterval = useRef(null);
  const absentCheckInterval = useRef(null);

  // Update current time every second for live timer
  useEffect(() => {
    timeUpdateInterval.current = setInterval(() => {
      setCurrentTime(moment());
    }, 1000);

    return () => {
      if (timeUpdateInterval.current) {
        clearInterval(timeUpdateInterval.current);
      }
    };
  }, []);

  // Auto-refresh meetings data every 30 seconds
  useEffect(() => {
    if (adminId) {
      autoRefreshInterval.current = setInterval(() => {
        fetchUserIdAndMeetings(true);
      }, 30000);

      return () => {
        if (autoRefreshInterval.current) {
          clearInterval(autoRefreshInterval.current);
        }
      };
    }
  }, [adminId]);

  // Check if any meeting is about to start and trigger refresh
  useEffect(() => {
    const checkMeetingStartTime = () => {
      const now = moment();
      
      meetings.forEach(meeting => {
        if (meeting.attendance === 'scheduled') {
          const meetingDateTime = moment(meeting.meeting_date_time);
          const timeDiff = meetingDateTime.diff(now, 'seconds');
          
          if (timeDiff > 0 && timeDiff <= 5) {
            console.log('Meeting starting soon, refreshing...');
            fetchUserIdAndMeetings(true);
          }
        }
      });
    };

    const meetingCheckInterval = setInterval(checkMeetingStartTime, 1000);
    return () => clearInterval(meetingCheckInterval);
  }, [meetings]);

  // Auto-mark absent after 1 hour
  useEffect(() => {
    const checkAbsentMeetings = async () => {
      const now = moment();
      
      for (const meeting of meetings) {
        if (meeting.attendance === 'scheduled') {
          const meetingDateTime = moment(meeting.meeting_date_time);
          const oneHourAfterMeeting = meetingDateTime.clone().add(1, 'hour');
          
          if (now. isAfter(oneHourAfterMeeting)) {
            console.log(`Auto-marking meeting ${meeting.id} as absent`);
            try {
              await markAttendance(meeting.id, 'absent', true);
            } catch (error) {
              console.error('Auto-absent failed:', error);
            }
          }
        }
      }
    };

    absentCheckInterval.current = setInterval(checkAbsentMeetings, 10000);
    
    return () => {
      if (absentCheckInterval.current) {
        clearInterval(absentCheckInterval.current);
      }
    };
  }, [meetings]);

  // Get meeting status for sorting
  const getMeetingStatus = (meeting) => {
    const now = moment();
    const meetingDateTime = moment(meeting.meeting_date_time);
    const oneHourAfterMeeting = meetingDateTime.clone().add(1, 'hour');

    if (meeting.attendance !== 'scheduled') {
      return 'ended';
    }

    if (now.isSameOrAfter(meetingDateTime) && now.isBefore(oneHourAfterMeeting)) {
      return 'running';
    }

    if (now.isBefore(meetingDateTime)) {
      return 'upcoming';
    }

    return 'ended';
  };

  // Sort meetings
  const sortMeetingsByStatus = (meetingsArray) => {
    return [... meetingsArray].sort((a, b) => {
      const statusA = getMeetingStatus(a);
      const statusB = getMeetingStatus(b);

      const statusPriority = {
        'running': 1,
        'upcoming': 2,
        'ended': 3
      };

      if (statusPriority[statusA] !== statusPriority[statusB]) {
        return statusPriority[statusA] - statusPriority[statusB];
      }

      const timeA = moment(a.meeting_date_time);
      const timeB = moment(b.meeting_date_time);

      if (statusA === 'running' || statusA === 'upcoming') {
        return timeA.diff(timeB);
      } else {
        return timeB.diff(timeA);
      }
    });
  };

  // Check if attendance buttons should be shown
  const shouldShowAttendanceButtons = (meeting) => {
    if (meeting.attendance !== 'scheduled') {
      return false;
    }

    const now = moment();
    const meetingDateTime = moment(meeting.meeting_date_time);
    const oneHourAfterMeeting = meetingDateTime.clone().add(1, 'hour');

    return now.isSameOrAfter(meetingDateTime) && now.isBefore(oneHourAfterMeeting);
  };

  // Check if complaint action buttons should be shown
  const shouldShowComplaintActionButtons = (meeting) => {
    return meeting.attendance === 'present' && meeting.fl_status === 'rejected';
  };

  // Calculate remaining time for attendance
  const getRemainingTime = (meeting) => {
    const now = moment();
    const meetingDateTime = moment(meeting.meeting_date_time);
    const oneHourAfterMeeting = meetingDateTime.clone().add(1, 'hour');

    if (now.isBefore(meetingDateTime)) {
      const duration = moment.duration(meetingDateTime.diff(now));
      const hours = Math.floor(duration.asHours());
      const minutes = duration. minutes();
      const seconds = duration.seconds();
      
      if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
      } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
      } else if (seconds > 0) {
        return `${seconds}s`;
      } else {
        return 'Starting now... ';
      }
    }

    if (now.isAfter(oneHourAfterMeeting)) {
      return 'Expired';
    }

    const duration = moment.duration(oneHourAfterMeeting. diff(now));
    const hours = Math.floor(duration.asHours());
    const minutes = duration.minutes();
    const seconds = duration.seconds();

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `00h ${minutes}m ${seconds}s`;
    } else if (seconds > 0) {
      return `00h 00m ${seconds}s`;
    } else {
      return 'Time expired';
    }
  };

  // Check if timer should be visible
  const shouldShowTimer = (meeting) => {
    if (meeting.attendance !== 'scheduled') {
      return false;
    }

    const now = moment();
    const meetingDateTime = moment(meeting.meeting_date_time);
    const oneHourAfterMeeting = meetingDateTime.clone().add(1, 'hour');
    const fiveMinutesBeforeMeeting = meetingDateTime. clone().subtract(5, 'minutes');
    
    return (now.isSameOrAfter(fiveMinutesBeforeMeeting) && now.isBefore(oneHourAfterMeeting));
  };

  // Mark attendance
  const markAttendance = async (meetingId, attendance, isAutoAbsent = false) => {
    try {
      if (!isAutoAbsent) {
        setSubmittingAttendance(prev => ({ ...prev, [meetingId]: true }));
      }

      const response = await axios.post(`${API_URL}/api/admin/post_attendance`, {
        meeting_id: meetingId,
        attendance: attendance
      });

      if (response.data.success) {
        setMeetings(prevMeetings =>
          prevMeetings.map(m =>
            m.id === meetingId ?  { ...m, attendance: attendance } : m
          )
        );

        if (!isAutoAbsent) {
          Alert.alert(
            'Success',
            `Attendance marked as ${attendance}`,
            [{ 
              text: 'OK',
              onPress: () => fetchUserIdAndMeetings(true)
            }]
          );
        } else {
          fetchUserIdAndMeetings(true);
        }
      } else {
        throw new Error(response.data.message || 'Failed to update attendance');
      }
    } catch (error) {
      console.error('Attendance update error:', error);
      if (!isAutoAbsent) {
        Alert.alert(
          'Error',
          error.response?.data?.message || 'Failed to update attendance.  Please try again.'
        );
      }
    } finally {
      if (!isAutoAbsent) {
        setSubmittingAttendance(prev => ({ ... prev, [meetingId]: false }));
      }
    }
  };

  // Handle complaint action (Accept or Resolve)
  const handleComplaintAction = async (complaintId, meetingId, action) => {
    try {
      setSubmittingComplaintAction(prev => ({ ...prev, [meetingId]: true }));

      const response = await axios.post(`${API_URL}/api/admin/post_accept_or_resolve`, {
        complaint_id: complaintId,
        status: action
      });

      if (response.data.success) {
        setMeetings(prevMeetings =>
          prevMeetings.map(m =>
            m.id === meetingId ? { ...m, fl_status: action } : m
          )
        );

        Alert.alert(
          'Success',
          `Complaint ${action} successfully`,
          [{ 
            text: 'OK',
            onPress: () => fetchUserIdAndMeetings(true)
          }]
        );
      } else {
        throw new Error(response.data.message || `Failed to ${action} complaint`);
      }
    } catch (error) {
      console.error('Complaint action error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || `Failed to ${action} complaint. Please try again.`
      );
    } finally {
      setSubmittingComplaintAction(prev => ({ ...prev, [meetingId]: false }));
    }
  };

  // Handle attendance button press
  const handleAttendancePress = (meetingId, attendance) => {
    Alert.alert(
      'Confirm Attendance',
      `Are you sure you want to mark this meeting as ${attendance}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Confirm',
          onPress: () => markAttendance(meetingId, attendance)
        }
      ]
    );
  };

  // Handle complaint action button press
  const handleComplaintActionPress = (complaintId, meetingId, action) => {
    const actionText = action === 'accepted' ? 'accept' : 'resolve';
    Alert.alert(
      `Confirm ${actionText. charAt(0).toUpperCase() + actionText.slice(1)}`,
      `Are you sure you want to ${actionText} this complaint?`,
      [
        {
          text:  'Cancel',
          style:  'cancel'
        },
        {
          text: 'Confirm',
          onPress:  () => handleComplaintAction(complaintId, meetingId, action)
        }
      ]
    );
  };

  // Toggle search
  const toggleSearch = () => {
    if (searchVisible) {
      setSearchText("");
      setDateFilter(null);
    }
    setSearchVisible(!searchVisible);
  };

  // ✅ NEW: Toggle sort visibility
  const toggleSort = () => {
    setSortVisible(!sortVisible);
  };

  // ✅ NEW: Handle sort change
  const handleSortChange = (sortValue) => {
    setSelectedSort(sortValue);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUserIdAndMeetings();
  };

  const fetchUserIdAndMeetings = async (silent = false) => {
    try {
      const storedId = await AsyncStorage.getItem('user_id');
      const storename = await AsyncStorage.getItem('user_name');
      if (! storedId) {
        navigation.navigate('Login');
        return;
      }
      
      if (!silent) {
        setAdminId(storedId);
        setAdminName(storename);
      }

      const res = await axios.get(`${API_URL}/api/admin/get_schedule_meetings/${storedId}`);
      if (res.data.success) {
        const data = res.data.data. map((m) => ({
          id: m.meeting_id,
          complaint_id: m.complaint_id,
          date:  moment(m.meeting_date_time).format('YYYY-MM-DD'),
          time: moment(m.meeting_date_time).format('HH:mm: ss'),
          meeting_venue: m.meeting_venue,
          info: m.info,
          attendance: m.attendance,
          student_name: m.student_name,
          student_reg_num: m.student_reg_num,
          student_email: m.student_email,
          student_department: m.student_department,
          student_year: m.student_year,
          faculty_name: m.faculty_name,
          faculty_email: m.faculty_email,
          faculty_department: m.faculty_department,
          fl_complaint:  m.fl_complaint,
          fl_status: m.fl_status,
          fl_venue: m.fl_venue,
          fl_date_time: m.fl_date_time,
          meeting_date_time: m.meeting_date_time,
          revoke_message: m.revoke_message,
        }));
        setMeetings(data);
      } else {
        setMeetings([]);
      }
    } catch (err) {
      console.error(err);
      if (!silent) {
        Alert.alert("Error", "Failed to fetch scheduled meetings");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserIdAndMeetings();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (adminId) {
        fetchUserIdAndMeetings(true);
      }
    }, [adminId])
  );

  const handleCardPress = (meeting) => {
    navigation.navigate('MeetingDetails', { meeting:  meeting });
  };

  // Calendar functions
  const openCalendar = () => {
    setCurrentMonth(moment(selectedDate || new Date()));
    setTempSelectedDate(moment(selectedDate || new Date()));
    setShowCalendar(true);
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(currentMonth.clone().subtract(1, 'month'));
  };

  const goToNextMonth = () => {
    setCurrentMonth(currentMonth. clone().add(1, 'month'));
  };

  const selectCalendarDate = (selectedDay) => {
    if (isCurrentMonth(selectedDay)) {
      setTempSelectedDate(selectedDay. clone());
    }
  };

  const isToday = (day) => day.isSame(moment(), 'day');
  const isSelected = (day) => tempSelectedDate && day.isSame(tempSelectedDate, 'day');
  const isCurrentMonth = (day) => day.isSame(currentMonth, 'month');

  const handleCalendarOK = () => {
    if (tempSelectedDate) {
      setSelectedDate(tempSelectedDate. toDate());
      setDateFilter(tempSelectedDate.format('YYYY-MM-DD'));
    }
    setShowCalendar(false);
  };

  const handleCalendarCancel = () => {
    setTempSelectedDate(moment(selectedDate || new Date()));
    setShowCalendar(false);
  };

  const clearDateFilter = () => {
    setDateFilter(null);
    setSelectedDate(new Date());
  };

  const formatSelectedDate = () => {
    if (tempSelectedDate) {
      return tempSelectedDate.format('ddd, MMM D');
    }
    return 'Select Date';
  };

  const getCalendarDays = () => {
    const startOfMonth = currentMonth.clone().startOf('month');
    const endOfMonth = currentMonth.clone().endOf('month');
    const startOfWeek = startOfMonth.clone().startOf('week');
    const endOfWeek = endOfMonth.clone().endOf('week');

    const days = [];
    let day = startOfWeek. clone();

    while (day.isSameOrBefore(endOfWeek, 'day')) {
      days.push(day.clone());
      day.add(1, 'day');
    }

    return days;
  };

  const highlightText = (text, searchText) => {
    if (!searchText) return <Text>{text}</Text>;
    const string = text?. toString() ??  '';
    const lowerText = string.toLowerCase();
    const lowerSearch = searchText. toLowerCase();
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

  // ✅ UPDATED: Filter meetings with sort logic
  const filteredMeetings = sortMeetingsByStatus(
    meetings.filter((m) => {
      // Sort filter
      if (selectedSort !== 'all') {
        const attendanceStatus = m.attendance || 'scheduled';
        if (attendanceStatus. toLowerCase() !== selectedSort.toLowerCase()) {
          return false;
        }
      }

      // Date filter
      if (dateFilter && m.date !== dateFilter) {
        return false;
      }

      // Search filter
      if (! searchText) return true;
      
      const s = searchText.toLowerCase();
      const timeStr = moment(m.time, 'HH:mm:ss').format('hh:mm: ss A').toLowerCase();

      return (
        m.student_name?. toLowerCase().includes(s) ||
        m.student_reg_num?.toLowerCase().includes(s) ||
        m.faculty_name?.toLowerCase().includes(s) ||
        m.meeting_venue?.toLowerCase().includes(s) ||
        m.info?.toLowerCase().includes(s) ||
        m.fl_complaint?.toLowerCase().includes(s) ||
        m.complaint_id?.toString().toLowerCase().includes(s) ||
        m.date?.toLowerCase().includes(s) ||
        m.student_email?.toLowerCase().includes(s) ||
        m.faculty_email?.toLowerCase().includes(s) ||
        m.student_department?.toLowerCase().includes(s) ||
        m.faculty_department?.toLowerCase().includes(s) ||
        m.attendance?.toLowerCase().includes(s) ||
        timeStr.includes(s) ||
        moment(m.meeting_date_time).format('DD-MM-YYYY').toLowerCase().includes(s) ||
        moment(m.meeting_date_time).format('MM-DD-YYYY').toLowerCase().includes(s) ||
        moment(m.meeting_date_time).format('YYYY-MM-DD').toLowerCase().includes(s) ||
        moment(m.meeting_date_time).format('DD/MM/YYYY').toLowerCase().includes(s) ||
        moment(m.meeting_date_time).format('MM/DD/YYYY').toLowerCase().includes(s) ||
        moment(m.meeting_date_time).format('HH:mm').toLowerCase().includes(s) ||
        moment(m.meeting_date_time).format('h:mm A').toLowerCase().includes(s) ||
        moment(m.meeting_date_time).format('h:mm a').toLowerCase().includes(s)
      );
    })
  );

  const renderMeetingCard = (meeting) => {
    const showAttendanceButtons = shouldShowAttendanceButtons(meeting);
    const showComplaintButtons = shouldShowComplaintActionButtons(meeting);
    const showTimer = shouldShowTimer(meeting);
    const remainingTime = showTimer ? getRemainingTime(meeting) : null;
    const isSubmittingAttendance = submittingAttendance[meeting.id];
    const isSubmittingAction = submittingComplaintAction[meeting.id];
    const meetingStatus = getMeetingStatus(meeting);

    let badgeStyle = styles.pendingBadge;
    let textStyle = styles.pendingText;
    
    if (meeting.attendance === 'present') {
      badgeStyle = styles.acceptedBadge;
      textStyle = styles.acceptedText;
    } else if (meeting. attendance === 'absent') {
      badgeStyle = styles.rejectedBadge;
      textStyle = styles.rejectedText;
    }
    
    const timeFormatted = moment(meeting.time, 'HH:mm: ss').format('hh:mm A');

    return (
      <TouchableOpacity 
        key={meeting.id} 
        style={[
          styles.card,
          (showAttendanceButtons || showComplaintButtons) && styles.activeCard,
          meetingStatus === 'upcoming' && ! showAttendanceButtons && !showComplaintButtons && styles.upcomingCard
        ]}
        onPress={() => handleCardPress(meeting)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.codeText}>
            {highlightText(meeting.id, searchText)}
          </Text>
          <View style={[styles.statusBadge, badgeStyle]}>
            <Text style={[styles.statusText, textStyle]}>
              {highlightText(meeting.attendance, searchText)}
            </Text>
          </View>
        </View>

        {showTimer && (
          <View style={[
            styles.timerContainer,
            showAttendanceButtons ?  styles.activeTimerContainer : styles.upcomingTimerContainer
          ]}>
            <Ionicons 
              name={showAttendanceButtons ? "time-outline" : "alarm-outline"} 
              size={16} 
              color={showAttendanceButtons ? "#f59e0b" : "#3b82f6"} 
            />
            <Text style={[
              styles.timerText,
              showAttendanceButtons ? styles.activeTimerText : styles. upcomingTimerText
            ]}>
              {remainingTime}
            </Text>
          </View>
        )}

        <View style={styles. cardContent}>
          <View style={styles.complaintRow}>
            <Text style={styles.label}>Complaint ID:</Text>
            <Text style={styles.valueText}>
              {highlightText(meeting.complaint_id, searchText)}
            </Text>
          </View>

          <View style={styles.complaintRow}>
            <Text style={styles.label}>Student Name:</Text>
            <Text style={styles.valueText}>
              {highlightText(
                meeting.student_name
                  ?  meeting.student_name. charAt(0).toUpperCase() + meeting.student_name.slice(1).toLowerCase()
                  : '',
                searchText
              )}
            </Text>
          </View>

          <View style={styles.complaintRow}>
            <Text style={styles.label}>Faculty Name:</Text>
            <Text style={styles.valueText}>
              {highlightText(
                meeting.faculty_name
                  ?  meeting.faculty_name.charAt(0).toUpperCase() + meeting.faculty_name.slice(1).toLowerCase()
                  : '',
                searchText
              )}
            </Text>
          </View>

          <View style={styles.complaintRow}>
            <Text style={styles.label}>Meeting Venue:</Text>
            <Text style={styles.valueText}>
              {highlightText(meeting.meeting_venue, searchText)}
            </Text>
          </View>

          <View style={styles.complaintRow}>
            <Text style={styles.label}>Meeting Date:</Text>
            <Text style={styles.valueText}>
              {highlightText(meeting.date, searchText)} | {highlightText(timeFormatted, searchText)}
            </Text>
          </View>

          {meeting.fl_status && meeting.fl_status !== 'pending' && (
            <View style={styles.complaintRow}>
              <Text style={styles.label}>Complaint Status:</Text>
              <Text style={[
                styles.valueText,
                { 
                  color: meeting.fl_status === 'accepted' ?  '#22c55e' : 
                        meeting.fl_status === 'resolved' ? '#8b5cf6' : '#495057',
                  fontWeight: '600'
                }
              ]}>
                {meeting.fl_status. charAt(0).toUpperCase() + meeting.fl_status.slice(1)}
              </Text>
            </View>
          )}
        </View>
        
        {/* Attendance Buttons Section */}
        {showAttendanceButtons && (
          <View style={styles.attendanceSection}>
            <View style={styles.attendanceButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.attendanceButton,
                  styles.presentButton,
                  isSubmittingAttendance && styles.disabledButton
                ]}
                onPress={() => handleAttendancePress(meeting. id, 'present')}
                disabled={isSubmittingAttendance}
              >
                {isSubmittingAttendance ?  (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.attendanceButtonText}>Present</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles. attendanceButton,
                  styles.absentButton,
                  isSubmittingAttendance && styles.disabledButton
                ]}
                onPress={() => handleAttendancePress(meeting. id, 'absent')}
                disabled={isSubmittingAttendance}
              >
                {isSubmittingAttendance ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="close-circle" size={20} color="#fff" />
                    <Text style={styles.attendanceButtonText}>Absent</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Complaint Action Buttons Section */}
        {showComplaintButtons && (
          <View style={styles.complaintActionSection}>
            <Text style={styles.complaintActionLabel}>Complaint Action:</Text>
            <View style={styles.complaintActionButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.complaintActionButton,
                  styles.acceptButton,
                  isSubmittingAction && styles.disabledButton
                ]}
                onPress={() => handleComplaintActionPress(meeting.complaint_id, meeting.id, 'accepted')}
                disabled={isSubmittingAction}
              >
                {isSubmittingAction ?  (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-done-circle" size={20} color="#fff" />
                    <Text style={styles.complaintActionButtonText}>Accept</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.complaintActionButton,
                  styles.resolveButton,
                  isSubmittingAction && styles.disabledButton
                ]}
                onPress={() => handleComplaintActionPress(meeting.complaint_id, meeting.id, 'resolved')}
                disabled={isSubmittingAction}
              >
                {isSubmittingAction ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="shield-checkmark" size={20} color="#fff" />
                    <Text style={styles.complaintActionButtonText}>Resolve</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Custom Calendar Component (keep existing renderCalendar function)
  const renderCalendar = () => {
    const days = getCalendarDays();

    return (
      <Modal
        visible={showCalendar}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCalendarCancel}
      >
        <View style={styles. modalOverlay}>
          <View style={styles.datePickerModal}>
            <View style={styles.calendarContainer}>
              <View style={styles.calendarHeader}>
                <Text style={styles.calendarHeaderText}>SELECT DATE</Text>
              </View>

              <View style={styles.selectedDateDisplay}>
                <Text style={styles.selectedDateMainText}>
                  {formatSelectedDate()}
                </Text>
                <TouchableOpacity style={styles.editIcon}>
                  <Ionicons name="pencil" size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              <View style={styles.monthNavigation}>
                <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
                  <Ionicons name="chevron-back" size={20} color="#666" />
                </TouchableOpacity>
                
                <Text style={styles.monthYearText}>
                  {currentMonth.format('MMMM YYYY')}
                </Text>
                
                <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.weekDaysHeader}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                  <Text key={index} style={styles.weekDayText}>{day}</Text>
                ))}
              </View>

              <View style={styles.calendarGrid}>
                {days.map((day, index) => {
                  const isCurrentMonthDay = isCurrentMonth(day);
                  const isTodayDay = isToday(day);
                  const isSelectedDay = isSelected(day);

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dayButton,
                        isTodayDay && ! isSelectedDay && styles.todayButton,
                        isSelectedDay && styles.selectedDayButton,
                      ]}
                      onPress={() => selectCalendarDate(day)}
                      disabled={! isCurrentMonthDay}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          ! isCurrentMonthDay && styles. inactiveDayText,
                          isTodayDay && !isSelectedDay && styles.todayText,
                          isSelectedDay && styles.selectedDayText,
                        ]}
                      >
                        {day. date()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            
            <View style={styles.datePickerButtons}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={handleCalendarCancel}
              >
                <Text style={styles.cancelButtonText}>CANCEL</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.confirmButton} 
                onPress={handleCalendarOK}
              >
                <Text style={styles.confirmButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container} edges={['right', 'bottom', 'left']}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.HeaderContainer}>
        <View style={styles.HeaderTextContainer}>
          <Text style={styles.HeaderText}>Scheduled Meetings</Text>
          <Text style={styles.currentTimeText}>
            {currentTime.format('hh:mm:ss A')}
          </Text>
        </View>
        
        {/* ✅ NEW: Added sort button */}
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.searchIconContainer}
            onPress={toggleSort}
          >
            <Ionicons name="funnel-outline" size={24} color="#6366f1" />
          </TouchableOpacity>
          
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
      </View>
      
      {/* ✅ NEW: Sort Options */}
      {sortVisible && (
        <View style={styles.sortWrapper}>
          <SortOptions 
            selectedSort={selectedSort}
            onSortChange={handleSortChange}
          />
        </View>
      )}

      {searchVisible && (
        <View style={styles.filterContainer}>
          <View style={styles.searchRow}>
            <View style={styles.searchInputContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search meetings..."
                value={searchText}
                onChangeText={setSearchText}
                autoFocus={true}
              />
            </View>
            
            <TouchableOpacity
              style={styles.calendarButton}
              onPress={openCalendar}
            >
              <Ionicons name="calendar-outline" size={24} color="#6366f1" />
            </TouchableOpacity>
          </View>

          {dateFilter && (
            <View style={styles.selectedDateContainer}>
              <Text style={styles.selectedDateText}>
                Filtered by: {moment(dateFilter).format('DD-MM-YYYY')}
              </Text>
              <TouchableOpacity
                style={styles.clearDateButton}
                onPress={clearDateFilter}
              >
                <Ionicons name="close-circle" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {renderCalendar()}

      {loading ?  (
        <View style={{ flex: 1, justifyContent: 'center', alignItems:  'center' }}>
          <ActivityIndicator size="large" color="#e63946" />
          <Text style={{ marginTop: 12, color: '#6c757d', fontSize: 14 }}>Loading meetings...</Text>
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
            {filteredMeetings.length > 0 ? (
              filteredMeetings.map(renderMeetingCard)
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
                <Text style={styles.emptyText}>
                  {searchText || dateFilter || selectedSort !== 'all'
                    ? "No meetings match your filters" 
                    : "No scheduled meetings found. "}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex:  1,
    backgroundColor: "#f8f9fa"
  },
  HeaderContainer:  {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth:  1,
    borderBottomColor: "#e9ecef",
    elevation: 2,
  },
  HeaderTextContainer: {
    flex: 1,
    marginTop: 10,
  },
  HeaderText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#6366f1",
    marginBottom: 4
  },
  currentTimeText:  {
    fontSize: 12,
    color: "#6366f1",
    fontWeight: '500',
  },
  // ✅ NEW: Header buttons container
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIconContainer: {
    padding:  8,
    borderRadius: 20,
    backgroundColor: "#f1f3f5",
    marginLeft: 8,
  },
  // ✅ NEW: Sort wrapper and styles
  sortWrapper: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  sortContainer: {
    paddingVertical: 4,
  },
  sortScrollContent: {
    paddingVertical: 4,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical:  8,
    borderRadius: 20,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginRight: 8,
  },
  sortChipText:  {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 6,
  },
  sortChipTextActive: {
    color: '#fff',
  },
  filterContainer: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    paddingVertical:  10,
    paddingHorizontal: 16,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInputContainer: {
    flex: 1,
  },
  searchInput: {
    height: 40,
    borderColor: "#d1d5db",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    fontSize: 14,
  },
  calendarButton: {
    width: 40,
    height:  40,
    borderRadius:  8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical:  8,
    borderRadius:  6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#b3e5fc',
  },
  selectedDateText: {
    fontSize: 14,
    color: '#0277bd',
    fontWeight: '500',
  },
  clearDateButton: {
    padding: 2,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16
  },
  complaintsContainer:  {
    paddingBottom: 20
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
  activeCard: {
    borderColor: "#f59e0b",
    borderWidth: 2,
    elevation: 6,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity:  0.2,
    shadowRadius: 8,
  },
  upcomingCard: {
    borderColor: "#3b82f6",
    borderWidth: 2,
    elevation:  4,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
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
  cardContent: {
    marginBottom: 12,
  },
  complaintRow: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: 'flex-start'
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
    width: 120,
  },
  codeText: {
    fontSize: 14,
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
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical:  4,
    borderRadius:  20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    borderRadius: 4,
    textTransform: "capitalize",
  },
  pendingBadge: { backgroundColor: "#fff3cd" },
  pendingText: { color: "#ad954b" },
  acceptedBadge: { backgroundColor:  "#dcfce7" },
  acceptedText: { color: "#22c55e" },
  rejectedBadge: { backgroundColor:  "#fcdcdc" },
  rejectedText: { color: "#ef4444" },
  
  // Timer Styles
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
    marginBottom: 12,
  },
  activeTimerContainer: {
    backgroundColor:  '#fef3c7',
  },
  upcomingTimerContainer: {
    backgroundColor: '#dbeafe',
  },
  timerText: {
    fontSize: 13,
    fontWeight: '600',
  },
  activeTimerText: {
    color: '#d97706',
  },
  upcomingTimerText: {
    color: '#2563eb',
  },
  
  // Attendance Section Styles
  attendanceSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  attendanceButtonsContainer: {
    flexDirection:  'row',
    gap: 12,
  },
  attendanceButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
    elevation: 2,
  },
  presentButton: {
    backgroundColor: '#22c55e',
  },
  absentButton: {
    backgroundColor:  '#ef4444',
  },
  attendanceButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  
  // Complaint Action Section Styles
  complaintActionSection: {
    marginTop: 16,
    paddingTop:  16,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  complaintActionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 12,
  },
  complaintActionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  complaintActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap:  6,
    elevation: 2,
  },
  acceptButton: {
    backgroundColor: '#3b82f6',
  },
  resolveButton: {
    backgroundColor:  '#8b5cf6',
  },
  complaintActionButtonText:  {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  
  disabledButton: {
    opacity:  0.6,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    elevation: 2
  },
  emptyText:  {
    textAlign: "center",
    fontSize: 16,
    color: "#6c757d",
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '500'
  },

  // Calendar Styles (keep all existing)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  datePickerModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 320,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity:  0.3,
    shadowRadius: 8,
  },
  calendarContainer: {
    backgroundColor: '#fff',
  },
  calendarHeader: {
    backgroundColor: '#7c3aed',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  calendarHeaderText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  selectedDateDisplay: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 16,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedDateMainText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '300',
  },
  editIcon: {
    padding: 4,
  },
  monthNavigation: {
    flexDirection:  'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
  },
  navButton: {
    padding: 8,
  },
  monthYearText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  weekDaysHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  dayButton: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  todayButton: {
    borderRadius: 50,
    borderColor: '#7c3aed',
    borderWidth: 1,
  },
  selectedDayButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 50,
    borderColor: '#7c3aed',
    borderWidth: 1,
  },
  dayText: {
    fontSize: 14,
    color: '#333',
  },
  inactiveDayText: {
    color: '#ccc',
  },
  todayText: {
    color:  '#333',
    fontWeight: '600',
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: '600',
  },
  datePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 16,
  },
  confirmButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    color: '#7c3aed',
    fontWeight: '600',
    fontSize: 14,
  },
  confirmButtonText: {
    color: '#7c3aed',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default AdminScheduleMeetings;