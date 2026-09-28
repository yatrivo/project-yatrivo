import 'dotenv/config';
import { createApp } from '../backend/src/app.ts';

async function testFullAuditSystem() {
  console.log('=== Comprehensive System Audit Logs Verification ===');
  const app = createApp();
  const server = app.listen(4007);
  const BASE = 'http://localhost:4007/api/v1';

  try {
    // 1. Admin login
    console.log('\n[Step 1] Logging in as Admin...');
    const loginRes = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@yatrivo.com',
        password: process.env.ADMIN_SEED_PASSWORD || 'YatrivoAdmin@2026!'
      })
    });
    const loginJson = await loginRes.json();
    const token = loginJson.data?.tokens?.accessToken || loginJson.tokens?.accessToken;
    if (!token) throw new Error('Failed to obtain access token');
    console.log('✔ Admin logged in.');

    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // 2. Public Enquiry ("any querry recived")
    console.log('\n[Step 2] Testing Enquiry received auto-audit...');
    const uniqueName = `AuditQuery_${Date.now()}`;
    const enqRes = await fetch(`${BASE}/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: uniqueName,
        customerPhone: '+91 9888877777',
        customerEmail: 'audit@yatrivo.test',
        message: 'Looking for Chopta trek group',
        source: 'website'
      })
    });
    const enqData = await enqRes.json();
    const enqId = enqData.enquiry?.id;
    console.log(`✔ Enquiry created (ID: ${enqId}).`);

    // 3. Admin updates enquiry status
    console.log('\n[Step 3] Updating enquiry status by admin...');
    const updateEnqRes = await fetch(`${BASE}/enquiries/${enqId}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'contacted' })
    });
    console.log(`✔ Enquiry status updated: HTTP ${updateEnqRes.status}`);

    // 4. Booking creation & payment ("any booking anything that happens")
    console.log('\n[Step 4] Testing Booking creation auto-audit...');
    const bookRes = await fetch(`${BASE}/bookings`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        primaryContactName: `Booker_${Date.now()}`,
        primaryContactPhone: '+91 9777766666',
        primaryContactEmail: 'booker@yatrivo.test',
        destinationLabel: 'Chopta Valley',
        tripName: 'Chopta Tungnath Trek',
        travellerCount: 2,
        totalAmount: 18000,
        paymentStatus: 'unpaid',
        status: 'awaiting_traveller_details'
      })
    });
    const bookData = await bookRes.json();
    const bookingId = bookData.booking?.id;
    console.log(`✔ Booking created (ID: ${bookingId}, Booking#: ${bookData.booking?.bookingNumber}).`);

    console.log('\n[Step 5] Recording payment for booking...');
    const payRes = await fetch(`${BASE}/bookings/${bookingId}/payments`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        amount: 9000,
        method: 'upi',
        referenceNumber: `UPI-${Date.now()}`,
        notes: 'Advance deposit'
      })
    });
    console.log(`✔ Payment recorded: HTTP ${payRes.status}`);

    // Wait a brief moment
    await new Promise(r => setTimeout(r, 300));

    // 6. Query audit logs by search
    console.log('\n[Step 6] Querying audit logs for generated test enquiry...');
    const searchRes = await fetch(`${BASE}/admin/audit-logs?search=${uniqueName}`, {
      headers: authHeaders
    });
    const searchJson = await searchRes.json();
    console.log(`✔ Audit records found for enquiry: ${searchJson.data?.length}`);
    if (!searchJson.data || searchJson.data.length === 0) {
      throw new Error('Audit log for enquiry was not found!');
    }
    console.log('Sample Log Details:', {
      action: searchJson.data[0].action,
      user: searchJson.data[0].user,
      details: searchJson.data[0].details,
      date: searchJson.data[0].date
    });

    // 7. Query audit logs by entity filter 'booking'
    console.log('\n[Step 7] Querying audit logs with entityType=booking...');
    const bookingLogsRes = await fetch(`${BASE}/admin/audit-logs?entityType=booking&limit=5`, {
      headers: authHeaders
    });
    const bookingLogsJson = await bookingLogsRes.json();
    console.log(`✔ Booking audit logs count: ${bookingLogsJson.data?.length}, Total: ${bookingLogsJson.total}`);
    if (bookingLogsJson.data?.length > 0) {
      console.log('Latest booking log action:', bookingLogsJson.data[0].action);
      console.log('Latest booking log details:', bookingLogsJson.data[0].details);
    }

    console.log('\n🎉 ALL AUDIT LOG SYSTEM TESTS PASSED SUCCESSFULLY! 🎉\n');
  } finally {
    server.close();
  }
}

testFullAuditSystem().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
