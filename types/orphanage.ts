import { Timestamp, FieldValue } from "firebase/firestore";

export interface Orphanage {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  registrationNumber: string;
  contactName: string;
  status: string;
  createdAt?: Timestamp | FieldValue;
  registrationDocUrl?: string;
}

export interface EditOrphanageModalProps {
  open: boolean;
  onClose: (saved?: boolean) => void;
  orphanage: Orphanage;
  onSave: (updated: Orphanage) => void;
}

export type EditableOrphanageField =
  | "name"
  | "contactName"
  | "email"
  | "phone"
  | "address"
  | "registrationNumber";

export type OrphanageForm = {
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  registrationNumber: string;
  registrationDocUrl: string;
};

export type OrphanageFormField =
  | "name"
  | "contactName"
  | "email"
  | "phone"
  | "address"
  | "registrationNumber"
  | "registrationDocUrl";
