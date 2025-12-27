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

// ✅ NEW: Sort Options Component
// ✅ UPDATED: Sort Options Component with Resolved
const SortOptions = ({ selectedSort, onSortChange }) => {
  const sortOptions = [
    { label: 'All', value: 'all', icon: 'list-outline', color: '#6366f1' },
    { label: 'Pending', value: 'pending', icon: 'time-outline', color: '#ad954b' },
    { label: 'Accepted', value:  'accepted', icon: 'checkmark-circle-outline', color: '#22c55e' },
    { label: 'Rejected', value: 'rejected', icon: 'close-circle-outline', color: '#ef4444' },
    { label: 'Resolved', value: 'resolved', icon:  'checkmark-done-circle-outline', color: '#6366f1' }, // ✅ NEW
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

const AdminHistory = () => {
  const navigation = useNavigation();
  
  // ✅ ALL useState hooks at the top
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminId, setAdminId] = useState(null);
  const [adminName, setAdminName] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateFilter, setDateFilter] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(moment(new Date()));
  const [tempSelectedDate, setTempSelectedDate] = useState(moment(new Date()));
  const [selectedSort, setSelectedSort] = useState('all');  // ✅ NEW
  const [sortVisible, setSortVisible] = useState(false);    // ✅ NEW

  // Toggle search visibility and reset search text when closing
  const toggleSearch = () => {
    if (searchVisible) {
      setSearchText("");
      setDateFilter(null);
    }
    setSearchVisible(!searchVisible);
  };

  // ✅ NEW: Toggle sort visibility
  const toggleSort = () => {
    setSortVisible(! sortVisible);
  };

  // ✅ NEW: Handle sort change
  const handleSortChange = (sortValue) => {
    setSelectedSort(sortValue);
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
      setAdminId(storedId);
      setAdminName(storename);

      const res = await axios.get(`${API_URL}/api/admin/get_complaints`);
      if (res.data.success) {
        const data = res.data.data. map((c) => ({
          id: c.complaint_id,
          date: moment(c.date_time).format('YYYY-MM-DD'),
          time: moment(c.date_time).format('HH:mm:ss'),
          code: c.complaint_id,
          venue: c.venue,
          status: c.status?. toLowerCase(),
          details: c.complaint,
          student_id: c.student_id,
          student_name: c.student_name,
          student_reg_num: c.student_reg_num,
          student_emailid: c.student_email,
          faculty_id: c.faculty_id,
          faculty_name: c.faculty_name,
          faculty_email: c.faculty_email,
          date_time: c.date_time,
          reject_message: c.reject_messege || c.revoke_message,
          meeting_alloted: c.meeting_alloted,
          student_department: c.student_department,
          student_year: c.student_year,
          faculty_department: c.faculty_department,
        }));
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

  useEffect(() => {
    fetchUserIdAndComplaints();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (adminId) {
        fetchUserIdAndComplaints();
      }
    }, [adminId])
  );

  const handleCardPress = (complaint) => {
    navigation.navigate('ComplaintDetails', { complaint:  complaint });
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
    if (isCurrentMonth(selectedDay) && !isFutureDate(selectedDay)) {
      setTempSelectedDate(selectedDay. clone());
    }
  };

  const isToday = (day) => day.isSame(moment(), 'day');
  const isSelected = (day) => tempSelectedDate && day.isSame(tempSelectedDate, 'day');
  const isCurrentMonth = (day) => day.isSame(currentMonth, 'month');
  const isFutureDate = (day) => day.isAfter(moment(), 'day');

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
    const today = moment();
    const startOfMonth = currentMonth.clone().startOf('month');
    const endOfMonth = currentMonth.clone().endOf('month');
    const startOfWeek = startOfMonth.clone().startOf('week');
    const endOfWeek = endOfMonth.clone().endOf('week');

    const days = [];
    let day = startOfWeek.clone();

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

  // ✅ UPDATED: Filter with sort logic
  const filteredComplaints = complaints.filter((c) => {
    // Sort filter
    if (selectedSort !== 'all') {
      if (c.status?.toLowerCase() !== selectedSort. toLowerCase()) {
        return false;
      }
    }

    // Date filter
    if (dateFilter && c.date !== dateFilter) {
      return false;
    }

    // Search filter
    if (! searchText) return true;
    
    const s = searchText.toLowerCase();
    const timeStr = moment(c.time, 'HH:mm:ss').format('hh:mm: ss A').toLowerCase();

    return (
      c.student_name?. toLowerCase().includes(s) ||
      c.student_reg_num?.toLowerCase().includes(s) ||
      c.details?.toLowerCase().includes(s) ||
      c.venue?.toLowerCase().includes(s) ||
      c.status?.toLowerCase().includes(s) ||
      c.code?.toString().toLowerCase().includes(s) ||
      c.date?. toLowerCase().includes(s) ||
      c.faculty_name?.toLowerCase().includes(s) ||
      timeStr.includes(s) ||
      c.student_emailid?.toLowerCase().includes(s) ||
      c.faculty_email?.toLowerCase().includes(s) ||
      c.student_department?.toLowerCase().includes(s) ||
      c.student_year?. toString().toLowerCase().includes(s) ||
      c.faculty_department?. toLowerCase().includes(s) ||
      c.reject_message?.toLowerCase().includes(s) ||
      moment(c.date_time).format('DD-MM-YYYY').toLowerCase().includes(s) ||
      moment(c.date_time).format('MM-DD-YYYY').toLowerCase().includes(s) ||
      moment(c.date_time).format('YYYY-MM-DD').toLowerCase().includes(s) ||
      moment(c.date_time).format('DD/MM/YYYY').toLowerCase().includes(s) ||
      moment(c.date_time).format('MM/DD/YYYY').toLowerCase().includes(s) ||
      moment(c.date_time).format('HH:mm').toLowerCase().includes(s) ||
      moment(c.date_time).format('h:mm A').toLowerCase().includes(s) ||
      moment(c.date_time).format('h:mm a').toLowerCase().includes(s)
    );
  });

 const renderComplaintCard = (complaint) => {
  // ✅ UPDATED: Added resolved status
  let badgeStyle = styles.pendingBadge;
  let textStyle = styles.pendingText;
  
  if (complaint.status === 'accepted') {
    badgeStyle = styles.acceptedBadge;
    textStyle = styles.acceptedText;
  } else if (complaint.status === 'rejected') {
    badgeStyle = styles.rejectedBadge;
    textStyle = styles.rejectedText;
  } else if (complaint.status?. toLowerCase() === 'resolved') {  // ✅ NEW
    badgeStyle = styles.resolvedBadge;
    textStyle = styles.resolvedText;
  }
  
  const timeFormatted = moment(complaint.time, 'HH:mm: ss').format('hh:mm A');

  return (
    <TouchableOpacity 
      key={complaint.id} 
      style={styles.card}
      onPress={() => handleCardPress(complaint)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.codeText}>
          {highlightText(complaint.code, searchText)}
        </Text>
        <View style={[styles.statusBadge, badgeStyle]}>
          <Text style={[styles.statusText, textStyle]}>
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
                ?  complaint.student_name.charAt(0).toUpperCase() + complaint.student_name.slice(1).toLowerCase()
                : '',
              searchText
            )}
          </Text>
        </View>

        <View style={styles.complaintRow}>
          <Text style={styles.label}>Register Number:</Text>
          <Text style={styles.valueText}>
            {highlightText(complaint.student_reg_num, searchText)}
          </Text>
        </View>

        <View style={styles.complaintRow}>
          <Text style={styles.label}>Faculty Name:</Text>
          <Text style={styles.valueText}>
            {highlightText(
              complaint.faculty_name
                ? complaint.faculty_name.charAt(0).toUpperCase() + complaint.faculty_name.slice(1).toLowerCase()
                : '',
              searchText
            )}
          </Text>
        </View>

        
      </View>
    </TouchableOpacity>
  );
};
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
                {days. map((day, index) => {
                  const isCurrentMonthDay = isCurrentMonth(day);
                  const isTodayDay = isToday(day);
                  const isSelectedDay = isSelected(day);
                  const isFuture = isFutureDate(day);

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles. dayButton,
                        isTodayDay && ! isSelectedDay && styles.todayButton,
                        isSelectedDay && styles.selectedDayButton,
                      ]}
                      onPress={() => selectCalendarDate(day)}
                      disabled={isFuture || ! isCurrentMonthDay}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          ! isCurrentMonthDay && styles. inactiveDayText,
                          isTodayDay && !isSelectedDay && styles.todayText,
                          isSelectedDay && styles. selectedDayText,
                          isFuture && styles.futureDayText,
                        ]}
                      >
                        {day.date()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            
            <View style={styles. datePickerButtons}>
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
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.HeaderContainer}>
        <View style={styles.HeaderTextContainer}>
          <Text style={styles.HeaderText}>History Of Complaints : </Text>
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

      {/* Search and Date Filter Container */}
      {searchVisible && (
        <View style={styles.filterContainer}>
          <View style={styles.searchRow}>
            <View style={styles.searchInputContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search complaints..."
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
            {filteredComplaints.length > 0 ? (
              filteredComplaints.map(renderComplaintCard)
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
                  {searchText || dateFilter || selectedSort !== 'all'
                    ? "No complaints match your filters" 
                    : "No complaints found"}
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: "#9ca3af",
                  textAlign: 'center'
                }}>
                  {searchText || dateFilter || selectedSort !== 'all'
                    ? "Try adjusting your search or filters" 
                    : "Complaints will appear here"}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet. create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa"
  },
  HeaderContainer:  {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical:  10,
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
    color: '#6366f1',
    marginBottom: 4
  },
  // ✅ NEW: Header buttons container
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIconContainer: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#f1f3f5",
    marginLeft: 8,
  },
  // ✅ NEW: Sort wrapper and styles
  sortWrapper: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  sortContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  sortScrollContent: {
    paddingVertical: 4,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical:  8,
    borderRadius:  20,
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
  filterContainer: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems:  'center',
  },
  searchInputContainer: {
    flex: 1,
    marginRight: 8,
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
  resolvedBadge:  { backgroundColor: "#e0e7ff" },
  resolvedText: { color: "#6366f1" },

  // Calendar Styles (keep all existing)
  modalOverlay: {
    flex:  1,
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
    fontSize:  16,
    fontWeight:  '500',
    color: '#333',
  },
  weekDaysHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
  },
  weekDayText:  {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  calendarGrid: {
    flexDirection:  'row',
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
  selectedDayButton:  {
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

export default AdminHistory;