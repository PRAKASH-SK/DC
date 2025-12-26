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
  TextInput,
  RefreshControl,
  Modal,
  Dimensions,
} from "react-native";
import axios from "axios";
import { API_URL } from '../../utils/env'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import moment from 'moment';

const { width } = Dimensions.get('window');

// Header Component
const MeetingsHeader = ({ onSearchToggle, searchVisible }) => {
  return (
    <View style={styles.headerContainer}>
      <Text style={styles.pageTitle}>My Meetings</Text>
      <TouchableOpacity 
        style={styles.searchIconButton}
        onPress={onSearchToggle}
      >
        <Ionicons 
          name={searchVisible ? "close-outline" : "search-outline"} 
          size={24} 
          color="#6366f1" 
        />
      </TouchableOpacity>
    </View>
  );
};

// Search and Filter Component
const SearchFilterBar = ({ 
  searchText, 
  onSearchChange, 
  onCalendarPress,
  selectedDate,
  onClearDate 
}) => {
  return (
    <View style={styles.searchFilterContainer}>
      {/* Search and Calendar Row */}
      <View style={styles.filterContainer}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search meetings..."
            value={searchText}
            onChangeText={onSearchChange}
            autoFocus={true}
          />
        </View>
        
        <TouchableOpacity 
          style={styles.calendarButton} 
          onPress={onCalendarPress}
        >
          <Ionicons name="calendar-outline" size={24} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {/* Selected Date Display */}
      {selectedDate && (
        <View style={styles.selectedDateContainer}>
          <Text style={styles.selectedDateText}>
            Filtered by: {moment(selectedDate).format('DD-MM-YYYY')}
          </Text>
          <TouchableOpacity onPress={onClearDate} style={styles.clearDateButton}>
            <Ionicons name="close-circle" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// Meeting Card Component
const MeetingCard = ({ meeting, searchText, highlightText, onPress }) => {
  // Attendance badge style
  let badgeStyle = styles.pendingBadge;
  let textStyle = styles.pendingText;
  
  if (meeting. attendance === 'present') {
    badgeStyle = styles.acceptedBadge;
    textStyle = styles.acceptedText;
  } else if (meeting.attendance === 'absent') {
    badgeStyle = styles.rejectedBadge;
    textStyle = styles.rejectedText;
  }
  
  // Format time to include AM/PM
  const timeFormatted = moment(meeting.time, 'HH:mm: ss').format('hh:mm A');

  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => onPress(meeting)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.codeText}>
          {highlightText(meeting.id, searchText)}
        </Text>
        <View style={[styles.statusBadge, badgeStyle]}>
          <Text style={[styles.statusText, textStyle]}>
            {highlightText(meeting.attendance || 'scheduled', searchText)}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
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
                ? meeting.student_name. charAt(0).toUpperCase() + meeting.student_name.slice(1).toLowerCase()
                : '',
              searchText
            )}
          </Text>
        </View>

        <View style={styles.complaintRow}>
          <Text style={styles.label}>Student Reg No:</Text>
          <Text style={styles.valueText}>
            {highlightText(meeting.student_reg_num, searchText)}
          </Text>
        </View>

        <View style={styles.complaintRow}>
          <Text style={styles.label}>Admin Name:</Text>
          <Text style={styles.valueText}>
            {highlightText(
              meeting.admin_name
                ? meeting.admin_name.charAt(0).toUpperCase() + meeting.admin_name.slice(1).toLowerCase()
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

        <View style={styles. complaintRow}>
          <Text style={styles.label}>Meeting Date:</Text>
          <Text style={styles.valueText}>
            {highlightText(meeting.date, searchText)} | {highlightText(timeFormatted, searchText)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Cards Container Component
const MeetingsContainer = ({ 
  meetings, 
  searchText, 
  highlightText,
  refreshing,
  onRefresh,
  onCardPress,
  selectedDate 
}) => {
  if (meetings.length === 0) {
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.emptyScrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing}  
            onRefresh={onRefresh}
            colors={['#e63946']}
            tintColor="#e63946"
          />
        }
      >
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>
            {searchText || selectedDate
              ? "No meetings match your search criteria" 
              : "No scheduled meetings found"}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchText || selectedDate 
              ? "Try adjusting your search or date filter" 
              : "Your scheduled meetings will appear here"}
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing}  
          onRefresh={onRefresh}
          colors={['#e63946']}
          tintColor="#e63946"
        />
      }
    >
      <View style={styles.cardsContainer}>
        {meetings. map((meeting) => (
          <MeetingCard 
            key={meeting.id} 
            meeting={meeting} 
            searchText={searchText}
            highlightText={highlightText}
            onPress={onCardPress}
          />
        ))}
      </View>
    </ScrollView>
  );
};

