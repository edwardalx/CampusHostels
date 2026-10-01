import type { ActivityItem, ReservationStatus } from "../type/dashboard";

export const recentReservations: Array<
  [string, string, string, ReservationStatus]
> = [
  ["Mary Wanjiru", "A-12", "Aug 12 - Sep 11", "Confirmed"],
  ["James Oduor", "B-04", "Aug 15 - Sep 14", "Pending"],
  ["Njeri Kamau", "C-09", "Aug 18 - Sep 17", "Checked in"],
  ["Daniel Mugo", "D-02", "Aug 20 - Sep 19", "Confirmed"],
];

export const activityFeed: ActivityItem[] = [
  {
    title: "New booking confirmed",
    detail: "Aisha M. booked room 204",
    time: "12 mins ago",
  },
  {
    title: "Payment received",
    detail: "KSh 32,500 processed from Daniel K.",
    time: "48 mins ago",
  },
  {
    title: "Maintenance request",
    detail: "Plumbing issue flagged at Westlands Residences",
    time: "2 hours ago",
  },
  {
    title: "Room availability update",
    detail: "2 single rooms are now open in Upper Hill",
    time: "Today",
  },
];
