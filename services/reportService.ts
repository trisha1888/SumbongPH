import { auth, db } from '@/firebaseConfig';
import {
  NewReportInput,
  ReportCoordinates,
  ReportItem,
  ReportStatus,
} from '@/models/report';
import {
  addDoc,
  collection,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';

type UserProfile = {
  uid: string;
  name: string;
  email: string;
  barangay: string;
  mobileNumber: string;
};

const normalizeStatus = (status: unknown): ReportStatus => {
  const value = String(status ?? '').trim().toLowerCase();

  switch (value) {
    case 'resolved':
      return 'Resolved';
    case 'in progress':
    case 'in-progress':
      return 'In Progress';
    case 'under review':
    case 'under-review':
      return 'Under Review';
    case 'pending':
    default:
      return 'Pending';
  }
};

const getCurrentUserProfile = async (): Promise<UserProfile> => {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error('You must be logged in to submit a report.');
  }

  const userQuery = query(collection(db, 'users'), where('uid', '==', currentUser.uid));
  const userSnapshot = await getDocs(userQuery);

  if (!userSnapshot.empty) {
    const data = userSnapshot.docs[0].data();

    return {
      uid: currentUser.uid,
      name: data.name || currentUser.displayName || 'User',
      email: data.email || currentUser.email || '',
      barangay: data.barangay || '',
      mobileNumber: data.mobileNumber || '',
    };
  }

  return {
    uid: currentUser.uid,
    name: currentUser.displayName || 'User',
    email: currentUser.email || '',
    barangay: '',
    mobileNumber: '',
  };
};

const generateReportCode = () => {
  const now = new Date();
  const year = now.getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `SBP-${year}-${random}`;
};

const normalizeCoordinates = (data: any): ReportCoordinates => {
  const latitude =
    typeof data?.coordinates?.latitude === 'number'
      ? data.coordinates.latitude
      : typeof data?.latitude === 'number'
        ? data.latitude
        : 0;

  const longitude =
    typeof data?.coordinates?.longitude === 'number'
      ? data.coordinates.longitude
      : typeof data?.longitude === 'number'
        ? data.longitude
        : 0;

  const address =
    typeof data?.coordinates?.address === 'string' && data.coordinates.address.trim()
      ? data.coordinates.address.trim()
      : typeof data?.location === 'string'
        ? data.location.trim()
        : '';

  return {
    latitude,
    longitude,
    address,
  };
};

