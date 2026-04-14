import { Stack, useRouter } from 'expo-router';
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Book,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  FileText,
  Globe,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  ShieldCheck,
  Star,
  TriangleAlert,
} from 'lucide-react-native';
import React, { useState } from 'react';

import {
  Linking, // <--- Add this line here
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const HelpAndSupport = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'started' | 'faq' | 'contact'>('started');

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />
      
      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Help & Support</Text>
          <Text style={styles.headerSubtitle}>Everything you need to get started</Text>
        </View>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'started' && styles.activeTab]}
          onPress={() => setActiveTab('started')}
        >
          <Book size={18} color={activeTab === 'started' ? "#000" : "#fff"} />
          <Text style={[styles.tabText, activeTab === 'started' && styles.activeTabText]}>Get Started</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'faq' && styles.activeTab]}
          onPress={() => setActiveTab('faq')}
        >
          <CircleHelp size={18} color={activeTab === 'faq' ? "#000" : "#fff"} />
          <Text style={[styles.tabText, activeTab === 'faq' && styles.activeTabText]}>FAQ</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'contact' && styles.activeTab]}
          onPress={() => setActiveTab('contact')}
        >
          <MessageSquare size={18} color={activeTab === 'contact' ? "#000" : "#fff"} />
          <Text style={[styles.tabText, activeTab === 'contact' && styles.activeTabText]}>Contact</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'started' ? (
          <>
            <View style={styles.welcomeCard}>
              <View style={styles.welcomeHeader}>
                <View style={styles.starIconContainer}>
                  <Star size={20} color="#fff" fill="#fff" />
                </View>
                <View>
                  <Text style={styles.welcomeTitle}>Welcome to SumbongPH!</Text>
                  <Text style={styles.welcomeSubtitle}>Your voice matters in our barangay</Text>
                </View>
              </View>
              <Text style={styles.welcomeDescription}>
                SumbongPH makes it easy to report issues in your community and track their resolution. 
                Follow this quick guide to get started.
              </Text>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>⚡ Quick Start Guide</Text>
            </View>

            <StepItem 
              step="1" 
              title="Create Your Account"
              description="Sign up with your name, address, and contact number. Your purok will be automatically assigned based on your address."
              icon={<ShieldCheck size={24} color="#f59e0b" />}
            />
            <StepItem 
              step="2" 
              title="Report an Issue"
              description="Tap the '+' button to file a new complaint. Choose a category, describe the problem, and add a photo if possible."
              icon={<FileText size={24} color="#f59e0b" />}
            />
            <StepItem 
              step="3" 
              title="Track Your Complaint"
              description="View your active reports on the home screen. Each complaint shows its current status with color-coded updates."
              icon={<MapPin size={24} color="#f59e0b" />}
            />
            <StepItem 
              step="4" 
              title="Get Notified"
              description="Receive real-time updates when your complaint status changes. Check the Alerts tab for all notifications."
              icon={<Bell size={24} color="#f59e0b" />}
            />
            <StepItem 
              step="5" 
              title="Rate the Resolution"
              description="Once your complaint is resolved, you'll be asked to rate the response. Your feedback helps improve services."
              icon={<Star size={24} color="#f59e0b" />}
            />

            <View style={styles.tipsBox}>
              <View style={styles.tipsHeader}>
                <AlertTriangle size={20} color="#1e3a8a" />
                <Text style={styles.tipsHeaderText}>Tips for Faster Resolution</Text>
              </View>
              <TipItem text="Include clear photos of the issue" />
              <TipItem text="Provide the exact location or nearby landmarks" />
              <TipItem text="Be specific in your description (what, where, when)" />
              <TipItem text="Choose the correct category for proper routing" />
              <TipItem text="For emergencies, always call 122 first" />
            </View>
          </>
        ) : activeTab === 'faq' ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
              <Text style={styles.sectionSubtitle}>Find answers to common questions</Text>
            </View>

            <FAQItem question="How do I file a complaint?">
              <Text style={styles.answerText}>
                Tap the <Text style={styles.bold}>"+"</Text> or <Text style={styles.bold}>"Report Now"</Text> button on the home screen. Fill in the subject, select a category, describe the issue in detail, and optionally attach a photo and your location. Then tap "Submit Report".
              </Text>
            </FAQItem>

            <FAQItem question="Can I file a complaint anonymously?">
              <Text style={styles.answerText}>
                <Text style={styles.bold}>Yes.</Text> When filing a complaint, you can check the "Submit Anonymously" option. Your personal information will not be shared with the respondent, but barangay officials may still see it for verification purposes.
              </Text>
            </FAQItem>

            <FAQItem question="How long does it take to resolve a complaint?">
              <Text style={styles.answerText}>
                Resolution time depends on the nature and severity of the complaint. Simple issues like noise complaints are typically addressed within 24-48 hours. Infrastructure issues may take 1-2 weeks. You can track the status of your complaint in real-time through the app.
              </Text>
            </FAQItem>

            <FAQItem question="What do the status colors mean?">
              <View style={styles.statusList}>
                <Text style={styles.answerText}><Text style={{color: '#f59e0b', fontWeight: 'bold'}}>Yellow/Amber</Text> = Pending (your complaint has been received).</Text>
                <Text style={styles.answerText}><Text style={{color: '#3b82f6', fontWeight: 'bold'}}>Blue</Text> = Under Review (an official is reviewing it).</Text>
                <Text style={styles.answerText}><Text style={{color: '#8b5cf6', fontWeight: 'bold'}}>Purple</Text> = In Progress (action is being taken).</Text>
                <Text style={styles.answerText}><Text style={{color: '#10b981', fontWeight: 'bold'}}>Green</Text> = Resolved (the issue has been addressed).</Text>
                <Text style={styles.answerText}><Text style={{color: '#6b7280', fontWeight: 'bold'}}>Gray</Text> = Closed (case is finalized).</Text>
              </View>
            </FAQItem>

            <FAQItem question="Can I edit or withdraw a complaint after submitting?">
              <Text style={styles.answerText}>
                You can add additional information or photos to an existing complaint, but you cannot edit the original submission. To withdraw a complaint, contact the barangay office directly or use the "Contact Barangay" feature.
              </Text>
            </FAQItem>

            <FAQItem question="What types of issues can I report?">
              <Text style={styles.answerText}>
                You can report: Noise disturbances, Infrastructure problems (roads, drainage, streetlights), Sanitation issues (garbage, flooding), Public safety concerns, Neighbor disputes, and other community issues. For emergencies, please call 122 directly.
              </Text>
            </FAQItem>

            <FAQItem question="How do I get notified about updates?">
              <Text style={styles.answerText}>
                You will receive push notifications on your device whenever there is an update to your report. You can also check the "Alerts" tab within the app to see a history of all status changes and official comments.
              </Text>
            </FAQItem>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Can't find what you're looking for?</Text>
              <TouchableOpacity onPress={() => setActiveTab('contact')}>
                <Text style={styles.footerLink}>Send us a message →</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Barangay Office</Text>
              <Text style={styles.sectionSubtitle}>Get in touch with our officials</Text>
            </View>

            <View style={styles.officeCard}>
              <ContactRow 
                icon={<Phone size={20} color="#3b82f6" />} 
                label="Hotline" 
                value="8-9212-796" 
              />
              <ContactRow 
                icon={<Mail size={20} color="#3b82f6" />} 
                label="Email" 
                value="brgy.mangga@quezoncity.gov.ph" 
              />
              <ContactRow 
                icon={<MapPin size={20} color="#3b82f6" />} 
                label="Address" 
                value="134-3c Private Compound, 20th Avenue, Project 4, Q.C." 
              />
              <View style={styles.officeHours}>
                <Text style={styles.officeHoursText}>Mon - Fri: 8:00 AM - 5:00 PM</Text>
              </View>
            </View>

            <View style={[styles.sectionHeader, { marginTop: 10 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TriangleAlert size={20} color="#ef4444" />
                <Text style={[styles.sectionTitle, { color: '#ef4444' }]}>Emergency Hotlines</Text>
              </View>
            </View>

            <HotlineCard label="National Emergency" number="911" color="#ef4444" />
            <HotlineCard label="Barangay Tanod" number="0917-123-4567" color="#f59e0b" />
            <HotlineCard label="Fire Department" number="(02) 8911-1111" color="#f97316" />

<View style={styles.socialSection}>
  <Text style={styles.socialTitle}>Follow Our Page</Text>
  <TouchableOpacity 
    style={styles.socialButton}
    activeOpacity={0.8}
    onPress={() => Linking.openURL('https://quezoncity.gov.ph/brgy-directory/mangga/')}
  >
    <Globe size={18} color="#fff" />
    <Text style={styles.socialButtonText}>Visit Official Website</Text>
  </TouchableOpacity>
</View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Helper Components & Styles remain the same ---
const ContactRow = ({ icon, label, value }: any) => (
  <View style={styles.contactRow}>
    <View style={styles.contactIcon}>{icon}</View>
    <View>
      <Text style={styles.contactLabel}>{label}</Text>
      <Text style={styles.contactValue}>{value}</Text>
    </View>
  </View>
);

const HotlineCard = ({ label, number, color }: any) => (
  <View style={[styles.hotlineCard, { borderColor: color + '33' }]}>
    <Text style={styles.hotlineLabel}>{label}</Text>
    <Text style={[styles.hotlineNumber, { color }]}>{number}</Text>
  </View>
);

const StepItem = ({ step, title, description, icon }: any) => (
  <View style={styles.stepContainer}>
    <View style={styles.stepIconWrapper}><View style={styles.iconCircle}>{icon}</View></View>
    <View style={styles.stepContent}>
      <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>STEP {step}</Text></View>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepDescription}>{description}</Text>
    </View>
  </View>
);

const TipItem = ({ text }: { text: string }) => (
  <View style={styles.tipItem}>
    <CheckCircle size={16} color="#3b82f6" />
    <Text style={styles.tipItemText}>{text}</Text>
  </View>
);

const FAQItem = ({ question, children }: { question: string, children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <View style={styles.faqWrapper}>
      <TouchableOpacity style={styles.faqHeader} onPress={() => setIsOpen(!isOpen)} activeOpacity={0.6}>
        <Text style={styles.questionText}>{question}</Text>
        {isOpen ? <ChevronUp size={20} color="#94a3b8" /> : <ChevronDown size={20} color="#94a3b8" />}
      </TouchableOpacity>
      {isOpen && <View style={styles.answerWrapper}>{children}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 20 : 45, paddingBottom: 25, flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 15 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#9ca3af' },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20, gap: 10 },
  tab: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#1e293b', gap: 8 },
  activeTab: { backgroundColor: '#f59e0b' },
  activeTabText: { fontWeight: '700', color: '#000', fontSize: 13 },
  tabText: { color: '#fff', fontWeight: '500', fontSize: 13 },
  scrollView: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  scrollContent: { padding: 25, paddingBottom: 40 },
  welcomeCard: { backgroundColor: '#fffbeb', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#fef3c7', marginBottom: 25 },
  welcomeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  starIconContainer: { backgroundColor: '#f59e0b', padding: 8, borderRadius: 12 },
  welcomeTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  welcomeSubtitle: { fontSize: 13, color: '#64748b' },
  welcomeDescription: { fontSize: 14, color: '#475569', lineHeight: 20 },
  sectionHeader: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  sectionSubtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  stepContainer: { flexDirection: 'row', marginBottom: 28 },
  stepIconWrapper: { marginRight: 16 },
  iconCircle: { width: 54, height: 54, borderRadius: 16, backgroundColor: '#fff7ed', justifyContent: 'center', alignItems: 'center' },
  stepContent: { flex: 1 },
  stepBadge: { backgroundColor: '#ffedd5', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, marginBottom: 6 },
  stepBadgeText: { color: '#ea580c', fontSize: 11, fontWeight: '800' },
  stepTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b', marginBottom: 5 },
  stepDescription: { fontSize: 14, color: '#64748b', lineHeight: 20 },
  tipsBox: { backgroundColor: '#eff6ff', borderRadius: 20, padding: 20, marginTop: 10, borderWidth: 1, borderColor: '#dbeafe' },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 10 },
  tipsHeaderText: { fontWeight: 'bold', color: '#1e3a8a', fontSize: 16 },
  tipItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 12 },
  tipItemText: { color: '#1e40af', fontSize: 14, flex: 1, lineHeight: 20 },
  faqWrapper: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18 },
  questionText: { fontSize: 15, fontWeight: '600', color: '#334155', flex: 1 },
  answerWrapper: { paddingBottom: 18 },
  answerText: { fontSize: 14, color: '#64748b', lineHeight: 22 },
  statusList: { gap: 6, marginTop: 10 },
  bold: { fontWeight: 'bold', color: '#334155' },
  footer: { marginTop: 40, alignItems: 'center' },
  footerText: { color: '#64748b', fontSize: 14 },
  footerLink: { color: '#f59e0b', fontWeight: 'bold', marginTop: 8 },
  officeCard: { backgroundColor: '#f8fafc', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20 },
  contactRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 15 },
  contactIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  contactLabel: { fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 },
  contactValue: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  officeHours: { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 12, marginTop: 5 },
  officeHoursText: { fontSize: 13, color: '#64748b', fontStyle: 'italic' },
  hotlineCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderRadius: 16, borderWidth: 1, marginBottom: 10, backgroundColor: '#fff' },
  hotlineLabel: { fontSize: 15, fontWeight: '600', color: '#334155' },
  hotlineNumber: { fontSize: 16, fontWeight: 'bold' },
  socialSection: { marginTop: 30, alignItems: 'center' },
  socialTitle: { fontSize: 14, color: '#64748b', marginBottom: 12 },
  socialButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, gap: 10 },
  socialButtonText: { color: '#fff', fontWeight: '600' }
});

export default HelpAndSupport;