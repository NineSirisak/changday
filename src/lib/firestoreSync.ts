import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { BusinessProfile, Customer, Quotation } from '../types';

export const saveProfileToFirestore = async (userId: string, profile: BusinessProfile) => {
  const path = `users/${userId}/profiles/${profile.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'profiles', profile.id);
    await setDoc(docRef, profile);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const deleteProfileFromFirestore = async (userId: string, profileId: string) => {
  const path = `users/${userId}/profiles/${profileId}`;
  try {
    const docRef = doc(db, 'users', userId, 'profiles', profileId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const saveCustomerToFirestore = async (userId: string, customer: Customer) => {
  const path = `users/${userId}/customers/${customer.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'customers', customer.id);
    await setDoc(docRef, customer);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const deleteCustomerFromFirestore = async (userId: string, customerId: string) => {
  const path = `users/${userId}/customers/${customerId}`;
  try {
    const docRef = doc(db, 'users', userId, 'customers', customerId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const saveQuotationToFirestore = async (userId: string, quotation: Quotation) => {
  const path = `users/${userId}/quotations/${quotation.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'quotations', quotation.id);
    await setDoc(docRef, quotation);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const deleteQuotationFromFirestore = async (userId: string, quotationId: string) => {
  const path = `users/${userId}/quotations/${quotationId}`;
  try {
    const docRef = doc(db, 'users', userId, 'quotations', quotationId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const fetchAllUserDataFromFirestore = async (userId: string) => {
  try {
    const profilesCol = collection(db, 'users', userId, 'profiles');
    const customersCol = collection(db, 'users', userId, 'customers');
    const quotationsCol = collection(db, 'users', userId, 'quotations');

    const [profilesSnap, customersSnap, quotationsSnap] = await Promise.all([
      getDocs(profilesCol),
      getDocs(customersCol),
      getDocs(quotationsCol),
    ]);

    const profiles: BusinessProfile[] = [];
    profilesSnap.forEach((doc) => {
      profiles.push(doc.data() as BusinessProfile);
    });

    const customers: Customer[] = [];
    customersSnap.forEach((doc) => {
      customers.push(doc.data() as Customer);
    });

    const savedQuotations: Quotation[] = [];
    quotationsSnap.forEach((doc) => {
      savedQuotations.push(doc.data() as Quotation);
    });

    return { profiles, customers, savedQuotations };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `users/${userId}`);
    return { profiles: [], customers: [], savedQuotations: [] };
  }
};