export const getReportDate = (report: ReportItem): Date | null => {
  try {
    if (!report.createdAt) return null;

    if (typeof report.createdAt?.toDate === 'function') {
      return report.createdAt.toDate();
    }

    if (report.createdAt?.seconds) {
      return new Date(report.createdAt.seconds * 1000);
    }

    if (typeof report.createdAt === 'string' || typeof report.createdAt === 'number') {
      const parsed = new Date(report.createdAt);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    return null;
  } catch {
    return null;
  }
};

const sortReportsNewestFirst = (reports: ReportItem[]) => {
  return [...reports].sort((a, b) => {
    const aTime = getReportDate(a)?.getTime() ?? 0;
    const bTime = getReportDate(b)?.getTime() ?? 0;
    return bTime - aTime;
  });
};

const mapReportDoc = (doc: any): ReportItem => {
  const data = doc.data();
  const coordinates = normalizeCoordinates(data);

  return {
    id: doc.id,
    reportCode: data.reportCode || '',
    category: data.category || 'Other',
    title: data.title || '',
    description: data.description || '',
    location: data.location || coordinates.address || '',
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    coordinates,
    urgency: data.urgency || 'Low',
    status: normalizeStatus(data.status),
    barangay: data.barangay || '',
    userId: data.userId || '',
    userName: data.userName || '',
    userEmail: data.userEmail || '',
    mobileNumber: data.mobileNumber || '',
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    resolvedAt: data.resolvedAt,
    isRead: data.isRead ?? false,
  };
};

export const submitReport = async (
  input: NewReportInput
): Promise<{ id: string; reportCode: string }> => {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error('You must be logged in to submit a report.');
  }

  const profile = await getCurrentUserProfile();
  const reportCode = generateReportCode();

  const safeCoordinates: ReportCoordinates = {
    latitude: input.coordinates?.latitude ?? input.latitude,
    longitude: input.coordinates?.longitude ?? input.longitude,
    address: input.coordinates?.address?.trim() || input.location.trim(),
  };

  const docRef = await addDoc(collection(db, 'reports'), {
    reportCode,
    category: input.category,
    title: input.title.trim(),
    description: input.description.trim(),
    location: input.location.trim(),
    latitude: input.latitude,
    longitude: input.longitude,
    coordinates: safeCoordinates,
    urgency: input.urgency,
    status: 'Pending',
    userId: profile.uid,
    userName: profile.name,
    userEmail: profile.email,
    barangay: profile.barangay,
    mobileNumber: profile.mobileNumber,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return {
    id: docRef.id,
    reportCode,
  };
};

export const fetchReports = async (): Promise<ReportItem[]> => {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    return [];
  }

  const reportsQuery = query(collection(db, 'reports'), where('userId', '==', currentUser.uid));
  const snapshot = await getDocs(reportsQuery);
  const reports = snapshot.docs.map(mapReportDoc);

  return sortReportsNewestFirst(reports);
};

export const subscribeToMyReports = (
  callback: (reports: ReportItem[]) => void,
  onError?: (error: any) => void
) => {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    callback([]);
    return () => {};
  }

  const reportsQuery = query(collection(db, 'reports'), where('userId', '==', currentUser.uid));

  return onSnapshot(
    reportsQuery,
    (snapshot) => {
      const reports = snapshot.docs.map(mapReportDoc);
      callback(sortReportsNewestFirst(reports));
    },
    (error) => {
      console.log('SUBSCRIBE REPORTS ERROR:', error);
      if (onError) onError(error);
    }
  );
};

export const isResolvedStatus = (status: string) => {
  return normalizeStatus(status) === 'Resolved';
};

export const isReportRecentWithinDays = (report: ReportItem, days: number) => {
  const reportDate = getReportDate(report);

  if (!reportDate) return false;

  const now = new Date();
  const diffMs = now.getTime() - reportDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return diffDays <= days;
};

export const formatReportDate = (report: ReportItem) => {
  const reportDate = getReportDate(report);

  if (!reportDate) return 'Just now';

  return reportDate.toLocaleDateString();
};

export const formatTimeAgo = (report: ReportItem) => {
  const reportDate = getReportDate(report);

  if (!reportDate) return 'Just now';

  const now = new Date();
  const diffMs = now.getTime() - reportDate.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

export const getPendingReportsCount = (reports: ReportItem[]) => {
  return reports.filter((report) => !isResolvedStatus(report.status)).length;
};

export const getResolvedReportsCount = (reports: ReportItem[]) => {
  return reports.filter((report) => isResolvedStatus(report.status)).length;
};

export const getRecentReports = (reports: ReportItem[], days = 3) => {
  return reports.filter(
    (report) => isReportRecentWithinDays(report, days) && !isResolvedStatus(report.status)
  );
};

export const getStatusStyle = (status: string) => {
  switch (normalizeStatus(status)) {
    case 'Resolved':
      return {
        backgroundColor: '#DCFCE7',
        color: '#16A34A',
        label: 'RESOLVED',
      };
    case 'In Progress':
      return {
        backgroundColor: '#DBEAFE',
        color: '#2563EB',
        label: 'IN PROGRESS',
      };
    case 'Under Review':
      return {
        backgroundColor: '#FEF3C7',
        color: '#B45309',
        label: 'UNDER REVIEW',
      };
    default:
      return {
        backgroundColor: '#F3F4F6',
        color: '#6B7280',
        label: 'PENDING',
      };
  }
};

export const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'Flood':
      return 'water-outline';
    case 'Garbage':
      return 'trash-outline';
    case 'Road':
      return 'construct-outline';
    case 'Streetlight':
      return 'bulb-outline';
    case 'Noise':
      return 'volume-high-outline';
    case 'Safety':
      return 'alert-circle-outline';
    default:
      return 'document-text-outline';
  }
};