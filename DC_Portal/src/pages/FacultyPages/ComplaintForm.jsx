import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  Dimensions,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../utils/env';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

const { height, width } = Dimensions.get('window');

const ComplaintForm = () => {
  const [students, setStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [venue, setVenue] = useState('');
  const [complaint, setComplaint] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [complaintId, setComplaintId] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const searchInputRef = useRef(null);
  const venueInputRef = useRef(null);
  const complaintInputRef = useRef(null);
  
  const navigation = useNavigation();
  const route = useRoute();

  // Check if we're in edit mode
  useEffect(() => {
    if (route.params?.complaintId) {
      setIsEditMode(true);
      setComplaintId(route.params.complaintId);
      fetchComplaintDetails(route.params.complaintId);
    }
  }, [route.params]);

  // Fetch complaint details for editing
  const fetchComplaintDetails = async (id) => {
    console.log("Fetching complaint details for ID:", id);
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/faculty/complaints/${id}`);
      const data = await response.json();
      console.log("Fetched complaint data:", data);
      if (data.success) {
        const complaintData = data.data;
        setSelectedStudent({
          name: complaintData.student_name,
          reg_num: complaintData.reg_num,
          emailid: complaintData.student_emailid
        });
        setStudentSearch(`${complaintData.student_name} (${complaintData.reg_num})`);
        setVenue(complaintData.venue);
        setComplaint(complaintData.complaint);
        
        // Format the date_time for display
        const formattedDateTime = new Date(complaintData.date_time).toLocaleString('sv-SE').replace('T', ' ');
        setDateTime(formattedDateTime);
      } else {
        Alert.alert('Error', 'Failed to fetch complaint details');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error fetching complaint:', error);
      Alert.alert('Error', 'Network error while fetching complaint details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // fetch students from backend
  useEffect(() => {
    fetch(`${API_URL}/api/faculty/get_students`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          console.log("Fetched students:", data.data);
          setStudents(data.data);
        } else {
          Alert.alert('Error', 'Failed to fetch students');
        }
      })
      .catch(err => console.log(err));
  }, []);

  // live clock for display (only for new complaints)
  useEffect(() => {
    if (!isEditMode) {
      const timer = setInterval(() => {
        const now = new Date();
        const formatted =
          now.getFullYear() +
          '-' +
          String(now.getMonth() + 1).padStart(2, '0') +
          '-' +
          String(now.getDate()).padStart(2, '0') +
          ' ' +
          String(now.getHours()).padStart(2, '0') +
          ':' +
          String(now.getMinutes()).padStart(2, '0') +
          ':' +
          String(now.getSeconds()).padStart(2, '0');
        setDateTime(formatted);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isEditMode]);

  // Filter students based on search text for both name and reg_num
  const filteredStudents = students.filter(student =>
    console.log("Filtering student:", student, "with search:", studentSearch) || 
    student.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    student.reg_num.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setStudentSearch(`${student.name} (${student.reg_num})`);
    setShowDropdown(false);
    
    // Move focus to the next field
    venueInputRef.current?.focus();
  };

  const dismissDropdown = () => {
    setShowDropdown(false);
  };

  const handleSubmit = async () => {
    if (!selectedStudent || !venue || !complaint) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);

    try {
      const faculty_id = await AsyncStorage.getItem('user_id');
      
      // Get current time for new complaints or use existing time for edits
      let submitDateTime = dateTime;
      if (!isEditMode) {
        const now = new Date();
        submitDateTime =
          now.getFullYear() +
          '-' +
          String(now.getMonth() + 1).padStart(2, '0') +
          '-' +
          String(now.getDate()).padStart(2, '0') +
          ' ' +
          String(now.getHours()).padStart(2, '0') +
          ':' +
          String(now.getMinutes()).padStart(2, '0') +
          ':' +
          String(now.getSeconds()).padStart(2, '0');
      }

      const payload = {
        student_name: selectedStudent.name,
        reg_num: selectedStudent.reg_num,
        venue,
        complaint,
        date_time: submitDateTime,
        faculty_id,
      };

      let response;
      if (isEditMode) {
        // Update existing complaint
        response = await fetch(`${API_URL}/api/faculty/updatecomplaint/${complaintId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
         
        });
      } else {
        // Create new complaint
        response = await fetch(`${API_URL}/api/faculty/complaints`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await response.json();
      if (response.ok) {
        Alert.alert(
          'Success', 
          isEditMode ? 'Complaint updated successfully' : 'Complaint created successfully',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.goBack();
              }
            }
          ]
        );
        
        if (!isEditMode) {
          // Clear form only for new complaints
          setSelectedStudent(null);
          setStudentSearch('');
          setVenue('');
          setComplaint('');
        }
      } else {
        Alert.alert('Error', data.message || 'Something went wrong');
      }
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const renderDropdown = () => {
    if (!showDropdown) return null;
    
    return (
      <View style={styles.dropdownContainer}>
        {filteredStudents.length > 0 ? (
          <FlatList
            data={filteredStudents.slice(0, 10)} // Limit to prevent performance issues
            keyExtractor={(item, index) => `student_${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => handleStudentSelect(item)}
              >
                <Text style={styles.dropdownText}>{item.name}</Text>
                <Text style={styles.dropdownSubText}>{item.reg_num}</Text>
              </TouchableOpacity>
            )}
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <Text style={styles.noResults}>No students found</Text>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardAvoid}
    >
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      <TouchableWithoutFeedback onPress={dismissDropdown}>
        <View style={styles.container}>
          {/* Header with Back Button */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color="#2563eb" />
            </TouchableOpacity>
            <Text style={styles.title}>
              {isEditMode ? 'Edit Complaint' : 'Complaint Form'}
            </Text>
          </View>

          <View style={styles.formContainer}>
            {/* Student Search with Dropdown (Both Name and Reg Num) */}
            <Text style={styles.inputLabel}>Student Information</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder="Search by name or registration number..."
                value={studentSearch}
                onChangeText={(text) => {
                  setStudentSearch(text);
                  setShowDropdown(true);
                  
                  // If search is cleared, reset the selected student
                  if (text === '') {
                    setSelectedStudent(null);
                  }
                }}
                onFocus={() => setShowDropdown(true)}
              />
              <TouchableOpacity 
                style={styles.dropdownArrow}
                onPress={toggleDropdown}
              >
                <Icon 
                  name={showDropdown ? "chevron-up" : "chevron-down"} 
                  size={18} 
                  color="#6b7280" 
                />
              </TouchableOpacity>
              {renderDropdown()}
            </View>

            <Text style={styles.inputLabel}>Venue</Text>
            <TextInput
              ref={venueInputRef}
              style={styles.input}
              placeholder="Enter venue location"
              value={venue}
              onChangeText={setVenue}
              onFocus={dismissDropdown}
            />

            <Text style={styles.inputLabel}>Complaint Description</Text>
            <TextInput
              ref={complaintInputRef}
              style={[styles.input, styles.textArea]}
              placeholder="Describe the complaint in detail..."
              value={complaint}
              onChangeText={setComplaint}
              multiline={true}
              textAlignVertical="top"
              numberOfLines={4}
              onFocus={dismissDropdown}
            />

            <Text style={styles.dateText}>
              {isEditMode ? 'Original Date & Time: ' : 'Date & Time: '}{dateTime}
            </Text>

            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={handleSubmit}
              activeOpacity={0.7}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading 
                  ? (isEditMode ? 'Updating...' : 'Submitting...') 
                  : (isEditMode ? 'Update Complaint' : 'Submit Complaint')
                }
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoid: {
    // paddingTop: 30,
    flex: 1,
    backgroundColor: '#fff',
  },
  container: { 
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 65 : 45,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  backButton: {
    padding: 4,
  },
  title: { 
    fontSize: 20, 
    fontWeight: '600',
    color: '#111827',
    marginLeft: 12,
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
    marginBottom: 6,
    marginLeft: 4,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
    fontSize: 15,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    paddingRight: 40, // Make room for the arrow icon
    backgroundColor: '#fff',
    fontSize: 15,
  },
  dropdownArrow: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 2,
    zIndex: 2,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  dropdownContainer: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    zIndex: 1000,
    elevation: 5,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dropdownText: {
    fontSize: 15,
    color: '#111827',
  },
  dropdownSubText: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  noResults: {
    padding: 12,
    textAlign: 'center',
    color: '#6b7280',
  },
  dateText: { 
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
    textAlign: 'right',
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 30,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: { 
    color: '#fff', 
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ComplaintForm;