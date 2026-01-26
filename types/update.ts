import { Timestamp } from "firebase/firestore";

export interface Update {
  id: string;
  orphanageId: string;
  orphanageName: string;
  orphanageLogoUrl?: string;

  childId?: string | null;
  childName?: string;
  childPhotoUrl?: string;

  title: string;
  body: string;
  imageUrl?: string;

  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}
