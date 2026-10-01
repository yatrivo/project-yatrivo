const BASE_URL = "http://localhost:4000/api/v1";

const results = [];

function recordResult(area, testName, expected, actual, status, severity, details = null, evidence = null) {
  results.push({ area, testName, expected, actual, status, severity, details, evidence });
  const icon = status === "PASS" ? "PASS" : status === "FAIL" ? "FAIL" : status;
  console.log(`[${icon}] [${area}] ${testName} -> ${actual} (${status}, ${severity || "N/A"})`);
}

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (res.status === 200 && data.data?.tokens?.accessToken) {
    const cookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
    return { token: data.data.tokens.accessToken, user: data.data.user, cookies };
  }
  throw new Error(`Login failed for ${email}: ${res.status} ${JSON.stringify(data)}`);
}

async function runPhase8Audit() {
  console.log("===============================================================================");
  console.log("=== PHASE 8: PRIVACY, DATA LIFECYCLE, AUDIT INTEGRITY & DATA EXPOSURE AUDIT ===");
  console.log("===============================================================================\n");

  let adminSession, superAdminSession;
  try {
    adminSession = await login("admin@yatrivo.com", "YatrivoAdmin@2026!");
    superAdminSession = await login("superadmin@yatrivo.com", "YatrivoAdmin@2026!");
    console.log("Admin and SuperAdmin authenticated successfully.\n");
  } catch (err) {
    console.error("Auth setup failed:", err.message);
    process.exit(1);
  }

  const adminHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${adminSession.token}`
  };

  const superAdminHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${superAdminSession.token}`
  };

  // Find a test trip and departure
  const tripsRes = await fetch(`${BASE_URL}/trips?limit=1`);
  const tripsJson = await tripsRes.json();
  const testTrip = tripsJson.data?.[0];

  if (!testTrip) {
    console.error("No trip found for setup");
    process.exit(1);
  }

  // =========================================================================
  // 1. API DATA-MINIMIZATION & PUBLIC VS ADMIN BOUNDARY
  // =========================================================================
  console.log("--- 1. API Data-Minimization & Public vs Admin Boundary ---");

  // Create a dedicated booking for testing customer view
  const bRes = await fetch(`${BASE_URL}/bookings`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({
      primaryContactName: "Privacy Test Customer",
      primaryContactPhone: "+919811122233",
      primaryContactEmail: "privacytest@example.com",
      tripId: testTrip.id,
      travellerCount: 2,
      totalAmount: 15000,
      paymentNotes: "Confidential payment note: UPI transaction ID #998877",
      internalNotes: "CONFIDENTIAL STAFF NOTE: Customer requested VIP mountain guide and dietary restrictions.",
      initialPayment: {
        amount: 5000,
        method: "upi",
        referenceNumber: "UPI-REF-998877",
        notes: "Deposit received"
      }
    })
  });
  const bData = await bRes.json();
  const testBooking = bData.booking;
  const detailsToken = testBooking?.detailsToken;

  // 1.1 GET /bookings/details/:token
  if (detailsToken) {
    const custViewRes = await fetch(`${BASE_URL}/bookings/details/${detailsToken}`);
    const custView = await custViewRes.json();
    const b = custView.booking;

    const hasInternalNotes = Boolean(b?.internalNotes || b?.paymentNotes);
    const hasPayments = Boolean(b?.payments && b.payments.length > 0);
    const hasEvents = Boolean(b?.events && b.events.length > 0);

    if (custViewRes.status === 200 && !hasInternalNotes && !hasPayments && !hasEvents) {
      recordResult(
        "API Data Minimization",
        "GET /bookings/details/:token omits internal notes and payment history",
        "Internal notes and payment audit events excluded",
        "Clean customer safe view returned (no internal notes/events)",
        "PASS",
        "INFO"
      );
    } else {
      recordResult(
        "API Data Minimization",
        "GET /bookings/details/:token omits internal notes and payment history",
        "Internal notes and payment audit events excluded",
        `Exposed fields: internalNotes=${Boolean(b?.internalNotes)}, paymentNotes=${Boolean(b?.paymentNotes)}, payments=${hasPayments}, events=${hasEvents}`,
        "FAIL",
        "HIGH",
        "Internal notes or payment audit events exposed to customer portal view",
        custView
      );
    }

    // 1.2 POST /bookings/details/:token/travellers (Customer Traveller Submission)
    const submitTravellersRes = await fetch(`${BASE_URL}/bookings/details/${detailsToken}/travellers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        travellers: [
          { fullName: "Privacy Traveller One", age: 28, gender: "female" },
          { fullName: "Privacy Traveller Two", age: 31, gender: "male" }
        ]
      })
    });
    const submitTravellersData = await submitTravellersRes.json();
    const returnedBooking = submitTravellersData.booking;

    const leaksInternalNotes = Boolean(returnedBooking?.internalNotes || returnedBooking?.paymentNotes);
    const leaksPayments = Boolean(returnedBooking?.payments && returnedBooking.payments.length > 0);
    const leaksEvents = Boolean(returnedBooking?.events && returnedBooking.events.length > 0);

    if (submitTravellersRes.status === 200 && !leaksInternalNotes && !leaksPayments && !leaksEvents) {
      recordResult(
        "API Data Minimization",
        "POST /bookings/details/:token/travellers response omits internal notes and events",
        "Response should omit internal notes, payment notes, and internal audit events",
        "Response omits sensitive fields",
        "PASS",
        "INFO"
      );
    } else {
      recordResult(
        "API Data Minimization",
        "POST /bookings/details/:token/travellers response omits internal notes and events",
        "Response should omit internal notes, payment notes, and internal audit events",
        `Returned Booking DTO contains: internalNotes="${returnedBooking?.internalNotes || 'null'}", paymentNotes="${returnedBooking?.paymentNotes || 'null'}", paymentsCount=${returnedBooking?.payments?.length || 0}, eventsCount=${returnedBooking?.events?.length || 0}`,
        "FAIL",
        "HIGH",
        "Customer submitting traveller details receives the full admin BookingDto containing internalNotes, paymentNotes, payment reference numbers, and admin timeline events.",
        {
          internalNotes: returnedBooking?.internalNotes,
          paymentNotes: returnedBooking?.paymentNotes,
          payments: returnedBooking?.payments,
          events: returnedBooking?.events
        }
      );
    }
  }

  // 1.3 Review Request Context: GET /reviews/requests/:token
  // Create a review request to test data minimization
  {
    // Ensure departure exists
    let depId = testTrip.departures?.[0]?.id;
    if (!depId) {
      const depRes = await fetch(`${BASE_URL}/trips/${testTrip.id}/departures`, {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({ date: "2026-05-15", spotsTotal: 10 })
      });
      depId = (await depRes.json()).data?.id;
    }

    if (depId) {
      const b2Res = await fetch(`${BASE_URL}/bookings`, {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({
          primaryContactName: "Review Privacy User",
          primaryContactPhone: "+919876543219",
          primaryContactEmail: "reviewpriv@example.com",
          tripId: testTrip.id,
          tripInstanceId: depId,
          travellerCount: 1,
          totalAmount: 10000,
          status: "confirmed"
        })
      });
      const b2 = (await b2Res.json()).booking;

      const rrRes = await fetch(`${BASE_URL}/departures/${depId}/review-requests`, {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({
          bookingIds: [b2.id],
          customMessageTemplate: "Hello {{customer_name}}, please review: {{review_link}}"
        })
      });
      const rrData = await rrRes.json();
      const reviewToken = rrData.data?.created?.[0]?.token || rrData.data?.requests?.[0]?.token;

      if (reviewToken) {
        const publicReqRes = await fetch(`${BASE_URL}/reviews/requests/${reviewToken}`);
        const publicReqData = await publicReqRes.json();
        const returnedReq = publicReqData.data?.request;

        const leaksCustomerPhone = Boolean(returnedReq?.customerPhone);
        const leaksBookingId = Boolean(returnedReq?.bookingId);

        if (publicReqRes.status === 200 && !leaksCustomerPhone) {
          recordResult(
            "API Data Minimization",
            "GET /reviews/requests/:token customer phone masking",
            "Customer phone number should be masked or omitted from public review context",
            "Customer phone is masked/omitted",
            "PASS",
            "INFO"
          );
        } else {
          recordResult(
            "API Data Minimization",
            "GET /reviews/requests/:token customer phone masking",
            "Customer phone number should be masked or omitted from public review context",
            `Exposed customerPhone: "${returnedReq?.customerPhone}", customerName: "${returnedReq?.customerName}", bookingId: "${returnedReq?.bookingId}"`,
            "FAIL",
            "MEDIUM",
            "Unauthenticated GET /reviews/requests/:token endpoint returns customer's full raw phone number and internal booking UUID in the JSON response.",
            {
              customerPhone: returnedReq?.customerPhone,
              customerName: returnedReq?.customerName,
              bookingId: returnedReq?.bookingId
            }
          );
        }
      }
    }
  }

  // 1.4 Public vs Admin: Draft Destination Accessibility
  {
    // Create a draft destination
    const draftDestRes = await fetch(`${BASE_URL}/destinations`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        name: `Draft Secret Sanctuary ${Date.now()}`,
        tagline: "Internal draft only",
        description: "Draft destination that should not be visible publicly.",
        status: "draft"
      })
    });
    const draftDest = (await draftDestRes.json()).data;

    if (draftDest) {
      // 1. Check if excluded from public list
      const listRes = await fetch(`${BASE_URL}/destinations`);
      const listData = await listRes.json();
      const inPublicList = listData.data?.some(d => d.id === draftDest.id || d.slug === draftDest.slug);

      if (!inPublicList) {
        recordResult(
          "Public/Admin Boundary",
          "Public GET /destinations excludes draft destinations",
          "Draft destination excluded from public destination list",
          "Excluded from list",
          "PASS",
          "INFO"
        );
      } else {
        recordResult(
          "Public/Admin Boundary",
          "Public GET /destinations excludes draft destinations",
          "Draft destination excluded from public destination list",
          "Draft destination appeared in public list",
          "FAIL",
          "HIGH",
          "Draft destination leaked in public destination catalogue",
          draftDest
        );
      }

      // 2. Check if accessible directly by slug without authentication
      const directRes = await fetch(`${BASE_URL}/destinations/${draftDest.slug}`);
      if (directRes.status === 404) {
        recordResult(
          "Public/Admin Boundary",
          "Public GET /destinations/:slug blocks draft destinations",
          "Returns 404 Not Found for unauthenticated requests",
          "Blocked with 404 Not Found",
          "PASS",
          "INFO"
        );
      } else if (directRes.status === 200) {
        const directData = await directRes.json();
        recordResult(
          "Public/Admin Boundary",
          "Public GET /destinations/:slug blocks draft destinations",
          "Returns 404 Not Found for unauthenticated requests",
          `Returned 200 OK (status: "${directData.data?.status || directData.status}")`,
          "FAIL",
          "MEDIUM",
          "Public users can view unpublished 'draft' destinations if they know or guess the destination slug/ID because destinationsService.getDestination only checks status === 'archived', not status !== 'active'.",
          directData
        );
      }
    }
  }

  // 1.5 Public vs Admin: Draft Trip Accessibility
  {
    // Create a draft trip
    const destForTrip = (await (await fetch(`${BASE_URL}/destinations?limit=1`)).json()).data?.[0];
    const draftTripRes = await fetch(`${BASE_URL}/trips`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        name: `Draft Secret Trek ${Date.now()}`,
        durationDays: 4,
        pricePaise: 1200000,
        destinationIds: [destForTrip.id],
        status: "draft"
      })
    });
    const draftTrip = (await draftTripRes.json()).data;

    if (draftTrip) {
      // Check direct unauthenticated access by slug
      const tripDirectRes = await fetch(`${BASE_URL}/trips/${draftTrip.slug}`);
      if (tripDirectRes.status === 404) {
        recordResult(
          "Public/Admin Boundary",
          "Public GET /trips/:slug blocks draft trips",
          "Returns 404 Not Found for unauthenticated requests",
          "Blocked with 404 Not Found",
          "PASS",
          "INFO"
        );
      } else {
        recordResult(
          "Public/Admin Boundary",
          "Public GET /trips/:slug blocks draft trips",
          "Returns 404 Not Found for unauthenticated requests",
          `Returned status ${tripDirectRes.status}`,
          "FAIL",
          "MEDIUM",
          "Draft trip accessible publicly",
          null
        );
      }
    }
  }

  // 1.6 Public Enquiry Submission Data Minimization
  {
    const enqRes = await fetch(`${BASE_URL}/enquiries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: "Minimization Submitter",
        customerPhone: `+9198${Math.floor(10000000 + Math.random() * 90000000)}`,
        customerEmail: "min@example.com",
        message: "Trip inquiry",
        source: "website"
      })
    });
    const enqData = await enqRes.json();
    const enq = enqData.enquiry;

    const hasStaffAssignment = Boolean(enq?.assignedToUserId || enq?.assignedToUserName);
    const hasInternalNotes = Boolean(enq?.notes || enq?.events);

    if (enqRes.status === 201 && !hasStaffAssignment && !hasInternalNotes) {
      recordResult(
        "API Data Minimization",
        "Public POST /enquiries response omits internal staff notes and assignments",
        "Omit staff assignment and internal notes from public creation response",
        "Response contains only submitted fields and public confirmation info",
        "PASS",
        "INFO"
      );
    } else {
      recordResult(
        "API Data Minimization",
        "Public POST /enquiries response omits internal staff notes and assignments",
        "Omit staff assignment and internal notes from public creation response",
        `Exposed internal fields: ${JSON.stringify(enq)}`,
        "FAIL",
        "MEDIUM",
        "Internal CRM fields leaked in public enquiry creation response"
      );
    }
  }

  // =========================================================================
  // 2. DATA OWNERSHIP & CROSS-ENTITY LEAKAGE
  // =========================================================================
  console.log("\n--- 2. Data Ownership & Cross-Entity Leakage ---");

  // Create Booking A and Booking B
  const bARes = await fetch(`${BASE_URL}/bookings`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({
      primaryContactName: "Customer Alpha",
      primaryContactPhone: "+919811111111",
      travellerCount: 1,
      totalAmount: 10000
    })
  });
  const bookingA = (await bARes.json()).booking;

  const bBRes = await fetch(`${BASE_URL}/bookings`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({
      primaryContactName: "Customer Beta",
      primaryContactPhone: "+919822222222",
      travellerCount: 1,
      totalAmount: 20000
    })
  });
  const bookingB = (await bBRes.json()).booking;

  // 2.1 Attempt to access Booking B using Booking A's details_token
  // Tokens are opaque unguessable strings; verify Token A only resolves Booking A
  {
    const fetchWithTokenA = await fetch(`${BASE_URL}/bookings/details/${bookingA.detailsToken}`);
    const dataWithTokenA = await fetchWithTokenA.json();

    if (dataWithTokenA.booking?.id === bookingA.id && dataWithTokenA.booking?.id !== bookingB.id) {
      recordResult(
        "Data Ownership",
        "Booking details token strictly scopes to owned entity",
        "Token A resolves Booking A only and cannot resolve Booking B",
        "Strict 1-to-1 token resolution verified",
        "PASS",
        "INFO"
      );
    } else {
      recordResult(
        "Data Ownership",
        "Booking details token strictly scopes to owned entity",
        "Token A resolves Booking A only",
        "Cross-entity leakage detected",
        "FAIL",
        "HIGH"
      );
    }

    // Attempt to pass arbitrary UUID into details token endpoint
    const uuidTokenRes = await fetch(`${BASE_URL}/bookings/details/${bookingB.id}`);
    if (uuidTokenRes.status === 404) {
      recordResult(
        "Data Ownership",
        "Booking details token endpoint rejects booking UUIDs as tokens",
        "Returns 404 Not Found when attempting to use booking UUID instead of secure details_token",
        "Rejected with 404 Not Found",
        "PASS",
        "INFO"
      );
    } else {
      recordResult(
        "Data Ownership",
        "Booking details token endpoint rejects booking UUIDs as tokens",
        "Returns 404 Not Found",
        `Returned status ${uuidTokenRes.status}`,
        "FAIL",
        "CRITICAL",
        "Bypass of secure details_token via raw booking UUID"
      );
    }
  }

  // =========================================================================
  // 3. DELETION, ARCHIVING & DATA RETENTION
  // =========================================================================
  console.log("\n--- 3. Deletion, Archiving & Data Retention ---");

  // 3.1 Archived Destination Lifecycle
  {
    // Archive a destination
    const testDest = (await (await fetch(`${BASE_URL}/destinations?limit=1`)).json()).data?.[0];
    if (testDest) {
      await fetch(`${BASE_URL}/destinations/${testDest.id}/archive`, {
        method: "POST",
        headers: adminHeaders
      });

      // 1. Verify excluded from public list
      const pubList = await fetch(`${BASE_URL}/destinations`);
      const pubListData = await pubList.json();
      const inList = pubListData.data?.some(d => d.id === testDest.id);

      // 2. Verify direct access returns 404
      const direct = await fetch(`${BASE_URL}/destinations/${testDest.slug}`);

      // 3. Unarchive to restore
      await fetch(`${BASE_URL}/destinations/${testDest.id}/unarchive`, {
        method: "POST",
        headers: adminHeaders
      });

      if (!inList && direct.status === 404) {
        recordResult(
          "Lifecycle & Archiving",
          "Archived destination completely hidden from public access",
          "Excluded from public list and direct GET returns 404",
          "Properly hidden from list and direct access returned 404",
          "PASS",
          "INFO"
        );
      } else {
        recordResult(
          "Lifecycle & Archiving",
          "Archived destination completely hidden from public access",
          "Excluded from public list and direct GET returns 404",
          `inList=${inList}, directStatus=${direct.status}`,
          "FAIL",
          "MEDIUM",
          "Archived destination remains visible to public users"
        );
      }
    }
  }

  // 3.2 Archived Trip Lifecycle
  {
    // Archive a trip
    await fetch(`${BASE_URL}/trips/${testTrip.id}/archive`, {
      method: "POST",
      headers: adminHeaders
    });

    const pubTrips = await fetch(`${BASE_URL}/trips`);
    const pubTripsData = await pubTrips.json();
    const inTripsList = pubTripsData.data?.some(t => t.id === testTrip.id);

    const directTrip = await fetch(`${BASE_URL}/trips/${testTrip.slug}`);

    // Restore trip
    await fetch(`${BASE_URL}/trips/${testTrip.id}/unarchive`, {
      method: "POST",
      headers: adminHeaders
    });

    if (!inTripsList && directTrip.status === 404) {
      recordResult(
        "Lifecycle & Archiving",
        "Archived trip completely hidden from public access",
        "Excluded from public list and direct GET returns 404",
        "Properly hidden from list and direct access returned 404",
        "PASS",
        "INFO"
      );
    } else {
      recordResult(
        "Lifecycle & Archiving",
        "Archived trip completely hidden from public access",
        "Excluded from public list and direct GET returns 404",
        `inTripsList=${inTripsList}, directTripStatus=${directTrip.status}`,
        "FAIL",
        "MEDIUM",
        "Archived trip remains accessible to public users"
      );
    }
  }

  // 3.3 Departure Deletion Safeguard
  {
    // Create departure with active booking
    const depRes = await fetch(`${BASE_URL}/trips/${testTrip.id}/departures`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({ date: "2026-06-20", spotsTotal: 5 })
    });
    const dep = (await depRes.json()).data;

    if (dep) {
      // Book onto departure
      await fetch(`${BASE_URL}/bookings`, {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({
          primaryContactName: "Active Booking User",
          primaryContactPhone: "+919833333333",
          tripId: testTrip.id,
          tripInstanceId: dep.id,
          travellerCount: 1,
          totalAmount: 8000,
          status: "confirmed"
        })
      });

      // Attempt to delete departure
      const delRes = await fetch(`${BASE_URL}/trips/departures/${dep.id}`, {
        method: "DELETE",
        headers: adminHeaders
      });

      // Verify departure was soft-cancelled rather than hard-deleted
      const checkDep = await fetch(`${BASE_URL}/departures/${dep.id}/operational`, { headers: adminHeaders });
      const checkDepData = await checkDep.json();

      if (checkDep.status === 200 && checkDepData.data?.departure?.isCancelled === true) {
        recordResult(
          "Lifecycle & Archiving",
          "Departure with active bookings is soft-cancelled, preserving history",
          "Departure is marked is_cancelled = true rather than hard-deleting records",
          "Preserved in database with is_cancelled = true",
          "PASS",
          "INFO"
        );
      } else {
        recordResult(
          "Lifecycle & Archiving",
          "Departure with active bookings is soft-cancelled, preserving history",
          "Departure marked is_cancelled = true",
          `Status: ${delRes.status}, checkStatus: ${checkDep.status}`,
          "NEEDS REVIEW",
          "LOW",
          "Check departure cancellation behavior"
        );
      }
    }
  }

  // =========================================================================
  // 4. AUDIT LOG INTEGRITY & SENSITIVE DATA EXPOSURE
  // =========================================================================
  console.log("\n--- 4. Audit Log Integrity & Sensitive Data Exposure ---");

  // 4.1 Unauthenticated access to /admin/audit-logs
  {
    const unauthAudit = await fetch(`${BASE_URL}/admin/audit-logs`);
    if (unauthAudit.status === 401) {
      recordResult(
        "Audit Log Security",
        "Unauthenticated access to audit logs blocked",
        "Blocked with 401 Unauthorized",
        "Blocked with 401 Unauthorized",
        "PASS",
        "INFO"
      );
    } else {
      recordResult(
        "Audit Log Security",
        "Unauthenticated access to audit logs blocked",
        "Blocked with 401 Unauthorized",
        `Returned status ${unauthAudit.status}`,
        "FAIL",
        "HIGH"
      );
    }
  }

  // 4.2 Standard Admin access to /admin/audit-logs
  {
    const stdAdminAudit = await fetch(`${BASE_URL}/admin/audit-logs`, { headers: adminHeaders });
    if (stdAdminAudit.status === 200) {
      recordResult(
        "Audit Log Security",
        "Standard Admin can view audit logs for accountability",
        "Returns 200 OK with paginated logs",
        "Allowed with 200 OK",
        "PASS",
        "INFO"
      );
    } else {
      recordResult(
        "Audit Log Security",
        "Standard Admin audit logs view",
        "Returns 200 OK",
        `Returned status ${stdAdminAudit.status}`,
        "NEEDS REVIEW",
        "INFO"
      );
    }
  }

  // 4.3 Attempt to delete or tamper with audit logs via HTTP
  {
    const delAudit = await fetch(`${BASE_URL}/admin/audit-logs`, {
      method: "DELETE",
      headers: superAdminHeaders
    });
    const putAudit = await fetch(`${BASE_URL}/admin/audit-logs/some-log-id`, {
      method: "PUT",
      headers: superAdminHeaders,
      body: JSON.stringify({ action: "Fake Action" })
    });

    if ([404, 405].includes(delAudit.status) && [404, 405].includes(putAudit.status)) {
      recordResult(
        "Audit Log Security",
        "Audit logs are immutable via API (no DELETE/PUT endpoints)",
        "Returns 404/405 (endpoints do not exist)",
        "Immutable; DELETE and PUT return 404/405",
        "PASS",
        "INFO"
      );
    } else {
      recordResult(
        "Audit Log Security",
        "Audit logs are immutable via API",
        "Returns 404/405",
        `delStatus=${delAudit.status}, putStatus=${putAudit.status}`,
        "FAIL",
        "CRITICAL",
        "Audit logs can be modified or deleted via API"
      );
    }
  }

  // 4.4 Audit Logs Content Inspection for Leaked Secrets
  {
    const auditRes = await fetch(`${BASE_URL}/admin/audit-logs?limit=50`, { headers: superAdminHeaders });
    const auditData = await auditRes.json();
    const logs = auditData.data || [];

    let leakedSecrets = [];
    for (const log of logs) {
      const dump = JSON.stringify(log);
      if (/password_hash|token_hash|"raw_token"|jwt|bearer/i.test(dump)) {
        leakedSecrets.push({ id: log.id, action: log.action });
      }
    }

    if (leakedSecrets.length === 0) {
      recordResult(
        "Audit Log Security",
        "Audit logs contain no authentication tokens or credential hashes",
        "No passwords, token hashes, or raw tokens in audit details or metadata",
        "Clean; 0 logs contained secret keywords",
        "PASS",
        "INFO"
      );
    } else {
      recordResult(
        "Audit Log Security",
        "Audit logs contain no authentication tokens or credential hashes",
        "No passwords or token hashes in audit logs",
        `Found ${leakedSecrets.length} logs with potential secret keywords`,
        "FAIL",
        "HIGH",
        "Audit log records contain authentication secrets or hashes",
        leakedSecrets
      );
    }
  }

  // =========================================================================
  // 5. AUTHENTICATION LIFECYCLE & DATABASE SECRETS STORAGE
  // =========================================================================
  console.log("\n--- 5. Authentication Lifecycle & Database Secrets Storage ---");

  // 5.1 Forgot Password Request Enumeration & Rate Limiting
  {
    const existingRes = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@yatrivo.com" })
    });
    const existingData = await existingRes.json();

    const nonExistingRes = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "nonexistent-user-xyz@yatrivo.com" })
    });
    const nonExistingData = await nonExistingRes.json();

    // In a privacy-preserving system, both return 200 OK with identical success messages
    // to prevent email address enumeration
    const both200 = existingRes.status === 200 && nonExistingRes.status === 200;
    const sameMessage = existingData.message === nonExistingData.message;

    if (both200 && sameMessage) {
      recordResult(
        "Authentication Privacy",
        "Password reset endpoint provides uniform response to prevent user enumeration",
        "Returns identical 200 OK message for registered and unregistered emails",
        `Both return 200 with identical message: "${existingData.message}"`,
        "PASS",
        "INFO"
      );
    } else {
      recordResult(
        "Authentication Privacy",
        "Password reset endpoint provides uniform response to prevent user enumeration",
        "Returns identical 200 OK message",
        `existingStatus=${existingRes.status}, nonExistingStatus=${nonExistingRes.status}, existingMsg="${existingData.message}", nonExistingMsg="${nonExistingData.message}"`,
        "FAIL",
        "LOW",
        "Different responses or status codes reveal whether an email address exists in the database",
        { existing: existingData, nonExisting: nonExistingData }
      );
    }
  }

  // 5.2 Password Reset Token Single-Use & Expiry Integrity
  {
    // Attempt to consume an invalid/fabricated reset token
    const fakeResetRes = await fetch(`${BASE_URL}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: "fake-reset-token-abcdef1234567890",
        newPassword: "NewSecurePassword@2026!"
      })
    });
    const fakeResetData = await fakeResetRes.json();

    if (fakeResetRes.status === 400 && fakeResetData.code === "INVALID_OR_EXPIRED_TOKEN") {
      recordResult(
        "Authentication Lifecycle",
        "Reset password endpoint strictly rejects invalid or expired tokens",
        "Blocked with 400 INVALID_OR_EXPIRED_TOKEN",
        "Blocked with 400 INVALID_OR_EXPIRED_TOKEN",
        "PASS",
        "INFO"
      );
    } else {
      recordResult(
        "Authentication Lifecycle",
        "Reset password endpoint strictly rejects invalid or expired tokens",
        "Blocked with 400 INVALID_OR_EXPIRED_TOKEN",
        `Status ${fakeResetRes.status}: ${JSON.stringify(fakeResetData)}`,
        "FAIL",
        "HIGH"
      );
    }
  }

  // 5.3 Plaintext Password Reset Token Storage Audit (Database Schema Review)
  {
    // Direct code / schema inspection:
    // Migration 016 added `raw_token text` to `password_reset_tokens` table,
    // and auth.repository.ts persists raw unhashed reset tokens to disk.
    // We document this as an architectural finding.
    recordResult(
      "Database Privacy & Secret Storage",
      "Password reset token plaintext storage in database (Migration 016)",
      "Reset tokens should be stored ONLY as one-way SHA-256 hashes (token_hash)",
      "Database schema column password_reset_tokens.raw_token stores unhashed plaintext token",
      "FAIL",
      "MEDIUM",
      "Migration 016 introduced `ALTER TABLE password_reset_tokens ADD COLUMN raw_token text;` to support resending the same link within a 20m window. Persisting unhashed tokens in the database defeats token hashing, allowing anyone with DB read access to impersonate password resets.",
      {
        migration: "016_password_reset_token_reuse_cooldown.sql",
        column: "password_reset_tokens.raw_token",
        repositoryMethod: "authRepository.createPasswordResetToken"
      }
    );
  }

  // 5.4 Refresh Token Cookie Security & Logout Revocation
  {
    const freshLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@yatrivo.com", password: "YatrivoAdmin@2026!" })
    });
    const setCookieHeaders = freshLoginRes.headers.getSetCookie ? freshLoginRes.headers.getSetCookie() : [];
    const refreshCookie = setCookieHeaders.find(c => c.startsWith("yatrivo_refresh_token="));

    const isHttpOnly = Boolean(refreshCookie && /HttpOnly/i.test(refreshCookie));
    const isSameSite = Boolean(refreshCookie && /SameSite=Lax/i.test(refreshCookie));
    const isRestrictedPath = Boolean(refreshCookie && /Path=\/api\/v1\/auth/i.test(refreshCookie));

    if (isHttpOnly && isSameSite && isRestrictedPath) {
      recordResult(
        "Authentication Lifecycle",
        "Refresh token cookie has HttpOnly, SameSite=Lax, and Path=/api/v1/auth",
        "HttpOnly, SameSite=Lax, and restricted path set on cookie",
        "All cookie security attributes strictly present",
        "PASS",
        "INFO"
      );
    } else {
      recordResult(
        "Authentication Lifecycle",
        "Refresh token cookie has HttpOnly, SameSite=Lax, and Path=/api/v1/auth",
        "HttpOnly, SameSite=Lax, Path=/api/v1/auth",
        `Cookie header: ${refreshCookie}`,
        "FAIL",
        "MEDIUM",
        "Missing cookie security attributes on refresh token"
      );
    }

    // Verify logout clears cookie
    const freshData = await freshLoginRes.json();
    const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: refreshCookie ? refreshCookie.split(";")[0] : ""
      },
      body: JSON.stringify({ refreshToken: freshData.data?.tokens?.refreshToken })
    });

    const logoutCookies = logoutRes.headers.getSetCookie ? logoutRes.headers.getSetCookie() : [];
    const clearedCookie = logoutCookies.find(c => c.startsWith("yatrivo_refresh_token="));
    const isCleared = Boolean(clearedCookie && /expires=Thu, 01 Jan 1970|Max-Age=0/i.test(clearedCookie));

    if (logoutRes.status === 200 && isCleared) {
      recordResult(
        "Authentication Lifecycle",
        "Logout endpoint invalidates session and clears HttpOnly refresh cookie",
        "Cookie cleared with zero max-age and session revoked",
        "Cookie cleared with max-age=0/expired date",
        "PASS",
        "INFO"
      );
    } else {
      recordResult(
        "Authentication Lifecycle",
        "Logout endpoint invalidates session and clears HttpOnly refresh cookie",
        "Cookie cleared and session revoked",
        `Status ${logoutRes.status}, clearedCookie: ${clearedCookie}`,
        "FAIL",
        "LOW"
      );
    }
  }

  // =========================================================================
  // 6. ERROR & ENUMERATION PRIVACY
  // =========================================================================
  console.log("\n--- 6. Error & Enumeration Privacy ---");

  // 6.1 Invalid Booking Token vs Non-Existent Token
  {
    const resA = await fetch(`${BASE_URL}/bookings/details/invalid_token_12345`);
    const resB = await fetch(`${BASE_URL}/bookings/details/b4a7d6e8-0000-0000-0000-000000000000`);

    if (resA.status === 404 && resB.status === 404) {
      recordResult(
        "Error Privacy",
        "Booking token error messages are uniform across format and non-existence",
        "Both return 404 Not Found",
        "Uniform 404 Not Found returned for both",
        "PASS",
        "INFO"
      );
    } else {
      recordResult(
        "Error Privacy",
        "Booking token error messages are uniform",
        "Both return 404",
        `resA=${resA.status}, resB=${resB.status}`,
        "FAIL",
        "LOW"
      );
    }
  }

  // 6.2 Invalid Review Token vs Non-Existent Token
  {
    const resA = await fetch(`${BASE_URL}/reviews/requests/invalid_review_token`);
    const resB = await fetch(`${BASE_URL}/reviews/requests/rev_0000000000000000`);

    if (resA.status === 404 && resB.status === 404) {
      recordResult(
        "Error Privacy",
        "Review request token error messages are uniform",
        "Both return 404 Not Found",
        "Uniform 404 Not Found returned for both",
        "PASS",
        "INFO"
      );
    } else {
      recordResult(
        "Error Privacy",
        "Review request token error messages are uniform",
        "Both return 404",
        `resA=${resA.status}, resB=${resB.status}`,
        "FAIL",
        "LOW"
      );
    }
  }

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log("\n=================== TEST SUMMARY ===================");
  const total = results.length;
  const pass = results.filter(r => r.status === "PASS").length;
  const fail = results.filter(r => r.status === "FAIL").length;
  const needsReview = results.filter(r => r.status === "NEEDS REVIEW").length;
  const blocked = results.filter(r => r.status === "BLOCKED").length;

  console.log(`TOTAL TESTS: ${total}`);
  console.log(`PASS: ${pass}`);
  console.log(`FAIL: ${fail}`);
  console.log(`NEEDS REVIEW: ${needsReview}`);
  console.log(`BLOCKED: ${blocked}`);
  console.log("====================================================\n");

  if (fail > 0) {
    console.log("--- CONFIRMED FINDINGS ---");
    results.filter(r => r.status === "FAIL").forEach((f, idx) => {
      console.log(`\nFinding #${idx + 1}: [${f.severity}] ${f.testName}`);
      console.log(`  Area: ${f.area}`);
      console.log(`  Details: ${f.details}`);
      console.log(`  Actual: ${f.actual}`);
      if (f.evidence) {
        console.log(`  Evidence: ${JSON.stringify(f.evidence, null, 2)}`);
      }
    });
  }
}

runPhase8Audit().catch(err => {
  console.error("Audit script failed:", err);
});
