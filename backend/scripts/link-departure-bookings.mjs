import { query } from "../dist/db/postgres.js";

async function linkBookings() {
  const choptaInst = "90b69cf1-7147-4497-ab92-69c416b2d839";
  const rishikeshInst = "12ffd7bc-6452-4591-b1dc-e34757e81e44";

  await query(
    `UPDATE bookings 
     SET trip_instance_id = $1, status = 'completed'::booking_status 
     WHERE booking_number = 'BOOK-2026-67504'`,
    [choptaInst]
  );

  await query(
    `UPDATE bookings 
     SET trip_instance_id = $1, status = 'completed'::booking_status, 
         primary_contact_name = 'Rohan Mehra', primary_contact_phone = '+91 9811223344' 
     WHERE booking_number = 'BOOK-2026-12368'`,
    [choptaInst]
  );

  await query(
    `UPDATE bookings 
     SET trip_instance_id = $1, status = 'completed'::booking_status,
         primary_contact_name = 'Neha Gupta', primary_contact_phone = '+91 9988776655' 
     WHERE booking_number = 'BOOK-2026-21022'`,
    [rishikeshInst]
  );

  console.log("Successfully linked completed bookings to departures.");
  process.exit(0);
}

linkBookings().catch(console.error);
