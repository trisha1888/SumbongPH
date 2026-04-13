import { Timestamp } from 'firebase/firestore';

export const REPORT_CATEGORIES = [
  'Flood',
  'Garbage',
  'Road',
  'Streetlight',
  'Noise',
  'Safety',
  'Other',
] as const;

export const REPORT_URGENCY_LEVELS = ['Low', 'Medium', 'High'] as const;

export type ReportCategory = (typeof REPORT_CATEGORIES)[number];
export type ReportUrgency = (typeof REPORT_URGENCY_LEVELS)[number];
export type ReportStatus = 'Pending' | 'In Progress' | 'Under Review' | 'Resolved';

/**
 * Structured location (for Google Maps)
 */
export type ReportCoordinates = {
  latitude: number;
  longitude: number;
  address: string;
};

export type ReportItem = {
  id: string;
  reportCode: string;
  category: ReportCategory | string;
  title: string;
  description: string;

  // Address
  location: string;

  // Coordinates (REQUIRED)
  latitude: number;
  longitude: number;

  // Structured location (REQUIRED)
  coordinates: ReportCoordinates;

  urgency: ReportUrgency;
  status: ReportStatus;
  barangay: string;

  userId: string;
  userName: string;
  userEmail: string;
  mobileNumber: string;

  // 🔥 timestamps (firebase)
  createdAt?: Timestamp;
  updatedAt?: Timestamp;

  // 🔥 analytics
  resolvedAt?: Timestamp;

  // 🔥 notifications (future)
  isRead?: boolean;
};

export type NewReportInput = {
  category: ReportCategory;
  title: string;
  description: string;

  location: string;

  latitude: number;
  longitude: number;

  coordinates: ReportCoordinates;

  urgency: ReportUrgency;
};