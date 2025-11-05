// types/child.ts
import { Timestamp } from "firebase/firestore";

export interface Child {
  id: string;
  name: string;
  age: number;
  gender?: string;
  orphanageId?: string;
  createdAt?: Timestamp;
}
