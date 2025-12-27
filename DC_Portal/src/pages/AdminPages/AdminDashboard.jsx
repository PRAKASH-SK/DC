import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Modal,
  FlatList,
  TextInput,
  StatusBar,
  Image,
  RefreshControl,
  Animated,
} from 'react-native';
import { API_URL } from '../../utils/env'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

const AdminDashboard = () => {
  const navigation = useNavigation();
  const [allStudentsCounts, setAllStudentsCounts] = useState(null);
  const [specificStudentData, setSpecificStudentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [adminId, setAdminId] = useState('');
  const [adminName, setAdminName] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // Student dropdown states
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  
  // Search states for modal
  const [searchText, setSearchText] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);

  // Header search states
  const [headerSearchVisible, setHeaderSearchVisible] = useState(false);
  const [headerSearchText, setHeaderSearchText] = useState('');

  // Animation value
  const [scaleAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const storedId = await AsyncStorage.getItem('user_id');
        const storedName = await AsyncStorage. getItem('user_name');
        if (storedId) {
          setAdminId(storedId);
          setAdminName(storedName || 'Admin');
        } else {
          navigation.replace('Login');
        }
      } catch (error) {
        console.error('Failed to fetch user ID:', error);
      }
    };
    fetchUserId();
  }, []);

  useEffect(() => {
    fetchAllStudentsCounts();
    fetchStudentsList();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (adminId) {
        fetchAllStudentsCounts();
        fetchStudentsList();
      }
    }, [adminId])
  );

  useEffect(() => {
    if (!searchText. trim()) {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student => 
        student.name.toLowerCase().includes(searchText.toLowerCase()) ||
        student.reg_num.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  }, [searchText, students]);



  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchAllStudentsCounts(), fetchStudentsList()]);
    setRefreshing(false);
  };

  const fetchAllStudentsCounts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/getAllStudentsCounts`);
      const data = await response.json();

      if (data.success) {
        setAllStudentsCounts(data);
      } else {
        Alert.alert('Error', 'Failed to fetch total counts');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsList = async () => {
    setStudentsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/getStudents`);
      const data = await response.json();

      if (data.success) {
        setStudents(data.data);
        setFilteredStudents(data.data);
      } else {
        Alert.alert('Error', 'Failed to fetch students list');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Network error while fetching students.');
    } finally {
      setStudentsLoading(false);
    }
  };

  const fetchSpecificStudent = async () => {
    if (!selectedStudent) {
      Alert.alert('Error', 'Please select a student');
      return;
    }

    setSearchLoading(true);
    try {
      const encodedName = encodeURIComponent(selectedStudent.name);
      const encodedRegNum = encodeURIComponent(selectedStudent.reg_num);
      
      const response = await fetch(
        `${API_URL}/api/admin/getStudentProfile/${encodedName}/${encodedRegNum}`,
        {
          method: 'GET',
          headers:  {
            'Content-Type':  'application/json',
          }
        }
      );
      
      const data = await response. json();

      if (data.success) {
        setSpecificStudentData(data);
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch student profile');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  const resetSpecificSearch = () => {
    setSelectedStudent(null);
    setSpecificStudentData(null);
  };

  const openModal = () => {
    setSearchText('');
    setModalVisible(true);
  };

  const closeModal = () => {
    setSearchText('');
    setModalVisible(false);
  };

  const selectStudent = (student) => {
    setSelectedStudent(student);
    closeModal();
    // Animate button press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver:  true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver:  true,
      }),
    ]).start();
  };

  const clearSearch = () => {
    setSearchText('');
  };

  const calculateTotalComplaints = (counts) => {
    return Number(counts.accepted_count || 0) + 
           Number(counts.rejected_count || 0) + 
           Number(counts.resolved_count || 0) + 
           Number(counts. pending_count || 0);
  };

  const CountCard = ({ count, label, icon, gradientColors }) => (
    <View style={styles.countCardWrapper}>
      <LinearGradient
        colors={gradientColors}
        style={styles.countCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y:  1 }}
      >
        <View style={styles.countCardIcon}>
          <Ionicons name={icon} size={28} color="#fff" />
        </View>
        <View style={styles.countCardContent}>
          <Text style={styles. countNumber}>{count}</Text>
          <Text style={styles.countLabel}>{label}</Text>
        </View>
      </LinearGradient>
    </View>
  );

  const renderCountsGrid = (counts) => {
    const totalComplaints = calculateTotalComplaints(counts);
    
    return (
      <View style={styles.countsGrid}>
        <View style={styles.countsRow}>
          <CountCard
            count={counts.accepted_count || 0}
            label="Accepted"
            icon="checkmark-circle"
            gradientColors={['#10b981', '#059669']}
          />
          <CountCard
            count={counts.rejected_count || 0}
            label="Rejected"
            icon="close-circle"
            gradientColors={['#ef4444', '#dc2626']}
          />
        </View>
        <View style={styles.countsRow}>
          <CountCard
            count={counts.pending_count || 0}
            label="Pending"
            icon="time"
            gradientColors={['#f59e0b', '#d97706']}
          />
          <CountCard
            count={counts.resolved_count || 0}
            label="Resolved"
            icon="checkmark-done-circle"
            gradientColors={['#8b5cf6', '#7c3aed']}
          />
        </View>
        <View style={styles.countsRow}>
          <CountCard
            count={totalComplaints}
            label="Total Complaints"
            icon="stats-chart"
            gradientColors={['#6366f1', '#4f46e5']}
          />
        </View>
      </View>
    );
  };

  const renderStudentItem = ({ item }) => {
    const highlightText = (text, searchText) => {
      if (! searchText) return text;
      
      const parts = text.split(new RegExp(`(${searchText})`, 'gi'));
      return (
        <Text>
          {parts.map((part, index) => 
            part.toLowerCase() === searchText.toLowerCase() ? (
              <Text key={index} style={styles. highlightedText}>{part}</Text>
            ) : (
              <Text key={index}>{part}</Text>
            )
          )}
        </Text>
      );
    };

    return (
      <TouchableOpacity
        style={styles.studentItem}
        onPress={() => selectStudent(item)}
        activeOpacity={0.7}
      >
        <View style={styles.studentAvatarContainer}>
          <View style={styles.studentAvatar}>
            <Ionicons name="person" size={20} color="#6366f1" />
          </View>
        </View>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>
            {highlightText(item.name, searchText)}
          </Text>
          <View style={styles.studentRegContainer}>
            <Ionicons name="id-card-outline" size={14} color="#6c757d" />
            <Text style={styles.studentRegNum}>
              {highlightText(item.reg_num, searchText)}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#6c757d" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#fe2752ff" />

      {/* Modern Header with Gradient */}
      <LinearGradient
        colors={['#6366f1', '#4f46e5']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContainer}>
          <Image
            source={require("../../assets/profile.jpeg")}
            style={styles.profileImage}
          />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerText}>Welcome Back</Text>
            <Text style={styles.headerSubText}>{adminName}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Header Search Input */}
      {headerSearchVisible && (
        <View style={styles.headerSearchContainer}>
          <View style={styles.headerSearchWrapper}>
            <Ionicons name="search-outline" size={20} color="#6c757d" />
            <TextInput
              style={styles. headerSearchInput}
              placeholder="Search students or complaints..."
              placeholderTextColor="#9ca3af"
              value={headerSearchText}
              onChangeText={setHeaderSearchText}
              autoFocus={true}
            />
          </View>
        </View>
      )}

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing}  
            onRefresh={handleRefresh}
            colors={['#6366f1']}
            tintColor="#6366f1"
          />
        }
      >
        {/* Total Counts Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bar-chart" size={24} color="#6366f1" />
            <Text style={styles.sectionTitle}>Overview Statistics</Text>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={styles.loadingText}>Loading statistics...</Text>
            </View>
          ) : allStudentsCounts ? (
            renderCountsGrid(allStudentsCounts. counts)
          ) : (
            <TouchableOpacity style={styles.retryButton} onPress={fetchAllStudentsCounts}>
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.retryButtonText}>Retry Loading</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search Specific Student Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person" size={24} color="#6366f1" />
            <Text style={styles.sectionTitle}>Student Profile</Text>
          </View>
          
          {/* Modern Dropdown Button */}
          <TouchableOpacity 
            style={styles.modernDropdownButton} 
            onPress={openModal}
            activeOpacity={0.8}
          >
            <View style={styles.dropdownContent}>
              <View style={styles.dropdownIconContainer}>
                <Ionicons 
                  name={selectedStudent ? "person" : "person-add-outline"} 
                  size={22} 
                  color="#6366f1" 
                />
              </View>
              <View style={styles.dropdownTextContainer}>
                <Text style={styles.dropdownLabel}>
                  {selectedStudent ?  'Selected Student' : 'Select Student'}
                </Text>
                <Text style={[
                  styles.dropdownValue, 
                  ! selectedStudent && styles.placeholderValue
                ]}>
                  {selectedStudent 
                    ? selectedStudent.name
                    : 'Tap to choose a student'
                  }
                </Text>
                {selectedStudent && (
                  <Text style={styles.dropdownRegNum}>
                    {selectedStudent.reg_num}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-down" size={20} color="#6366f1" />
            </View>
          </TouchableOpacity>

          {/* Search Button */}
          <TouchableOpacity 
            style={[
              styles.modernSearchButton,
              (! selectedStudent || searchLoading) && styles.disabledButton
            ]} 
            onPress={fetchSpecificStudent}
            disabled={!selectedStudent || searchLoading}
            activeOpacity={0.8}
          >
            {searchLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="search" size={20} color="#fff" />
                <Text style={styles.modernButtonText}>Search Profile</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Student Profile Results */}
          {specificStudentData && (
            <View style={styles.profileContainer}>
              <View style={styles.profileHeaderCard}>
                <View style={styles.profileAvatarLarge}>
                  <Ionicons name="person" size={40} color="#6366f1" />
                </View>
                <View style={styles.profileHeaderInfo}>
                  <Text style={styles.profileName}>{selectedStudent?. name}</Text>
                  <View style={styles.profileIdContainer}>
                    <Ionicons name="id-card" size={16} color="#6c757d" />
                    <Text style={styles.profileId}>
                      ID: {specificStudentData.student_id}
                    </Text>
                  </View>
                  <View style={styles.profileRegContainer}>
                    <Ionicons name="document-text" size={16} color="#6c757d" />
                    <Text style={styles. profileReg}>
                      {selectedStudent?.reg_num}
                    </Text>
                  </View>
                </View>
              </View>
              
              {specificStudentData.message && (
                <View style={styles.messageCard}>
                  <Ionicons name="information-circle" size={20} color="#6366f1" />
                  <Text style={styles.messageText}>
                    {specificStudentData.message}
                  </Text>
                </View>
              )}

              {renderCountsGrid(specificStudentData. counts)}

              <TouchableOpacity 
                style={styles.resetButton} 
                onPress={resetSpecificSearch}
                activeOpacity={0.8}
              >
                <Ionicons name="close-circle-outline" size={20} color="#fff" />
                <Text style={styles.resetButtonText}>Clear Search</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modern Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles. modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Ionicons name="people" size={24} color="#6366f1" />
                <Text style={styles.modalTitle}>Select Student</Text>
              </View>
              <TouchableOpacity 
                style={styles. closeButton}
                onPress={closeModal}
              >
                <Ionicons name="close" size={24} color="#6c757d" />
              </TouchableOpacity>
            </View>
            
            {/* Modern Search Input */}
            <View style={styles.searchContainer}>
              <View style={styles.searchInputWrapper}>
                <Ionicons name="search" size={20} color="#6c757d" />
                <TextInput
                  style={styles. searchInput}
                  placeholder="Search by name or registration..."
                  placeholderTextColor="#9ca3af"
                  value={searchText}
                  onChangeText={setSearchText}
                />
                {searchText. length > 0 && (
                  <TouchableOpacity 
                    style={styles.clearIconButton}
                    onPress={clearSearch}
                  >
                    <Ionicons name="close-circle" size={20} color="#9ca3af" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Results Info */}
            {searchText.length > 0 && (
              <View style={styles.resultsInfo}>
                <Ionicons name="funnel" size={16} color="#6366f1" />
                <Text style={styles.resultsText}>
                  {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' :  ''} found
                </Text>
              </View>
            )}
            
            {studentsLoading ? (
              <View style={styles.modalLoadingContainer}>
                <ActivityIndicator size="large" color="#6366f1" />
                <Text style={styles.loadingText}>Loading students...</Text>
              </View>
            ) : (
              <FlatList
                data={filteredStudents}
                renderItem={renderStudentItem}
                keyExtractor={(item, index) => `${item.name}-${item.reg_num}-${index}`}
                style={styles.studentsList}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={() => (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="search-outline" size={64} color="#d1d5db" />
                    <Text style={styles.emptyText}>
                      {searchText ?  'No students found' : 'No students available'}
                    </Text>
                    <Text style={styles.emptySubText}>
                      {searchText ? 'Try adjusting your search' : 'Please contact support'}
                    </Text>
                  </View>
                )}
              />
            )}
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
  headerGradient: {
    marginTop: -(StatusBar.currentHeight || 0), // Pull up
    paddingTop: StatusBar.currentHeight || 0,   
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight || 0, // ✅ No extra padding
    paddingBottom: 16,
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
    fontWeight: '500',
  },
  headerSubText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
 
  headerSearchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerSearchWrapper: {
    flexDirection: 'row',
    alignItems:  'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  headerSearchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection:  'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  loadingText: {
    marginTop: 12,
    color: '#6c757d',
    fontSize: 15,
    fontWeight: '500',
  },
  countsGrid: {
    width: '100%',
  },
  countsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  countCardWrapper: {
    flex: 1,
  },
  countCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity:  0.1,
    shadowRadius: 8,
    elevation: 4,
    gap: 16,
  },
  countCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countCardContent: {
    flex: 1,
  },
  countNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  countLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  modernDropdownButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dropdownIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownTextContainer: {
    flex: 1,
  },
  dropdownLabel: {
    fontSize:  12,
    color: '#6c757d',
    fontWeight:  '600',
    marginBottom: 4,
  },
  dropdownValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
  },
  placeholderValue: {
    color: '#9ca3af',
  },
  dropdownRegNum: {
    fontSize: 13,
    color: '#6c757d',
    marginTop: 2,
  },
  modernSearchButton: {
    backgroundColor: '#6366f1',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity:  0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0.1,
  },
  modernButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  retryButton: {
    backgroundColor: '#6c757d',
    borderRadius:  16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize:  16,
    fontWeight:  '700',
  },
  profileContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileHeaderCard: {
    flexDirection: 'row',
    alignItems:  'center',
    paddingBottom: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 16,
  },
  profileAvatarLarge:  {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileHeaderInfo:  {
    flex: 1,
  },
  profileName:  {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  profileIdContainer: {
    flexDirection:  'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  profileId: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  profileRegContainer: {
    flexDirection:  'row',
    alignItems: 'center',
    gap: 6,
  },
  profileReg: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  messageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  messageText: {
    flex: 1,
    fontSize:  14,
    color: '#4f46e5',
    fontWeight: '500',
    lineHeight: 20,
  },
  resetButton: {
    backgroundColor: '#6c757d',
    borderRadius: 12,
    paddingVertical:  14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor:  '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding:  20,
    maxHeight:  '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 8,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInputWrapper: {
    flexDirection:  'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#111827',
  },
  clearIconButton: {
    padding:  4,
  },
  resultsInfo: {
    flexDirection:  'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
    gap: 8,
  },
  resultsText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '600',
  },
  modalLoadingContainer: {
    alignItems: 'center',
    padding: 48,
  },
  studentsList: {
    maxHeight:  450,
  },
  studentItem: {
    flexDirection:  'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
    gap: 12,
  },
  studentAvatarContainer: {
    marginRight: 4,
  },
  studentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  studentRegContainer: {
    flexDirection: 'row',
    alignItems:  'center',
    gap:  6,
  },
  studentRegNum: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight:  '500',
  },
  highlightedText: {
    backgroundColor: '#fef3c7',
    fontWeight: '700',
    color: '#d97706',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 18,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '600',
  },
  emptySubText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default AdminDashboard;