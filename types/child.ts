// types/child.ts
import { Timestamp } from "firebase/firestore";

export interface Child {
  id: string;
  name: string;
  age: number;
  gender: string;
  birthday: string; // ISO string
  orphanageId: string;
  photoUrl: string;
  story: string;
  hobbies?: string[];
  orphanageName?: string;
  createdAt?: Timestamp;
}
