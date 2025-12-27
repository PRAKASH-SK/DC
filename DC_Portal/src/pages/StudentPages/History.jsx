import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { API_URL } from '../../utils/env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import moment from 'moment';

// ✅ NEW: Sort Options Component
const SortOptions = ({ selectedSort, onSortChange }) => {
  const sortOptions = [
    { label: 'All', value: 'all', icon: 'list-outline', color: '#6366f1' },
    { label: 'Pending', value: 'pending', icon: 'time-outline', color: '#ad954b' },
    { label: 'Accepted', value:  'accepted', icon: 'checkmark-circle-outline', color: '#22c55e' },
    { label: 'Rejected', value:  'rejected', icon: 'close-circle-outline', color:  '#ef4444' },
    { label: 'Resolved', value: 'resolved', icon:  'checkmark-done-circle-outline', color: '#6366f1' },
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

// ✅ UPDATED: Header Component
const HistoryHeader = ({ onSearchToggle, searchVisible, onSortToggle }) => {
  return (
    <View style={styles.headerContainer}>
      <Text style={styles.pageTitle}>My History</Text>
      <View style={styles.headerButtons}>
        <TouchableOpacity 
          style={styles.searchIconButton}
          onPress={onSortToggle}
        >
          <Ionicons name="funnel-outline" size={24} color="#6366f1" />
        </TouchableOpacity>
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
            style={styles. searchInput}
            placeholder="Search complaints..."
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
          <Text style={styles. selectedDateText}>
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

// Complaint Card Component
const ComplaintCard = ({ complaint, searchText, highlightText }) => {
  let badgeStyle = styles.pendingBadge;
  let textStyle = styles.pendingText;
  
  if (complaint.status === 'accepted') {
    badgeStyle = styles.acceptedBadge;
    textStyle = styles.acceptedText;
  } else if (complaint.status === 'rejected') {
    badgeStyle = styles.rejectedBadge;
    textStyle = styles.rejectedText;
  } else if (complaint.status?. toLowerCase() === 'resolved') {
    badgeStyle = styles. resolvedBadge;
    textStyle = styles.resolvedText;
  }

  const dateFormatted = moment(complaint.complaint_date).format('DD-MM-YYYY');
  const timeFormatted = moment(complaint. complaint_time, 'HH:mm: ss').format('hh:mm:ss A');

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles. codeText}>
          {highlightText(complaint.complaint_id, searchText)}
        </Text>
        <View style={[styles.statusBadge, badgeStyle]}>
          <Text style={[styles.statusText, textStyle]}>
            {highlightText(complaint.status || 'Unknown', searchText)}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.complaintRow}>
          <Text style={styles. label}>Complaint Details:</Text>
          <Text style={styles.valueText}>
            {highlightText(complaint.complaint, searchText)}
          </Text>
        </View>

        <View style={styles.complaintRow}>
          <Text style={styles.label}>Venue:</Text>
          <Text style={styles.valueText}>
            {highlightText(complaint.venue, searchText)}
          </Text>
        </View>

        <View style={styles. complaintRow}>
          <Text style={styles.label}>Complaint Date:</Text>
          <Text style={styles.valueText}>
            {highlightText(dateFormatted, searchText)}
          </Text>
        </View>

        <View style={styles.complaintRow}>
          <Text style={styles.label}>Complaint Time:</Text>
          <Text style={styles.valueText}>
            {highlightText(timeFormatted, searchText)}
          </Text>
        </View>
        
        <View style={styles. complaintRow}>
          <Text style={styles.label}>Complaint By:</Text>
          <Text style={styles.valueText}>
            {highlightText(complaint.faculty_name, searchText)}
          </Text>
        </View>

        {complaint.status?. toLowerCase() === 'rejected' && complaint.revoke_message && (
          <View style={styles.complaintRow}>
            <Text style={styles.label}>Revoke Message:</Text>
            <Text style={styles.valueText}>
              {highlightText(complaint.revoke_message, searchText)}
            </Text>
          </View>
        )}

        {/* Show status message for resolved complaints */}
        {complaint.status?.toLowerCase() === 'resolved' && (
          <View style={styles. statusMessageContainer}>
            <Ionicons name="checkmark-done-circle" size={20} color="#6366f1" />
            <Text style={styles.resolvedStatusMessage}>
              This complaint has been resolved
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

// Cards Container Component
const CardsContainer = ({ 
  complaints, 
  searchText, 
  highlightText,
  refreshing,
  onRefresh,
  selectedDate,
  selectedSort
}) => {
  if (complaints.length === 0) {
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.emptyScrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={['#6366f1']}
            tintColor="#6366f1"
          />
        }
      >
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>
            {selectedDate || searchText || selectedSort !== 'all'
              ? "No complaints match your filters" 
              : "No complaint history found"
            }
          </Text>
          <Text style={styles.emptySubtext}>
            {selectedDate || searchText || selectedSort !== 'all'
              ?  "Try adjusting your search or filters" 
              : "Your complaint records will appear here"
            }
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={styles.scrollView}
      contentContainerStyle={styles. scrollContent}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh} 
          colors={['#6366f1']}
          tintColor="#6366f1"
        />
      }
    >
      <View style={styles.cardsContainer}>
        {complaints.map((complaint, index) => (
          <ComplaintCard 
            key={index} 
            complaint={complaint} 
            searchText={searchText}
            highlightText={highlightText}
          />
        ))}
      </View>
    </ScrollView>
  );
};

// Custom Calendar Component (keep existing)
const CustomCalendar = ({ date, onDateChange }) => {
  const [currentMonth, setCurrentMonth] = useState(moment(date));
  const [selectedDay, setSelectedDay] = useState(moment(date).date());

  const today = moment();
  const startOfMonth = currentMonth.clone().startOf('month');
  const endOfMonth = currentMonth.clone().endOf('month');
  const startOfWeek = startOfMonth.clone().startOf('week');
  const endOfWeek = endOfMonth. clone().endOf('week');

  const days = [];
  let day = startOfWeek.clone();

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
  const isFutureDate = (day) => day.isAfter(today, 'day');

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
          const isFuture = isFutureDate(day);

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayButton,
                isTodayDay && ! isSelectedDay && styles.todayButton,
                isSelectedDay && styles.selectedDayButton,
              ]}
              onPress={() => ! isFuture && isCurrentMonthDay && selectDate(day)}
              disabled={isFuture || ! isCurrentMonthDay}
            >
              <Text
                style={[
                  styles.dayText,
                  ! isCurrentMonthDay && styles.inactiveDayText,
                  isTodayDay && !isSelectedDay && styles.todayText,
                  isSelectedDay && styles. selectedDayText,
                  isFuture && styles.futureDayText,
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
const History = () => {
  // ✅ ALL useState hooks at the top
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [studentId, setStudentId] = useState(null);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [selectedSort, setSelectedSort] = useState('all');  // ✅ NEW
  const [sortVisible, setSortVisible] = useState(false);    // ✅ NEW
  
  const navigation = useNavigation();

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const storedId = await AsyncStorage.getItem('user_id');
        if (storedId) setStudentId(storedId);
        else navigation.replace('Login'); 
      } catch (error) {
        console.error("Failed to fetch user ID:", error);
      }
    };
    fetchUserId();
  }, []);

  const fetchComplaintHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/api/student/get_complaints_history/${Number(studentId)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (data.success) {
        setComplaints(data.data || []);
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch complaint history');
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
      Alert.alert('Error', 'Network error. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (studentId) {
      fetchComplaintHistory();
    }
  }, [studentId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchComplaintHistory();
  };

  // Toggle search visibility
  const toggleSearch = () => {
    if (searchVisible) {
      setSearchText('');
      setSelectedDate(null);
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

  // Date picker handlers
  const openDatePicker = () => {
    setTempDate(selectedDate || new Date());
    setIsDatePickerOpen(true);
  };

  const handleDateConfirm = () => {
    setSelectedDate(tempDate);
    setIsDatePickerOpen(false);
  };

  const handleDateCancel = () => {
    setIsDatePickerOpen(false);
  };

  const clearDateFilter = () => {
    setSelectedDate(null);
  };

  // Highlight helper
  const highlightText = (text, searchText) => {
    if (!searchText) return <Text>{text}</Text>;
    const string = text?. toString() ?? '';
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

  // ✅ UPDATED: Filter complaints with sort logic
  const filteredComplaints = complaints.filter((c) => {
    // Sort filter
    if (selectedSort !== 'all') {
      if (c.status?.toLowerCase() !== selectedSort. toLowerCase()) {
        return false;
      }
    }

    // Date filter
    if (selectedDate) {
      const complaintDate = moment(c.complaint_date).format('YYYY-MM-DD');
      const filterDate = moment(selectedDate).format('YYYY-MM-DD');
      if (complaintDate !== filterDate) {
        return false;
      }
    }

    // Text filter
    if (! searchText) return true;
    const s = searchText.toLowerCase();
    const timeStr = moment(c.complaint_time, 'HH:mm:ss').format('hh:mm:ss A').toLowerCase();

    return (
      c.faculty_name?.toLowerCase().includes(s) ||
      c.complaint?.toLowerCase().includes(s) ||
      c.venue?.toLowerCase().includes(s) ||
      c.status?.toLowerCase().includes(s) ||
      c.complaint_id?.toString().toLowerCase().includes(s) ||
      timeStr.includes(s) ||
      c.revoke_message?.toLowerCase().includes(s)
    );
  });

  if (loading) {
    return (
      <View style={styles. container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading complaint history...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Component */}
      <View style={styles.headerWrapper}>
        <HistoryHeader 
          onSearchToggle={toggleSearch}
          searchVisible={searchVisible}
          onSortToggle={toggleSort}
        />

        {/* ✅ NEW: Sort Options */}
        {sortVisible && (
          <View style={styles.sortWrapper}>
            <SortOptions 
              selectedSort={selectedSort}
              onSortChange={handleSortChange}
            />
          </View>
        )}

        {/* Search Filter Bar */}
        {searchVisible && (
          <SearchFilterBar
            searchText={searchText}
            onSearchChange={setSearchText}
            onCalendarPress={openDatePicker}
            selectedDate={selectedDate}
            onClearDate={clearDateFilter}
          />
        )}
      </View>

      {/* Cards Container Component */}
      <View style={styles.cardsWrapper}>
        <CardsContainer
          complaints={filteredComplaints}
          searchText={searchText}
          highlightText={highlightText}
          refreshing={refreshing}
          onRefresh={onRefresh}
          selectedDate={selectedDate}
          selectedSort={selectedSort}
        />
      </View>

      {/* Custom Date Picker Modal */}
      <Modal
        visible={isDatePickerOpen}
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
    backgroundColor: '#f3f4f6',
  },
  
  // Header Wrapper
  headerWrapper: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom:  16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity:  0.05,
    shadowRadius: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
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
  // ✅ NEW: Header buttons container
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f1f3f5',
    marginLeft: 8,
  },
  
  // ✅ NEW: Sort wrapper and styles
  sortWrapper: {
    marginTop: 16,
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
  sortChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 6,
  },
  sortChipTextActive: {
    color: '#fff',
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
  },
  searchContainer: {
    flex: 1,
    marginRight: 8,
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
    alignItems: 'center',
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
  
  // Cards Wrapper
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
  
  // Card styles
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
    justifyContent: 'space-between',
    alignItems:  'center',
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
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical:  4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    borderRadius: 4,
    textTransform: 'capitalize',
  },
  pendingBadge: { backgroundColor: "#fff3cd" },
  pendingText: { color: "#ad954b" },
  acceptedBadge: { backgroundColor:  "#dcfce7" },
  acceptedText: { color: "#22c55e" },
  rejectedBadge: { backgroundColor:  "#fcdcdc" },
  rejectedText: { color: "#ef4444" },
  resolvedBadge: { backgroundColor:  "#e0e7ff" },
  resolvedText: { color: "#6366f1" },
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
    width: 140,
  },
  valueText: {
    fontSize: 14,
    color: "#495057",
    flex: 1,
    lineHeight: 20
  },
  statusMessageContainer: {
    flexDirection:  'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  resolvedStatusMessage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
    flex: 1,
    marginLeft: 8,
  },
  
  // Calendar Modal styles (keep all existing)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  datePickerModal: {
    backgroundColor:  '#fff',
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
    backgroundColor:  '#fff',
  },
  calendarHeader: {
    backgroundColor: '#7c3aed',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  calendarHeaderText: {
    color: '#fff',
    fontSize:  12,
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
    width: '14. 28%',
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
  selectedDayText:  {
    color: '#fff',
    fontWeight: '600',
  },
  futureDayText: {
    color:  '#ccc',
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

export default History;