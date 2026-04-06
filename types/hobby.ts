// types/hobby.ts
import { Timestamp } from "firebase/firestore";

export interface Hobby {
  id: string;
  name: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
