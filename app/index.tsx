import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoIcon}>
            <Ionicons name="chatbubble-outline" size={42} color="white" />
          </View>
          <Text style={styles.brandText}>
            Sumbong <Text style={styles.blueText}>PH</Text>
          </Text>
          <Text style={styles.tagline}>
            Your Voice, Your Community's Future.
          </Text>
        </View>

        {/* Features List */}
        <View style={styles.featuresContainer}>
          <FeatureItem 
            icon="chatbubble-ellipses-outline" 
            iconBg="#EEF4FF" 
            iconColor="#3B82F6"
            title="Report Issues" 
            desc="Floods, garbage, roads & more" 
          />
          <FeatureItem 
            icon="pulse-outline" 
            iconBg="#F0FDF4" 
            iconColor="#22C55E"
            title="Track Real-time" 
            desc="See status updates instantly" 
          />
          <FeatureItem 
            icon="shield-checkmark-outline" 
            iconBg="#F5F3FF" 
            iconColor="#8B5CF6"
            title="Verified Action" 
            desc="Direct from barangay officials" 
          />
        </View>

        {/* Buttons Section - MOVED FURTHER UP */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.primaryButton} 
            activeOpacity={0.9}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.linkText}>I already have an account</Text>
          </TouchableOpacity>
        </View>
        
      </SafeAreaView>
    </View>
  );
}

function FeatureItem({ icon, title, desc, iconBg, iconColor }: any) {
  return (
    <View style={styles.featureItem}>
      <View style={[styles.featureIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={26} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDesc}>{desc}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 30,
    backgroundColor: '#FFFFFF',
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logoIcon: {
    width: 85,
    height: 85,
    backgroundColor: '#3B82F6',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  brandText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#000',
    letterSpacing: -0.5,
  },
  blueText: {
    color: '#3B82F6',
  },
  tagline: {
    textAlign: 'center',
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  featuresContainer: {
    gap: 15,
    paddingBottom: 20, // Space between features and the rising footer
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 22,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  featureDesc: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  footer: {
    marginTop: 'auto', 
    marginBottom: 120, // Increased to 120 to push it even higher
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    width: '100%',
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 17,
  },
  secondaryButton: {
    paddingVertical: 5,
  },
  linkText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
});