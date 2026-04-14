import { LucideIcon } from 'lucide-react-native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ContactRowProps {
  Icon: LucideIcon;
  label: string;
  value: string;
  iconBg: string;
  iconColor: string;
}

export const ContactRow = ({ Icon, label, value, iconBg, iconColor }: ContactRowProps) => {
  return (
    <View style={styles.contactRow}>
      <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
        <Icon size={20} color={iconColor} />
      </View>
      <View style={styles.contactTextContainer}>
        <Text style={styles.contactLabel}>{label}</Text>
        <Text style={styles.contactValue}>{value}</Text>
      </View>
    </View>
  );
};

interface EmergencyItemProps {
  label: string;
  value: string;
  color: string;
  bg: string;
}

export const EmergencyItem = ({ label, value, color, bg }: EmergencyItemProps) => {
  return (
    <TouchableOpacity style={[styles.emergencyItem, { backgroundColor: bg }]}>
      <Text style={[styles.emergencyLabel, { color }]}>{label}</Text>
      <Text style={[styles.emergencyValue, { color }]}>{value}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  contactRow: { flexDirection: 'row', padding: 15, alignItems: 'center' },
  iconContainer: { padding: 10, borderRadius: 12 },
  contactTextContainer: { marginLeft: 15 },
  contactLabel: { fontSize: 12, color: '#64748b', marginBottom: 2 },
  contactValue: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  emergencyItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 18, borderRadius: 12, marginBottom: 10 },
  emergencyLabel: { fontSize: 15, fontWeight: '700' },
  emergencyValue: { fontSize: 15, fontWeight: '700' },
});