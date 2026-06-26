import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform, 
  SafeAreaView, 
  ScrollView, 
  Linking,
  ActivityIndicator,
  Alert,
  Image // 🔥 Added for the loading logo GIF
} from 'react-native';
import axios from 'axios';
import * as DocumentPicker from 'expo-document-picker';

export default function App() {
  const [activeTab, setActiveTab] = useState('chat'); 
  const [newIntel, setNewIntel] = useState(true); 

  // 🔥 Loading State for System Initialization
  const [isAppLoading, setIsAppLoading] = useState(true); 

  // Chat Subsystem States
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { id: '1', text: 'SYSTEM ONLINE. Strategic Advisor Jarvis at your service, Master Jivan.', sender: 'jarvis' }
  ]);
  const [loading, setLoading] = useState(false);

  // Upload Subsystem States
  const [selectedFile, setSelectedFile] = useState(null);
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [uploading, setUploading] = useState(false);

  // Dynamic Cached States
  const [briefingData, setBriefingData] = useState({ news: [], jobs: [] });
  const [fetchingIntel, setFetchingIntel] = useState(false);

  // System Configurations
  const BASE_URL = "http://10.31.247.21:5000"; 

const BACKEND_URL = "https://j-i-v-a-rnyg.onrender.com/api";
  const INTEL_URL = `${BASE_URL}/api/daily-brief`; 
  const UPLOAD_URL = `${BASE_URL}/api/upload-notes`;

  // Sync with MongoDB Cache & System Bootstrap
  useEffect(() => {
    const bootstrapAsync = async () => {
      setFetchingIntel(true);
      try {
        const res = await axios.get(INTEL_URL);
        if (res.data) {
          setBriefingData({
            news: res.data.news || [],
            jobs: res.data.jobs || []
          });
        }
      } catch (err) {
        console.log("❌ Intel Subsystem Sync Error:", err.message);
      } finally {
        setFetchingIntel(false);
        // 🔥 Systems connected! Jarvis splash screen will turn off after 2.5 seconds fake delay or direct sync
        setTimeout(() => {
          setIsAppLoading(false);
        }, 2500);
      }
    };
    bootstrapAsync();
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { id: Date.now().toString(), text: input, sender: 'jivan' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post(BACKEND_URL, { prompt: input });
      const jarvisMessage = { id: (Date.now() + 1).toString(), text: res.data.reply, sender: 'jarvis' };
      setMessages(prev => [...prev, jarvisMessage]);
    } catch (err) {
      setMessages(prev => [...prev, { id: 'error', text: 'System Error: Connectivity lost.', sender: 'jarvis' }]);
    }
    setLoading(false);
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
      }
    } catch (err) {
      console.log("❌ File selection disrupted:", err);
    }
  };

  const uploadKnowledgeBrief = async () => {
    if (!selectedFile || !subject.trim() || !topic.trim()) {
      Alert.alert("Missing Parameters", "Sir, please select a PDF and define both Subject and Topic layers.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    
    formData.append('pdf', {
      uri: Platform.OS === 'android' ? selectedFile.uri : selectedFile.uri.replace('file://', ''),
      name: selectedFile.name || `brief_${Date.now()}.pdf`,
      type: 'application/pdf',
    });
    formData.append('subject', subject);
    formData.append('topic', topic);

    try {
      const response = await axios.post(UPLOAD_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      Alert.alert("Knowledge Absorbed", response.data.reply || "Matrix updated.");
      setSelectedFile(null);
      setSubject('');
      setTopic('');
    } catch (error) {
      Alert.alert("Absorption Failed", "Could not synchronize the document to Jarvis brain.");
    } finally {
      setUploading(false);
    }
  };

  const downloadBriefPDF = () => {
    console.log("Downloading Full PDF Briefing Report...");
  };

  // --- 🔥 RIGHT PLACE TO PUT THE LOADING COMPONENT ---
  if (isAppLoading) {
    return (
      <View style={styles.loadingContainer}>
         <Image source={require('./assets/jarvis-logo.gif')} style={styles.loadingLogo} />
         <Text style={styles.loadingText}>INITIALIZING SYSTEMS...</Text>
         <ActivityIndicator size="small" color="#00ffcc" />
      </View>
    );
  }

  // --- MAIN APP UI RENDERS ONLY IF IS_APP_LOADING IS FALSE ---
  const IntelDashboard = ({ data }) => (
    <ScrollView style={styles.intelScroll} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.intelTitle}>CORE KNOWLEDGE INFILTRATION</Text>
      <View style={styles.uploadSection}>
        <TextInput 
          style={styles.vaultInput}
          placeholder="Target Subject (e.g. Discrete Mathematics)"
          placeholderTextColor="#486581"
          value={subject}
          onChangeText={setSubject}
        />
        <TextInput 
          style={styles.vaultInput}
          placeholder="Target Topic (e.g. Truth Tables)"
          placeholderTextColor="#486581"
          value={topic}
          onChangeText={setTopic}
        />

        <View style={styles.uploadBtnRow}>
          <TouchableOpacity style={styles.selectFileBtn} onPress={pickDocument}>
            <Text style={styles.selectFileText}>
              {selectedFile ? `📁 ${selectedFile.name.slice(0, 15)}...` : "📄 SELECT ACADEMIC PDF"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.absorbBtn, (!selectedFile || uploading) && styles.disabledBtn]} 
            onPress={uploadKnowledgeBrief}
            disabled={!selectedFile || uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={styles.absorbText}>ABSORB NOTES</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.intelTitle}>MORNING STRATEGIC BRIEF</Text>
      <TouchableOpacity style={styles.pdfBtn} onPress={downloadBriefPDF}>
        <Text style={styles.pdfBtnText}>📥 DOWNLOAD FULL PDF REPORT</Text>
      </TouchableOpacity>

      {/* News Layer */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>TECH NEWS</Text>
        {data.news.length === 0 ? (
          <Text style={styles.emptyText}>No fresh tech news tracked today, Sir.</Text>
        ) : (
          data.news.map((item, index) => (
            <View key={index.toString()} style={styles.newsCard}>
              <Text style={styles.newsText}>{item.summary}</Text>
            </View>
          ))
        )}
      </View>

      {/* Jobs Layer */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>FRESH OPPORTUNITIES</Text>
        {data.jobs.length === 0 ? (
          <Text style={styles.emptyText}>No premium hiring trends in the last 24h, Sir.</Text>
        ) : (
          data.jobs.map((job, index) => (
            <View key={index.toString()} style={styles.jobCard}>
              <Text style={styles.jobTitle}>{job.title}</Text>
              <Text style={styles.companyName}>{job.company || 'Unknown Company'}</Text>
              <TouchableOpacity style={styles.applyTouchable} onPress={() => job.link && Linking.openURL(job.link)}>
                <Text style={styles.applyBtn}>APPLY NOW</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>JARVIS COMMAND CENTER</Text>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('chat')}>
          <Text style={[styles.tabText, activeTab === 'chat' && styles.activeTabText]}>COMMAND</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.tabItem} onPress={() => {
          setActiveTab('intel');
          setNewIntel(false); 
        }}>
          <View style={styles.intelTabContainer}>
            <Text style={[styles.tabText, activeTab === 'intel' && styles.activeTabText]}>DAILY INTEL</Text>
            {newIntel && <View style={styles.notificationDot} />} 
          </View>
        </TouchableOpacity>
      </View>

      {activeTab === 'chat' ? (
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <FlatList
            data={messages}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={[styles.bubble, item.sender === 'jarvis' ? styles.jarvisBubble : styles.jivanBubble]}>
                <Text style={styles.senderName}>{item.sender === 'jarvis' ? 'J.A.R.V.I.S.' : 'MASTER JIVAN'}</Text>
                <Text style={styles.messageText}>{item.text}</Text>
              </View>
            )}
            contentContainerStyle={{ paddingVertical: 20 }}
          />

          <View style={styles.inputArea}>
            <TextInput
              style={styles.input}
              placeholder="Enter command or query..."
              placeholderTextColor="#486581"
              value={input}
              onChangeText={setInput}
              multiline
            />
            <TouchableOpacity style={styles.sendBtn} onPress={sendMessage} disabled={loading}>
              <Text style={styles.sendText}>{loading ? '...' : 'EXECUTE'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      ) : (
        <IntelDashboard data={briefingData} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#040814' },
  header: { paddingTop: Platform.OS === 'android' ? 35 : 15, paddingBottom: 15, alignItems: 'center', borderBottomWidth: 1, borderColor: '#102a43' },
  title: { color: '#00ffcc', fontSize: 18, fontWeight: 'bold', letterSpacing: 3 },
  
  // 🔥 NEW LOADING LAYOUT STYLES
  loadingContainer: { flex: 1, backgroundColor: '#040814', justifyContent: 'center', alignItems: 'center' },
  loadingLogo: { width: 140, height: 140, marginBottom: 20, resizeMode: 'contain' },
  loadingText: { color: '#00ffcc', fontSize: 13, fontWeight: 'bold', letterSpacing: 4, marginBottom: 15 },

  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#102a43', backgroundColor: '#0a1021' },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 15 },
  tabText: { color: '#486581', fontWeight: 'bold', letterSpacing: 2, fontSize: 13 },
  activeTabText: { color: '#00ffcc' },
  intelTabContainer: { flexDirection: 'row', alignItems: 'center' },
  notificationDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ff0055', marginLeft: 6, bottom: 4 },

  bubble: { marginHorizontal: 15, marginVertical: 10, padding: 15, borderRadius: 15, maxWidth: '85%' },
  jarvisBubble: { alignSelf: 'flex-start', backgroundColor: '#0b132b', borderLeftWidth: 3, borderColor: '#00ffcc' },
  jivanBubble: { alignSelf: 'flex-end', backgroundColor: '#1c2541', borderRightWidth: 3, borderColor: '#62b6cb' },
  senderName: { fontSize: 10, color: '#486581', fontWeight: 'bold', marginBottom: 5, letterSpacing: 1 },
  messageText: { color: '#62b6cb', fontSize: 15, lineHeight: 22 },
  inputArea: { flexDirection: 'row', padding: 15, backgroundColor: '#0a1021', borderTopWidth: 1, borderColor: '#102a43', alignItems: 'center' },
  input: { flex: 1, color: '#fff', backgroundColor: '#040814', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10, marginRight: 10, fontSize: 16, maxHeight: 100 },
  sendBtn: { backgroundColor: '#00ffcc', paddingHorizontal: 20, height: 40, justifyContent: 'center', borderRadius: 20 },
  sendText: { color: '#000', fontWeight: 'bold', fontSize: 12 },

  intelScroll: { flex: 1, padding: 20 },
  intelTitle: { color: '#00ffcc', fontSize: 16, fontWeight: 'bold', letterSpacing: 2, textAlign: 'center', marginVertical: 15 },
  uploadSection: { backgroundColor: '#0b132b', padding: 15, borderRadius: 10, marginBottom: 20, borderWidth: 1, borderColor: '#102a43' },
  vaultInput: { backgroundColor: '#040814', color: '#fff', borderRadius: 8, padding: 10, marginBottom: 10, fontSize: 14, borderWidth: 1, borderColor: '#102a43' },
  uploadBtnRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  selectFileBtn: { backgroundColor: '#102a43', flex: 1, marginRight: 10, borderRadius: 8, justifyContent: 'center', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: '#486581' },
  selectFileText: { color: '#62b6cb', fontWeight: 'bold', fontSize: 11 },
  absorbBtn: { backgroundColor: '#00ffcc', flex: 1, borderRadius: 8, justifyContent: 'center', alignItems: 'center', padding: 12 },
  absorbText: { color: '#000', fontWeight: 'bold', fontSize: 11 },
  disabledBtn: { backgroundColor: '#243356', opacity: 0.6 },

  pdfBtn: { backgroundColor: '#102a43', borderWidth: 1, borderColor: '#00ffcc', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 25 },
  pdfBtnText: { color: '#00ffcc', fontWeight: 'bold', letterSpacing: 1 },
  section: { marginBottom: 30 },
  sectionHeader: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 2, marginBottom: 15, borderLeftWidth: 3, borderColor: '#00ffcc', paddingLeft: 10 },
  newsCard: { backgroundColor: '#0b132b', padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#102a43' },
  newsText: { color: '#62b6cb', fontSize: 14, lineHeight: 20 },
  jobCard: { backgroundColor: '#1c2541', padding: 15, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: '#243356' },
  jobTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  companyName: { color: '#486581', fontSize: 14, marginVertical: 5 },
  applyTouchable: { alignSelf: 'flex-start', marginTop: 5 },
  applyBtn: { color: '#00ffcc', fontWeight: 'bold', fontSize: 13, letterSpacing: 1 },
  emptyText: { color: '#486581', italic: true, fontSize: 14, marginTop: 5 }
});