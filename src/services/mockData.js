import { v4 as uuidv4 } from 'uuid';

export const mockIssues = [
  {
    id: 'ISS-001',
    title: 'Water leak near hostel corridor',
    description: 'There is a severe water leak near the 3rd floor corridor of Hostel A. It is causing the floor to become very slippery.',
    location: 'Hostel A, 3rd Floor',
    category: 'Plumbing',
    priority: 'High',
    status: 'Open',
    reportedBy: 'student1@test.com',
    dateReported: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    assignedSupervisor: null,
    assignedWorker: null,
    timeline: [
      { status: 'Open', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), note: 'Complaint reported' }
    ]
  },
  {
    id: 'ISS-002',
    title: 'Broken fan in Room 204',
    description: 'The ceiling fan in Room 204 Science Block is making a loud noise and then stopping.',
    location: 'Science Block, Room 204',
    category: 'Electrical',
    priority: 'Medium',
    status: 'Assigned',
    reportedBy: 'staff1@test.com',
    dateReported: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    assignedSupervisor: 'Supervisor John',
    assignedWorker: 'Worker Mike',
    timeline: [
      { status: 'Open', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), note: 'Complaint reported' },
      { status: 'Assigned', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(), note: 'Assigned to Supervisor John' }
    ]
  },
  {
    id: 'ISS-003',
    title: 'Network down in Library',
    description: 'Wi-Fi is completely unaccessible in the main reading room of the library.',
    location: 'Central Library, Main Room',
    category: 'Network',
    priority: 'High',
    status: 'In Progress',
    reportedBy: 'student2@test.com',
    dateReported: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    assignedSupervisor: 'Supervisor Sarah',
    assignedWorker: 'IT Worker Dave',
    timeline: [
      { status: 'Open', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), note: 'Complaint reported' },
      { status: 'Assigned', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 45).toISOString(), note: 'Assigned to Supervisor Sarah' },
      { status: 'In Progress', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(), note: 'Work started by IT Worker Dave' }
    ]
  },
  {
    id: 'ISS-004',
    title: 'Broken chair in Cafeteria',
    description: 'One of the chairs near the entrance is broken and someone might fall.',
    location: 'Cafeteria',
    category: 'Furniture',
    priority: 'Low',
    status: 'Resolved',
    reportedBy: 'staff2@test.com',
    dateReported: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
    assignedSupervisor: 'Supervisor John',
    assignedWorker: 'Worker Mike',
    timeline: [
      { status: 'Open', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(), note: 'Complaint reported' },
      { status: 'Resolved', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), note: 'Chair replaced with a new one from storage.' }
    ]
  }
];

export const mockNotifications = [
  { id: uuidv4(), type: 'alert', message: 'New high priority issue: Water leak near hostel...', date: new Date().toISOString(), read: false },
  { id: uuidv4(), type: 'update', message: 'Issue ISS-003 is now In Progress', date: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(), read: true }
];

export const mockMaterials = [
  { id: 1, issueId: 'ISS-002', item: 'Capacitor', quantity: 1, status: 'Consumed', worker: 'Worker Mike' },
  { id: 2, issueId: 'ISS-004', item: 'Chair leg', quantity: 1, status: 'Returned', worker: 'Worker Mike' }
];
