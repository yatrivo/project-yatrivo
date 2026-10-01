import { Client } from "pg";
import "dotenv/config";

const BASE_URL = "http://localhost:4000/api/v1";

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (res.status === 200 && data.data?.tokens?.accessToken) {
    return { token: data.data.tokens.accessToken, user: data.data.user };
  }
  throw new Error(`Login failed for ${email}: ${res.status} ${JSON.stringify(data)}`);
}

async function runRemediationVerification() {
  console.log("===============================================================================");
  console.log("=== PHASE 8 REMEDIATION TARGETED VERIFICATION ===");
  console.log("===============================================================================\n");

  const adminSession = await login("admin@yatrivo.com", "YatrivoAdmin@2026!");
  const adminHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${adminSession.token}`
  };

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, testName, details = "") {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`[PASS] ${testName}`);
    } else {
      console.error(`[FAIL] ${testName} - ${details}`);
    }
  }

  // ---------------------------------------------------------------------------
  // P8-01: Customer traveller-submission endpoint leaks admin BookingDto
  // ---------------------------------------------------------------------------
  console.log("\n--- Testing P8-01: Customer Booking Details & Traveller Submission ---");
  {
    // Create test booking with internal notes and payments
    const bRes = await fetch(`${BASE_URL}/bookings`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        primaryContactName: "P8-01 Verification Customer",
        primaryContactPhone: "+919800011122",
        primaryContactEmail: "p8_01_verify@example.com",
        travellerCount: 2,
        totalAmount: 25000,
        paymentNotes: "INTERNAL SECRET: Client paid via confidential escrow",
        internalNotes: "CONFIDENTIAL ADMIN NOTE: VIP VIP VIP - Do not expose to customer",
        initialPayment: {
          amount: 10000,
          method: "card",
          referenceNumber: "SECRET-REF-001",
          notes: "Initial deposit"
        }
      })
    });
    const bData = await bRes.json();
    const booking = bData.booking;
    const token = booking?.detailsToken;

    assert(Boolean(token), "Test booking created with detailsToken", JSON.stringify(bData));

    // 1. Check GET /bookings/details/:token
    const getRes = await fetch(`${BASE_URL}/bookings/details/${token}`);
    const getData = await getRes.json();
    const getBooking = getData.booking;

    assert(
      getRes.status === 200 &&
      getBooking &&
      getBooking.internalNotes === undefined &&
      getBooking.paymentNotes === undefined &&
      getBooking.payments === undefined &&
      getBooking.events === undefined,
      "P8-01.1: GET /bookings/details/:token returns customerSafeBooking without internal notes/events"
    );

    // 2. Check POST /bookings/details/:token/travellers
    const submitRes = await fetch(`${BASE_URL}/bookings/details/${token}/travellers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        travellers: [
          { fullName: "Traveller Alpha", age: 30, gender: "female" },
          { fullName: "Traveller Beta", age: 32, gender: "male" }
        ]
      })
    });
    const submitData = await submitRes.json();
    const submittedBooking = submitData.booking;

    assert(
      submitRes.status === 200 &&
      submittedBooking &&
      submittedBooking.internalNotes === undefined &&
      submittedBooking.paymentNotes === undefined &&
      submittedBooking.payments === undefined &&
      submittedBooking.events === undefined &&
      submittedBooking.travellers?.length === 2,
      "P8-01.2: POST /bookings/details/:token/travellers returns customerSafeBooking omitting internal notes, payments, and events"
    );
  }

  // ---------------------------------------------------------------------------
  // P8-02: Public review-request lookup exposes customerPhone and bookingId
  // ---------------------------------------------------------------------------
  console.log("\n--- Testing P8-02: Review Request Public Lookup Sanitization ---");
  {
    // Find or create departure for trip
    const tripsRes = await fetch(`${BASE_URL}/trips?limit=1`);
    const testTrip = (await tripsRes.json()).data?.[0];

    let depId = testTrip.departures?.[0]?.id;
    if (!depId) {
      const depRes = await fetch(`${BASE_URL}/trips/${testTrip.id}/departures`, {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({ date: "2026-06-20", spotsTotal: 12 })
      });
      depId = (await depRes.json()).data?.id;
    }

    const bRes = await fetch(`${BASE_URL}/bookings`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        primaryContactName: "P8-02 Review User",
        primaryContactPhone: "+919876500000",
        primaryContactEmail: "p8_02_review@example.com",
        tripId: testTrip.id,
        tripInstanceId: depId,
        travellerCount: 1,
        totalAmount: 12000,
        status: "confirmed"
      })
    });
    const b = (await bRes.json()).booking;

    const rrRes = await fetch(`${BASE_URL}/departures/${depId}/review-requests`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        bookingIds: [b.id],
        customMessageTemplate: "Hello {{customer_name}}, leave review: {{review_link}}"
      })
    });
    const rrData = await rrRes.json();
    const reviewToken = rrData.data?.created?.[0]?.token || rrData.data?.requests?.[0]?.token;

    assert(Boolean(reviewToken), "Review request token generated", JSON.stringify(rrData));

    // Public lookup
    const pubReqRes = await fetch(`${BASE_URL}/reviews/requests/${reviewToken}`);
    const pubReqData = await pubReqRes.json();
    const reqObj = pubReqData.data?.request;

    assert(
      pubReqRes.status === 200 &&
      reqObj &&
      reqObj.customerName === "P8-02 Review User" &&
      reqObj.customerPhone === undefined &&
      reqObj.bookingId === undefined &&
      reqObj.bookingTravellerId === undefined,
      "P8-02: GET /reviews/requests/:token omits customerPhone, bookingId, and bookingTravellerId",
      JSON.stringify(reqObj)
    );
  }

  // ---------------------------------------------------------------------------
  // P8-03: Password-reset tokens stored in plaintext in password_reset_tokens.raw_token
  // ---------------------------------------------------------------------------
  console.log("\n--- Testing P8-03: Plaintext Password Reset Token Elimination ---");
  {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    try {
      // 1. Verify raw_token column was dropped
      const colCheck = await client.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'password_reset_tokens' AND column_name = 'raw_token'
      `);
      assert(
        colCheck.rows.length === 0,
        "P8-03.1: password_reset_tokens table does NOT have raw_token column"
      );

      // 2. Request a password reset
      const resetReqRes = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "superadmin@yatrivo.com" })
      });
      const resetReqData = await resetReqRes.json();

      assert(
        resetReqRes.status === 200,
        "P8-03.2: Password reset request returns 200 OK",
        JSON.stringify(resetReqData)
      );

      // 3. Inspect latest token row in database
      const tokenRow = await client.query(`
        SELECT prt.id, prt.user_id, prt.token_hash, prt.created_at, prt.consumed_at
        FROM password_reset_tokens prt
        JOIN users u ON u.id = prt.user_id
        WHERE u.email = 'superadmin@yatrivo.com'
        ORDER BY prt.created_at DESC
        LIMIT 1
      `);
      const row = tokenRow.rows[0];

      assert(
        row && Boolean(row.token_hash) && row.token_hash.length === 64,
        "P8-03.3: Token row in DB contains valid SHA-256 hash (64 hex chars) and NO plaintext raw_token"
      );

      // 4. Test 60-second cooldown rate limit
      const secondReqRes = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "superadmin@yatrivo.com" })
      });
      const secondReqData = await secondReqRes.json();

      const errorCode = secondReqData.code || secondReqData.error?.code;
      assert(
        secondReqRes.status === 429 && (errorCode === "RATE_LIMITED" || errorCode === "RATE_LIMIT_EXCEEDED"),
        "P8-03.4: Rapid subsequent password reset request is rate-limited with HTTP 429",
        `status: ${secondReqRes.status}, data: ${JSON.stringify(secondReqData)}`
      );
    } finally {
      await client.end();
    }
  }

  // ---------------------------------------------------------------------------
  // P8-04: Review photo upload with already-consumed review token
  // ---------------------------------------------------------------------------
  console.log("\n--- Testing P8-04: Consumed Review Token Photo Upload Blocking ---");
  {
    // Generate new review request
    const tripsRes = await fetch(`${BASE_URL}/trips?limit=1`);
    const testTrip = (await tripsRes.json()).data?.[0];
    const depId = testTrip.departures?.[0]?.id;

    const bRes = await fetch(`${BASE_URL}/bookings`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        primaryContactName: "P8-04 Token Consumer",
        primaryContactPhone: "+919876511111",
        primaryContactEmail: "p8_04_consumer@example.com",
        tripId: testTrip.id,
        tripInstanceId: depId,
        travellerCount: 1,
        totalAmount: 10000,
        status: "confirmed"
      })
    });
    const b = (await bRes.json()).booking;

    const rrRes = await fetch(`${BASE_URL}/departures/${depId}/review-requests`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        bookingIds: [b.id],
        customMessageTemplate: "Hello {{customer_name}}, review: {{review_link}}"
      })
    });
    const rrData = await rrRes.json();
    const reviewToken = rrData.data?.created?.[0]?.token || rrData.data?.requests?.[0]?.token;

    // 1. Submit review to consume token
    const submitRevRes = await fetch(`${BASE_URL}/reviews/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: reviewToken,
        rating: 5,
        body: "This was a truly exceptional Himalayan expedition! Highly recommended.",
        reviewerName: "P8-04 Token Consumer"
      })
    });
    const submitRevData = await submitRevRes.json();
    assert(submitRevRes.status === 201, "Review submitted and token consumed successfully", JSON.stringify(submitRevData));

    // 2. Now attempt to upload a photo with this consumed token
    // Create multipart form data with a 1x1 png image
    const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const pngBuffer = Buffer.from(pngBase64, "base64");
    const formData = new FormData();
    const blob = new Blob([pngBuffer], { type: "image/png" });
    formData.append("file", blob, "photo.png");
    formData.append("token", reviewToken);

    const uploadRes = await fetch(`${BASE_URL}/reviews/upload?token=${reviewToken}`, {
      method: "POST",
      body: formData
    });
    const uploadData = await uploadRes.json();
    const uploadErrCode = uploadData.code || uploadData.error?.code;

    assert(
      uploadRes.status === 400 && uploadErrCode === "TOKEN_ALREADY_USED",
      "P8-04: Photo upload rejected with 400 TOKEN_ALREADY_USED when token is already consumed",
      `status: ${uploadRes.status}, data: ${JSON.stringify(uploadData)}`
    );
  }

  console.log("\n===============================================================================");
  console.log(`TOTAL REMEDIATION TESTS: ${totalTests}`);
  console.log(`PASSED: ${passedTests}`);
  console.log(`FAILED: ${totalTests - passedTests}`);
  console.log("===============================================================================");

  if (passedTests === totalTests) {
    console.log(">>> ALL PHASE 8 REMEDIATIONS VERIFIED SUCCESSFULLY! <<<");
  } else {
    process.exit(1);
  }
}

runRemediationVerification().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
