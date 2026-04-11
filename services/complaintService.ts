import { auth, db } from '@/firebaseConfig';
import {
    addDoc,
    collection,
    getDocs,
    query,
    serverTimestamp,
    where,
} from 'firebase/firestore';

type SubmitComplaintInput = {
  title: string;
  description: string;
  category: string;
  location: string;
  urgency: string;
};

export const submitComplaint = async ({
  title,
  description,
  category,
  location,
  urgency,
}: SubmitComplaintInput) => {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error('User is not logged in.');
  }

  const q = query(
    collection(db, 'users'),
    where('uid', '==', currentUser.uid)
  );

  const querySnapshot = await getDocs(q);

  let userName = currentUser.displayName || 'User';
  let userEmail = currentUser.email || '';
  let barangay = '';

  if (!querySnapshot.empty) {
    const userData = querySnapshot.docs[0].data();
    userName = userData.name || userName;
    userEmail = userData.email || userEmail;
    barangay = userData.barangay || '';
  }

  const complaintData = {
    userId: currentUser.uid,
    userName,
    userEmail,
    barangay,
    title: title.trim(),
    description: description.trim(),
    category: category.trim(),
    location: location.trim(),
    urgency: urgency.trim(),
    status: 'Pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'complaints'), complaintData);

  return docRef.id;
};