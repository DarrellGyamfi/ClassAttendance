// Firebase Firestore Database Schema for ClassAttendanceApp
// This file defines TypeScript interfaces for all data models.

import { Timestamp } from '@react-native-firebase/firestore';

// User collection (already exists)
// Represents authenticated users (teachers and students)
export interface User {
  uid: string; // Firebase Auth UID
  email: string;
  displayName: string;
  role: 'teacher' | 'student'; // Role in the app
  fcmToken?: string; // Firebase Cloud Messaging token for push notifications
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Class collection
// Represents classes created by teachers
export interface Class {
  id: string; // Firestore document ID
  teacherId: string; // Reference to User.uid
  name: string;
  description?: string;
  subject?: string;
  students: string[]; // Array of User.uid (students enrolled)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Session collection
// Represents individual class sessions
export interface Session {
  id: string; // Firestore document ID
  classId: string; // Reference to Class.id
  date: Timestamp; // Date of the session
  startTime: string; // e.g., "09:00"
  endTime: string; // e.g., "10:30"
  location?: string; // Optional physical location
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  qrCode: string; // Unique QR code string for the session
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Attendance collection
// Records attendance for each student in a session
export interface Attendance {
  id: string; // Firestore document ID
  sessionId: string; // Reference to Session.id
  studentId: string; // Reference to User.uid
  status: 'present' | 'absent' | 'late' | 'excused';
  timestamp: Timestamp; // When the attendance was marked
  markedBy?: string; // User.uid who marked it (teacher or auto)
}

// Notification collection
// For sending notifications to users
export interface Notification {
  id: string; // Firestore document ID
  userId: string; // Reference to User.uid
  type: 'attendance_reminder' | 'class_update' | 'session_started' | 'custom';
  title: string;
  message: string;
  read: boolean;
  createdAt: Timestamp;
}

// Example data structures and relationships:
//
// User Example:
// {
//   uid: "user123",
//   email: "teacher@example.com",
//   displayName: "John Doe",
//   role: "teacher",
//   createdAt: new Date("2023-01-01"),
//   updatedAt: new Date("2023-01-01")
// }
//
// Class Example:
// {
//   id: "class456",
//   teacherId: "user123",
//   name: "Mathematics 101",
//   description: "Intro to Algebra",
//   subject: "Math",
//   students: ["student789", "student101"],
//   createdAt: new Date("2023-01-01"),
//   updatedAt: new Date("2023-01-01")
// }
//
// Session Example:
// {
//   id: "session789",
//   classId: "class456",
//   date: new Date("2023-09-15"),
//   startTime: "09:00",
//   endTime: "10:30",
//   location: "Room 101",
//   status: "scheduled",
//   createdAt: new Date("2023-09-10"),
//   updatedAt: new Date("2023-09-10")
// }
//
// Attendance Example:
// {
//   id: "att123",
//   sessionId: "session789",
//   studentId: "student789",
//   status: "present",
//   timestamp: new Date("2023-09-15T09:05:00"),
//   markedBy: "user123"
// }
//
// Notification Example:
// {
//   id: "notif456",
//   userId: "student789",
//   type: "attendance_reminder",
//   title: "Attendance Reminder",
//   message: "Don't forget to mark attendance for Math class today.",
//   read: false,
//   createdAt: new Date("2023-09-15T08:00:00")
// }
//
// Relationships:
// - A User can be a teacher (creates Classes) or student (enrolled in Classes).
// - A Class belongs to one Teacher and has many Students.
// - A Class has many Sessions.
// - A Session belongs to one Class and has many Attendance records.
// - An Attendance record links a Student to a Session.
// - Notifications are sent to specific Users and can relate to Classes, Sessions, or Attendance.