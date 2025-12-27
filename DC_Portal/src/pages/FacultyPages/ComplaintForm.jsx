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
import IDScanner from '../../Components/IdScan/IDScanner';

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
  const [showScanner, setShowScanner] = useState(false); // ✅ Scanner state
  
  const searchInputRef = useRef(null);
  const venueInputRef = useRef(null);
  const complaintInputRef = useRef(null);
  
  const navigation = useNavigation();
  const route = useRoute();

  // Check if we're in edit mode
  useEffect(() => {
    if (route.params?.complaintId) {
      setIsEditMode(true);
      setComplaintId(route.params. complaintId);
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

  // Fetch students from backend
  useEffect(() => {
    fetch(`${API_URL}/api/faculty/get_students`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          console.log("Fetched students:", data.data);
          setStudents(data.data);
          console.log("Students :", students);
        } else {
          Alert.alert('Error', 'Failed to fetch students');
        }
      })
      .catch(err => console.log(err));
  }, []);


  // Live clock for display (only for new complaints)
  useEffect(() => {
    if (! isEditMode) {
      const timer = setInterval(() => {
        const now = new Date();
        const formatted =
          now.getFullYear() +
          '-' +
          String(now.getMonth() + 1).padStart(2, '0') +
          '-' +
          String(now.getDate()).padStart(2, '0') +
          ' ' +
          String(now. getHours()).padStart(2, '0') +
          ':' +
          String(now. getMinutes()).padStart(2, '0') +
          ':' +
          String(now. getSeconds()).padStart(2, '0');
        setDateTime(formatted);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isEditMode]);

  // Filter students based on search text
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    student.reg_num.toLowerCase().includes(studentSearch.toLowerCase())
  );


  // ✅ Handle student selection from dropdown
  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setStudentSearch(`${student.name} (${student.reg_num})`);
    setShowDropdown(false);
    venueInputRef.current?.focus();
  };

  // ✅ Dismiss dropdown
  const dismissDropdown = () => {
    setShowDropdown(false);
  };

  // ✅ Toggle dropdown
  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  // ✅ Handle ID scan result
  const handleScanComplete = async ({ name, regNum }) => {
    console.log('Scanned:', { name, regNum });
    console.log('Searching for regNum:', regNum, 'in students list of length', name);

    // Find student in the fetched students list
    const student = students.find(
      s => s.reg_num. toLowerCase() === regNum.toLowerCase()
    );
    console.log('Found student:', student);

    if (student) {
      // Verify name matches (fuzzy match)
      const similarity = calculateSimilarity(
        student.name. toLowerCase(),
        name.toLowerCase()
      );

      if (similarity > 0.7) {
        // Auto-fill student details
        setSelectedStudent(student);
        setStudentSearch(`${student.name} (${student.reg_num})`);
        setShowDropdown(false);
        
        Alert.alert(
          'Student Found!  ✅',
          `Name: ${student.name}\nReg No: ${student.reg_num}`,
          [
            {
              text: 'OK',
              onPress: () => venueInputRef.current?.focus()
            }
          ]
        );
      } else {
        Alert.alert(
          'Name Mismatch',
          `Registration number found but name doesn't match.\n\nScanned: ${name}\nDatabase: ${student.name}\n\nPlease verify the ID card.`,
          [
            { text: 'Retry Scan', onPress: () => setShowScanner(true) },
            { text: 'Manual Entry', onPress: () => searchInputRef.current?.focus() }
          ]
        );
      }
    } else {
      Alert.alert(
        'Student Not Found ❌',
        `Registration number ${regNum} not found in the database.\n\nPlease ensure the student is registered. `,
        [
          { text: 'Retry Scan', onPress: () => setShowScanner(true) },
          { text: 'Manual Entry', onPress: () => searchInputRef.current?.focus() }
        ]
      );
    }
  };

  // ✅ Calculate string similarity
  const calculateSimilarity = (str1, str2) => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  };

  // ✅ Levenshtein distance algorithm
  const levenshteinDistance = (str1, str2) => {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  };

  // ✅ Render dropdown
  const renderDropdown = () => {
    if (!showDropdown) return null;
    
    return (
      <View style={styles.dropdownContainer}>
        {filteredStudents.length > 0 ? (
          <FlatList
            data={filteredStudents. slice(0, 10)}
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

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedStudent || !venue || !complaint) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);

    try {
      const faculty_id = await AsyncStorage.getItem('user_id');
      
      let submitDateTime = dateTime;
      if (! isEditMode) {
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
        response = await fetch(`${API_URL}/api/faculty/updatecomplaint/${complaintId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(`${API_URL}/api/faculty/complaints`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body:  JSON.stringify(payload),
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
              onPress:  () => {
                navigation.goBack();
              }
            }
          ]
        );
        
        if (! isEditMode) {
          setSelectedStudent(null);
          setStudentSearch('');
          setVenue('');
          setComplaint('');
        }
      } else {
        Alert.alert('Error', data. message || 'Something went wrong');
      }
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'Network error');
    } finally {
      setLoading(false);
    }
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
      
      {/* ✅ ID Scanner Modal */}
      <IDScanner
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onScanComplete={handleScanComplete}
      />

      <TouchableWithoutFeedback onPress={dismissDropdown}>
        <View style={styles.container}>
          {/* Header */}
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
            {/* ✅ Scan ID Button */}
            {!isEditMode && (
              <TouchableOpacity
                style={styles.scanButton}
                onPress={() => setShowScanner(true)}
                activeOpacity={0.7}
              >
                <Icon name="scan" size={24} color="#fff" />
                <Text style={styles.scanButtonText}>Scan ID Card</Text>
              </TouchableOpacity>
            )}

            {/* Student Search */}
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
                  name={showDropdown ? "chevron-up" :  "chevron-down"} 
                  size={18} 
                  color="#6b7280" 
                />
              </TouchableOpacity>
              {renderDropdown()}
            </View>

            {/* Venue */}
            <Text style={styles.inputLabel}>Venue</Text>
            <TextInput
              ref={venueInputRef}
              style={styles.input}
              placeholder="Enter venue location"
              value={venue}
              onChangeText={setVenue}
              onFocus={dismissDropdown}
            />

            {/* Complaint Description */}
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
              {isEditMode ? 'Original Date & Time:  ' : 'Date & Time: '}{dateTime}
            </Text>

            {/* Submit Button */}
            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={handleSubmit}
              activeOpacity={0.7}
              disabled={loading}
            >
              <Text style={styles. buttonText}>
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

// ✅ Add scanButton styles
const styles = StyleSheet. create({
  keyboardAvoid: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container:  { 
    flex: 1,
    backgroundColor: '#fff',
  },
  header:  {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ?  65 : 45,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity:  0.1,
    shadowRadius: 1,
  },
  backButton:  {
    padding: 4,
  },
  title:  { 
    fontSize: 20, 
    fontWeight: '600',
    color: '#111827',
    marginLeft: 12,
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems:  'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    padding: 14,
    borderRadius: 8,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width:  0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
    borderWidth:  1,
    borderColor:  '#d1d5db',
    borderRadius: 8,
    padding: 12,
    paddingRight: 40,
    backgroundColor: '#fff',
    fontSize:  15,
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
    marginTop:  2,
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
  button:  {
    backgroundColor: '#2563eb',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 30,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity:  0.2,
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