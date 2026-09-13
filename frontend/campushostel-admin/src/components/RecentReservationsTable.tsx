import type { ReservationStatus } from '../data/dashboardData'

type RecentReservationsTableProps = {
  reservations: Array<[string, string, string, ReservationStatus]>
}

export function RecentReservationsTable({ reservations }: RecentReservationsTableProps) {
  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Bookings</p>
          <h3>Recent reservations</h3>
        </div>
        <button className="secondary-button">View all</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Tenant</th>
            <th>Room</th>
            <th>Stay</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {reservations.map(([tenant, room, stay, status]) => (
            <tr key={tenant}>
              <td>{tenant}</td>
              <td>{room}</td>
              <td>{stay}</td>
              <td>
                <span
                  className={`table-status ${status === 'Confirmed' ? 'confirmed' : status === 'Checked in' ? 'checked-in' : 'pending'}`}
                >
                  {status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