// Custom Calendar Component
const CustomCalendar = ({ date, onDateChange }) => {
  const [currentMonth, setCurrentMonth] = useState(moment(date));
  const [selectedDay, setSelectedDay] = useState(moment(date).date());

  const today = moment();
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

  const goToPreviousMonth = () => {
    setCurrentMonth(currentMonth.clone().subtract(1, 'month'));
  };

  const goToNextMonth = () => {
    setCurrentMonth(currentMonth.clone().add(1, 'month'));
  };

  const selectDate = (selectedDay) => {
    const newDate = currentMonth.clone().date(selectedDay.date());
    setSelectedDay(selectedDay. date());
    onDateChange(newDate. toDate());
  };

  const isToday = (day) => day.isSame(today, 'day');
  const isSelected = (day) => day.date() === selectedDay && day.isSame(currentMonth, 'month');
  const isCurrentMonth = (day) => day.isSame(currentMonth, 'month');

  return (
    <View style={styles.calendarContainer}>
      <View style={styles.calendarHeader}>
        <Text style={styles.calendarHeaderText}>SELECT DATE</Text>
      </View>

      <View style={styles.selectedDateDisplay}>
        <Text style={styles.selectedDateMainText}>
          {moment(date).format('ddd, MMM D')}
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
          const dayNumber = day.date();
          const isCurrentMonthDay = isCurrentMonth(day);
          const isTodayDay = isToday(day);
          const isSelectedDay = isSelected(day);

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayButton,
                isTodayDay && ! isSelectedDay && styles.todayButton,
                isSelectedDay && styles. selectedDayButton,
              ]}
              onPress={() => isCurrentMonthDay && selectDate(day)}
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
                {dayNumber}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// Main Component
