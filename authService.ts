import { auth, db } from './firebaseConfig';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  deleteUser,
} from 'firebase/auth';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

export const registerUser = async (
  email: string,
  password: string,
  fullName: string,
  mobileNumber: string,
  barangay: string
) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;

    await sendEmailVerification(user);

    await addDoc(collection(db, 'users'), {
      uid: user.uid,
      email: email.trim(),
      name: fullName.trim(),
      mobileNumber: mobileNumber.trim(),
      barangay: barangay.trim(),
      role: 'user',
      isVerified: false,
      createdAt: serverTimestamp(),
    });

    return user;
  } catch (error: any) {
    const currentUser = auth.currentUser;

    if (currentUser) {
      try {
        await deleteUser(currentUser);
      } catch {}
    }

    throw error;
  }
};

export const loginUser = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );
  return userCredential.user;
};