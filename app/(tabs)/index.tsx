import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoIcon}>
              <Ionicons name="chatbubble-outline" size={42} color="white" />
            </View>

            <Text style={styles.brandText}>
              Sumbong <Text style={styles.blueText}>PH</Text>
            </Text>

            <Text style={styles.tagline}>
              Your Voice, Your Community&apos;s Future.
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

          {/* Buttons Section */}
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
              activeOpacity={0.8}
              onPress={() => router.push('/login')}
            >
              <Text style={styles.linkText}>I already have an account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function FeatureItem({
  icon,
  title,
  desc,
  iconBg,
  iconColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <View style={styles.featureItem}>
      <View style={[styles.featureIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={26} color={iconColor} />
      </View>

      <View style={styles.featureTextWrap}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDesc}>{desc}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 36,
  },
  logoIcon: {
    width: 88,
    height: 88,
    backgroundColor: '#3B82F6',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 8,
  },
  brandText: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  blueText: {
    color: '#3B82F6',
  },
  tagline: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 16,
    color: '#64748B',
  },
  featuresContainer: {
    gap: 16,
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 20,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#EAEFF5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  featureDesc: {
    marginTop: 3,
    fontSize: 13,
    color: '#64748B',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 10,
    alignItems: 'center',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#3B82F6',
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 18,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 6,
  },
  linkText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});