const FacultyScheduledMeetings = () => {
  const navigation = useNavigation();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [facultyId, setFacultyId] = useState(null);
  const [facultyName, setFacultyName] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Search related states
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  
  // Date filter states
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateFilter, setDateFilter] = useState(null);
  const [tempDate, setTempDate] = useState(new Date());

  // Toggle search visibility and reset search text when closing
  const toggleSearch = () => {
    if (searchVisible) {
      setSearchText("");
      setDateFilter(null);
    }
    setSearchVisible(!searchVisible);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUserIdAndMeetings();
  };

  const fetchUserIdAndMeetings = async () => {
    try {
      const storedId = await AsyncStorage.getItem('user_id');
      const storename = await AsyncStorage.getItem('user_name');
      if (! storedId) {
        navigation.navigate('Login');
        return;
      }
      setFacultyId(storedId);
      setFacultyName(storename);

      const res = await axios.get(`${API_URL}/api/faculty/get_schedule_meetings/${storedId}`);
      if (res.data.success) {
        const data = res.data.data. map((m) => ({
          id: m.meeting_id,
          complaint_id: m.complaint_id,
          date: moment(m.meeting_date_time).format('YYYY-MM-DD'),
          time: moment(m.meeting_date_time).format('HH:mm:ss'),
          meeting_venue: m.meeting_venue,
          info: m.info,
          attendance: m.attendance,
          admin_id: m.admin_id,
          admin_name: m.admin_name,
          admin_email: m.admin_email,
          admin_department: m.admin_department,
          student_id: m.student_id,
          student_name: m.student_name,
          student_email: m.student_email,
          student_reg_num: m.student_reg_num,
          student_department: m.student_department,
          student_year: m.student_year,
          fl_complaint:  m.fl_complaint,
          fl_status: m.fl_status,
          fl_venue: m.fl_venue,
          fl_date_time: m.fl_date_time,
          meeting_date_time: m.meeting_date_time,
          revoke_message: m.revoke_message,
          meeting_alloted:  m.meeting_alloted,
        }));
        setMeetings(data);
      } else {
        setMeetings([]);
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to fetch scheduled meetings");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserIdAndMeetings();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (facultyId) {
        fetchUserIdAndMeetings();
      }
    }, [facultyId])
  );

  // Navigation to detail screen
  const handleCardPress = (meeting) => {
    navigation.navigate('FacultyMeetingDetails', { meeting:  meeting });
  };

  // Date picker handlers
  const openDatePicker = () => {
    setTempDate(selectedDate || new Date());
    setShowCalendar(true);
  };

  const handleDateConfirm = () => {
    setSelectedDate(tempDate);
    setDateFilter(moment(tempDate).format('YYYY-MM-DD'));
    setShowCalendar(false);
  };

  const handleDateCancel = () => {
    setShowCalendar(false);
  };

  const clearDateFilter = () => {
    setDateFilter(null);
    setSelectedDate(new Date());
  };

  // Highlight helper function
  const highlightText = (text, searchText) => {
    if (!searchText) return <Text>{text}</Text>;
    const string = text?. toString() ?? '';
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

  // Filter meetings based on search text and date
  const filteredMeetings = meetings.filter((m) => {
    // Date filter
    if (dateFilter && m.date !== dateFilter) {
      return false;
    }

    // Search filter
    if (! searchText) return true;
    
    const s = searchText.toLowerCase();
    const timeStr = moment(m.time, 'HH:mm:ss').format('hh:mm: ss A').toLowerCase();

    return (
      m.admin_name?. toLowerCase().includes(s) ||
      m.student_name?.toLowerCase().includes(s) ||
      m.student_reg_num?. toLowerCase().includes(s) ||
      m.meeting_venue?.toLowerCase().includes(s) ||
      m.info?.toLowerCase().includes(s) ||
      m.fl_complaint?.toLowerCase().includes(s) ||
      m.complaint_id?.toString().toLowerCase().includes(s) ||
      m.date?.toLowerCase().includes(s) ||
      m.admin_email?.toLowerCase().includes(s) ||
      m.student_email?.toLowerCase().includes(s) ||
      m.admin_department?.toLowerCase().includes(s) ||
      m.student_department?.toLowerCase().includes(s) ||
      m.student_year?.toString().toLowerCase().includes(s) ||
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
  });

  if (loading) {
    return (
      <View style={styles. container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading meetings...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header Component */}
      <View style={styles.headerWrapper}>
        <MeetingsHeader 
          onSearchToggle={toggleSearch}
          searchVisible={searchVisible}
        />

        {/* Search Filter Bar */}
        {searchVisible && (
          <SearchFilterBar
            searchText={searchText}
            onSearchChange={setSearchText}
            onCalendarPress={openDatePicker}
            selectedDate={dateFilter}
            onClearDate={clearDateFilter}
          />
        )}
      </View>

      {/* Meetings Container Component */}
      <View style={styles.cardsWrapper}>
        <MeetingsContainer
          meetings={filteredMeetings}
          searchText={searchText}
          highlightText={highlightText}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onCardPress={handleCardPress}
          selectedDate={dateFilter}
        />
      </View>

      {/* Custom Date Picker Modal */}
      <Modal
        visible={showCalendar}
        transparent={true}
        animationType="fade"
        onRequestClose={handleDateCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerModal}>
            <CustomCalendar 
              date={tempDate} 
              onDateChange={setTempDate}
            />
            
            <View style={styles.datePickerButtons}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={handleDateCancel}
              >
                <Text style={styles.cancelButtonText}>CANCEL</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.confirmButton} 
                onPress={handleDateConfirm}
              >
                <Text style={styles.confirmButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex:  1,
    backgroundColor: '#f3f4f6', // Gray background
  },
  
  // Header Wrapper (White background)
  headerWrapper: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity:  0.05,
    shadowRadius: 4,
  },
  
  // Header styles
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#6366f1',
  },
  searchIconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f1f3f5',
  },
  
  // Search Filter Container
  searchFilterContainer: {
    marginTop: 16,
  },
  
  // Filter container styles
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
    gap: 8,
  },
  searchContainer: {
    flex: 1,
  },
  searchInput: {
    height: 40,
    borderColor: '#d1d5db',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    fontSize:  14,
  },
  calendarButton: {
    width: 40,
    height:  40,
    borderRadius:  8,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems:  'center',
  },
  
  // Selected date display styles
  selectedDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical:  8,
    borderRadius:  6,
    marginTop: 12,
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
  
  // Cards Wrapper (Gray background with padding)
  cardsWrapper: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  
  // Scrollview styles
  scrollView: { 
    flex: 1,
  },
  scrollContent: { 
    padding: 16,
    paddingBottom: 20,
  },
  emptyScrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  
  loadingContainer: {
    flex:  1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems:  'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
  cardsContainer: { 
    gap: 16,
  },
  
  // Card styles (White background)
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity:  0.05,
    shadowRadius: 3,
  },
  cardHeader: {
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent:  'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
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
  cardContent: {
    marginBottom: 0,
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
    width: 120,
  },
  valueText: {
    fontSize: 14,
    color: "#495057",
    flex: 1,
    lineHeight: 20
  },

  // Calendar Styles
  modalOverlay: {
    flex:  1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  datePickerModal:  {
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
    color:  '#fff',
    fontWeight: '600',
  },
  datePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    gap: 16,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
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

export default FacultyScheduledMeetings;