export const centres = [
  { id: "c1", name: "Manzil Centre - Jangpura", location: "Jangpura, New Delhi", type: "After-school" as const, fellowIds: ["f1"], studentCount: 35 },
  { id: "c2", name: "Govt. School - Lajpat Nagar", location: "Lajpat Nagar, New Delhi", type: "In-school" as const, fellowIds: ["f2"], studentCount: 42 },
  { id: "c3", name: "Community Hall - Nizamuddin", location: "Nizamuddin, New Delhi", type: "After-school" as const, fellowIds: ["f3"], studentCount: 28 },
  { id: "c4", name: "Govt. School - Sarai Kale Khan", location: "Sarai Kale Khan, New Delhi", type: "In-school" as const, fellowIds: ["f1", "f2"], studentCount: 50 },
];

export const fellows = [
  { id: "f1", name: "Priya Gupta", email: "priya@manzil.org", phone: "+91 98765 43210", centreIds: ["c1", "c4"], sessionsCompleted: 48, attendanceRate: 92 },
  { id: "f2", name: "Amit Kumar", email: "amit@manzil.org", phone: "+91 98765 43211", centreIds: ["c2", "c4"], sessionsCompleted: 52, attendanceRate: 88 },
  { id: "f3", name: "Neha Singh", email: "neha@manzil.org", phone: "+91 98765 43212", centreIds: ["c3"], sessionsCompleted: 44, attendanceRate: 95 },
];

export const students = [
  { id: "s1", name: "Ravi Kumar", age: 12, gender: "Male" as const, centreId: "c1", attendancePercent: 88, lastAssessmentScore: 3.8 },
  { id: "s2", name: "Anita Devi", age: 11, gender: "Female" as const, centreId: "c1", attendancePercent: 95, lastAssessmentScore: 4.2 },
  { id: "s3", name: "Mohammad Ali", age: 13, gender: "Male" as const, centreId: "c2", attendancePercent: 78, lastAssessmentScore: 3.5 },
  { id: "s4", name: "Sunita Sharma", age: 10, gender: "Female" as const, centreId: "c2", attendancePercent: 92, lastAssessmentScore: 4.0 },
  { id: "s5", name: "Rahul Yadav", age: 14, gender: "Male" as const, centreId: "c3", attendancePercent: 85, lastAssessmentScore: 3.2 },
  { id: "s6", name: "Pooja Mehra", age: 12, gender: "Female" as const, centreId: "c3", attendancePercent: 91, lastAssessmentScore: 4.5 },
];

export const sessions = [
  { id: "ss1", date: "2026-04-07", centreId: "c1", fellowId: "f1", topic: "Rhythm & Beats Basics", duration: 60, activities: ["Clapping patterns", "Drum circle"], studentsPresent: 32 },
  { id: "ss2", date: "2026-04-06", centreId: "c2", fellowId: "f2", topic: "Vocal Warm-ups & Pitch", duration: 45, activities: ["Scale practice", "Group singing"], studentsPresent: 38 },
  { id: "ss3", date: "2026-04-05", centreId: "c3", fellowId: "f3", topic: "Instrument Introduction", duration: 60, activities: ["Keyboard basics", "Note reading"], studentsPresent: 25 },
  { id: "ss4", date: "2026-04-04", centreId: "c1", fellowId: "f1", topic: "Confidence Building", duration: 50, activities: ["Solo performance", "Peer feedback"], studentsPresent: 30 },
  { id: "ss5", date: "2026-04-03", centreId: "c4", fellowId: "f2", topic: "Folk Music Exploration", duration: 55, activities: ["Regional songs", "Storytelling"], studentsPresent: 45 },
];

export const attendanceTrend = [
  { week: "W1 Mar", attendance: 82 },
  { week: "W2 Mar", attendance: 85 },
  { week: "W3 Mar", attendance: 88 },
  { week: "W4 Mar", attendance: 84 },
  { week: "W1 Apr", attendance: 90 },
  { week: "W2 Apr", attendance: 87 },
];

export const centreComparison = [
  { name: "Jangpura", attendance: 88, learning: 3.8, quality: 4.1 },
  { name: "Lajpat Nagar", attendance: 82, learning: 3.5, quality: 3.8 },
  { name: "Nizamuddin", attendance: 91, learning: 4.0, quality: 4.3 },
  { name: "Sarai Kale Khan", attendance: 85, learning: 3.6, quality: 3.9 },
];

export const notifications = [
  { id: "n1", type: "warning" as const, title: "Low Attendance Alert", message: "Govt. School - Lajpat Nagar attendance dropped below 80%", date: "2026-04-07", read: false },
  { id: "n2", type: "error" as const, title: "Missed Session", message: "Session at Community Hall - Nizamuddin was not conducted on April 6th", date: "2026-04-06", read: false },
  { id: "n3", type: "info" as const, title: "Assessment Due", message: "Midline assessments are due for Jangpura centre by April 15th", date: "2026-04-05", read: false },
  { id: "n4", type: "success" as const, title: "Performance Highlight", message: "Neha Singh achieved 95% attendance rate this month", date: "2026-04-04", read: true },
];
