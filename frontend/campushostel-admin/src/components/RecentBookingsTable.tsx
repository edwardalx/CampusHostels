import type { BookingStatus, RecentBooking } from '../type/report'

type RecentBookingsTableProps = {
  bookings: RecentBooking[]
  isLoading: boolean
  error: string | null
}

const statusClass: Record<BookingStatus, string> = {
  Confirmed: 'confirmed',
  'Checked in': 'checked-in',
  Pending: 'pending',
  Ended: 'inactive',
}

function formatDay(value: string) {
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function formatStay(start: string, end?: string | null) {
  return end ? `${formatDay(start)} - ${formatDay(end)}` : `From ${formatDay(start)}`
}

export function RecentBookingsTable({ bookings, isLoading, error }: RecentBookingsTableProps) {
  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Bookings</p>
          <h3>Recent bookings</h3>
        </div>
      </div>

      {error ? (
        <p className="properties-error" role="alert">{error}</p>
      ) : isLoading ? (
        <p className="properties-message">Loading recent bookings...</p>
      ) : bookings.length === 0 ? (
        <p className="properties-message">No bookings yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Tenant</th>
              <th>Property</th>
              <th>Room</th>
              <th>Stay</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.tenancyId}>
                <td data-label="Tenant" className="capitalize">{booking.tenantName}</td>
                <td data-label="Property" className="capitalize">{booking.propertyName}</td>
                <td data-label="Room">{booking.roomNumber ?? '—'}</td>
                <td data-label="Stay">{formatStay(booking.contractStartDate, booking.contractEndDate)}</td>
                <td data-label="Status">
                  <span className={`table-status ${statusClass[booking.status]}`}>{booking.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
