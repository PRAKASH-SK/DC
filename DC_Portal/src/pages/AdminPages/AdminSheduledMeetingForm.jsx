import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import axios from 'axios';
import { API_URL } from '../../utils/env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import moment from 'moment';

const { width } = Dimensions.get('window');

const AdminScheduledMeetingForm = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { complaintId, studentId, facultyId } = route.params;
  console.log('Complaint ID:', complaintId, 'Student ID:', studentId, 'Faculty ID:', facultyId);

  // Form states
  const [adminId, setAdminId] = useState(null);
  const [venue, setVenue] = useState('');
  const [info, setInfo] = useState('');
  const [selectedDateTime, setSelectedDateTime] = useState(new Date());
  const [loading, setLoading] = useState(false);

  // Calendar states
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(moment(new Date()));
  const [tempSelectedDate, setTempSelectedDate] = useState(moment(new Date()));

  // Time picker states
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState(9);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedAmPm, setSelectedAmPm] = useState('AM');

  useEffect(() => {
    const fetchAdminId = async () => {
      try {
        const storedId = await AsyncStorage.getItem('user_id');
        if (storedId) {
          setAdminId(storedId);
        } else {
          navigation.navigate('Login');
        }
      } catch (error) {
        console.error('Failed to fetch admin ID:', error);
        Alert.alert('Error', 'Failed to get admin information');
      }
    };
    fetchAdminId();
  }, []);

  // Calendar functions (similar to admin_history)
  const openCalendar = () => {
    setCurrentMonth(moment(selectedDateTime));
    setTempSelectedDate(moment(selectedDateTime));
    setShowCalendar(true);
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(currentMonth.clone().subtract(1, 'month'));
  };

  const goToNextMonth = () => {
    setCurrentMonth(currentMonth.clone().add(1, 'month'));
  };

  const selectCalendarDate = (selectedDay) => {
    if (isCurrentMonth(selectedDay) && !isPastDate(selectedDay)) {
      setTempSelectedDate(selectedDay.clone());
    }
  };

  const isToday = (day) => day.isSame(moment(), 'day');
  const isSelected = (day) => tempSelectedDate && day.isSame(tempSelectedDate, 'day');
  const isCurrentMonth = (day) => day.isSame(currentMonth, 'month');
  const isPastDate = (day) => day.isBefore(moment(), 'day');

  const handleCalendarOK = () => {
    if (tempSelectedDate) {
      // Combine selected date with current time
      const newDateTime = tempSelectedDate.clone()
        .hour(selectedHour === 12 ? (selectedAmPm === 'AM' ? 0 : 12) : 
              selectedAmPm === 'PM' ? selectedHour + 12 : selectedHour)
        .minute(selectedMinute)
        .second(0);
      setSelectedDateTime(newDateTime.toDate());
    }
    setShowCalendar(false);
  };

  const handleCalendarCancel = () => {
    setTempSelectedDate(moment(selectedDateTime));
    setShowCalendar(false);
  };

  const formatSelectedDate = () => {
    if (tempSelectedDate) {
      return tempSelectedDate.format('ddd, MMM D, YYYY');
    }
    return 'Select Date';
  };

  // Time picker functions
  const openTimePicker = () => {
    const currentTime = moment(selectedDateTime);
    setSelectedHour(currentTime.format('h'));
    setSelectedMinute(currentTime.minute());
    setSelectedAmPm(currentTime.format('A'));
    setShowTimePicker(true);
  };

  const handleTimeOK = () => {
    const newDateTime = moment(selectedDateTime)
      .hour(selectedHour === 12 ? (selectedAmPm === 'AM' ? 0 : 12) : 
            selectedAmPm === 'PM' ? parseInt(selectedHour) + 12 : parseInt(selectedHour))
      .minute(selectedMinute)
      .second(0);
    setSelectedDateTime(newDateTime.toDate());
    setShowTimePicker(false);
  };

  const handleTimeCancel = () => {
    setShowTimePicker(false);
  };

  // Generate calendar days
  const getCalendarDays = () => {
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

  // Submit meeting
  const handleSubmitMeeting = async () => {
    if (!venue.trim()) {
      Alert.alert('Error', 'Please enter a venue for the meeting');
      return;
    }

    if (!info.trim()) {
      Alert.alert('Error', 'Please enter meeting information');
      return;
    }

    if (!adminId) {
      Alert.alert('Error', 'Admin information not found');
      return;
    }

    setLoading(true);

    try {
      const formattedDateTime = moment(selectedDateTime).format('YYYY-MM-DD HH:mm:ss');
      
      const response = await axios.post(
        `${API_URL}/api/admin/schedule_meetings/${complaintId}/${adminId}`,
        {
          venue: venue.trim(),
          info: info.trim(),
          date_time: formattedDateTime,
          faculty_id: facultyId,
          student_id: studentId,
        }
      );

      if (response.data.success) {
        Alert.alert(
          'Success',
          `Meeting scheduled successfully!\nMeeting ID: ${response.data.meeting_id}`,
          [
            {
              text: 'OK',
              onPress: () => navigation.pop(2),
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to schedule meeting. Please try again.');
      }
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      Alert.alert('Error', 'Failed to schedule meeting. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Render Calendar Modal
  const renderCalendar = () => {
    const days = getCalendarDays();

    return (
      <Modal
        visible={showCalendar}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCalendarCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerModal}>
            <View style={styles.calendarContainer}>
              {/* Header */}
              <View style={styles.calendarHeader}>
                <Text style={styles.calendarHeaderText}>SELECT DATE</Text>
              </View>

              {/* Selected Date Display */}
              <View style={styles.selectedDateDisplay}>
                <Text style={styles.selectedDateMainText}>
                  {formatSelectedDate()}
                </Text>
                <TouchableOpacity style={styles.editIcon}>
                  <Ionicons name="pencil" size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Month Navigation */}
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

              {/* Week Days Header */}
              <View style={styles.weekDaysHeader}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                  <Text key={index} style={styles.weekDayText}>{day}</Text>
                ))}
              </View>

              {/* Calendar Grid */}
              <View style={styles.calendarGrid}>
                {days.map((day, index) => {
                  const isCurrentMonthDay = isCurrentMonth(day);
                  const isTodayDay = isToday(day);
                  const isSelectedDay = isSelected(day);
                  const isPast = isPastDate(day);

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dayButton,
                        isTodayDay && !isSelectedDay && styles.todayButton,
                        isSelectedDay && styles.selectedDayButton,
                      ]}
                      onPress={() => selectCalendarDate(day)}
                      disabled={isPast || !isCurrentMonthDay}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          !isCurrentMonthDay && styles.inactiveDayText,
                          isTodayDay && !isSelectedDay && styles.todayText,
                          isSelectedDay && styles.selectedDayText,
                          isPast && styles.pastDayText,
                        ]}
                      >
                        {day.date()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            
            {/* Action Buttons */}
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

  // Render Time Picker Modal
  const renderTimePicker = () => {
    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    const minutes = Array.from({ length: 60 }, (_, i) => i);

    return (
      <Modal
        visible={showTimePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={handleTimeCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.timePickerModal}>
            <View style={styles.timePickerHeader}>
              <Text style={styles.timePickerHeaderText}>SELECT TIME</Text>
            </View>

            <View style={styles.timePickerContainer}>
              {/* Hour Picker */}
              <View style={styles.timeColumn}>
                <Text style={styles.timeColumnLabel}>Hour</Text>
                <ScrollView style={styles.timeScrollView} showsVerticalScrollIndicator={false}>
                  {hours.map((hour) => (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.timeOption,
                        selectedHour === hour && styles.selectedTimeOption,
                      ]}
                      onPress={() => setSelectedHour(hour)}
                    >
                      <Text
                        style={[
                          styles.timeOptionText,
                          selectedHour === hour && styles.selectedTimeOptionText,
                        ]}
                      >
                        {hour.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Minute Picker */}
              <View style={styles.timeColumn}>
                <Text style={styles.timeColumnLabel}>Minute</Text>
                <ScrollView style={styles.timeScrollView} showsVerticalScrollIndicator={false}>
                  {minutes.filter(m => m % 5 === 0).map((minute) => (
                    <TouchableOpacity
                      key={minute}
                      style={[
                        styles.timeOption,
                        selectedMinute === minute && styles.selectedTimeOption,
                      ]}
                      onPress={() => setSelectedMinute(minute)}
                    >
                      <Text
                        style={[
                          styles.timeOptionText,
                          selectedMinute === minute && styles.selectedTimeOptionText,
                        ]}
                      >
                        {minute.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* AM/PM Picker */}
              <View style={styles.timeColumn}>
                <Text style={styles.timeColumnLabel}>Period</Text>
                <View style={styles.ampmContainer}>
                  {['AM', 'PM'].map((period) => (
                    <TouchableOpacity
                      key={period}
                      style={[
                        styles.timeOption,
                        selectedAmPm === period && styles.selectedTimeOption,
                      ]}
                      onPress={() => setSelectedAmPm(period)}
                    >
                      <Text
                        style={[
                          styles.timeOptionText,
                          selectedAmPm === period && styles.selectedTimeOptionText,
                        ]}
                      >
                        {period}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.datePickerButtons}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={handleTimeCancel}
              >
                <Text style={styles.cancelButtonText}>CANCEL</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.confirmButton} 
                onPress={handleTimeOK}
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
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Schedule Meeting</Text>
        
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Complaint ID Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle-outline" size={20} color="#6366f1" />
            <Text style={styles.infoTitle}>Complaint Information</Text>
          </View>
          <Text style={styles.complaintIdText}>Complaint ID: {complaintId}</Text>
        </View>

        {/* Form */}
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Ionicons name="calendar-outline" size={20} color="#059669" />
            <Text style={styles.formTitle}>Meeting Details</Text>
          </View>

          {/* Date Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Meeting Date</Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={openCalendar}
            >
              <Text style={styles.dateTimeButtonText}>
                {moment(selectedDateTime).format('DD MMM YYYY')}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#6366f1" />
            </TouchableOpacity>
          </View>

          {/* Time Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Meeting Time</Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={openTimePicker}
            >
              <Text style={styles.dateTimeButtonText}>
                {moment(selectedDateTime).format('hh:mm A')}
              </Text>
              <Ionicons name="time-outline" size={20} color="#6366f1" />
            </TouchableOpacity>
          </View>

          {/* Venue Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Venue</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter meeting venue"
              value={venue}
              onChangeText={setVenue}
              multiline={false}
            />
          </View>

          {/* Meeting Info Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Meeting Information</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Enter additional meeting information, agenda, or notes"
              value={info}
              onChangeText={setInfo}
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleSubmitMeeting}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Schedule Meeting</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Render Modals */}
      {renderCalendar()}
      {renderTimePicker()}
    </View>
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
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
    marginLeft: 8,
  },
  complaintIdText: {
    fontSize: 14,
    color: '#e63946',
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
    marginLeft: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  dateTimeButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dateTimeButtonText: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: '#495057',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#059669',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Calendar Modal Styles (copied from admin_history)
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
    shadowOpacity: 0.3,
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
    fontSize: 24,
    fontWeight: '300',
  },
  editIcon: {
    padding: 4,
  },
  monthNavigation: {
    flexDirection: 'row',
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
    color: '#333',
    fontWeight: '600',
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: '600',
  },
  pastDayText: {
    color: '#ccc',
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

  // Time Picker Styles
  timePickerModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 320,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  timePickerHeader: {
    backgroundColor: '#7c3aed',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  timePickerHeaderText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  timePickerContainer: {
    flexDirection: 'row',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  timeColumn: {
    flex: 1,
    alignItems: 'center',
  },
  timeColumnLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timeScrollView: {
    maxHeight: 150,
    width: '100%',
  },
  timeOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderRadius: 6,
    marginVertical: 2,
  },
  selectedTimeOption: {
    backgroundColor: '#7c3aed',
  },
  timeOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedTimeOptionText: {
    color: '#fff',
    fontWeight: '600',
  },
  ampmContainer: {
    width: '100%',
  },
});

export default AdminScheduledMeetingForm;