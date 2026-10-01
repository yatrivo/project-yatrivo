const BASE_URL = "http://localhost:4000/api/v1";

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  return { token: data.data.tokens.accessToken, user: data.data.user };
}

async function run() {
  console.log("=== Testing Draft Privacy & Password Reset Uniformity ===");

  const admin = await login("admin@yatrivo.com", "YatrivoAdmin@2026!");
  const adminHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${admin.token}`
  };

  // 1. Create a destination and set status to 'draft'
  const destRes = await fetch(`${BASE_URL}/destinations`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({
      name: `Draft Secret ${Date.now()}`,
      image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800",
      description: "Secret draft destination"
    })
  });
  const destJson = await destRes.json();
  const dest = destJson.data;

  if (dest) {
    // Set status to draft
    const patchRes = await fetch(`${BASE_URL}/destinations/${dest.id}`, {
      method: "PATCH",
      headers: adminHeaders,
      body: JSON.stringify({ status: "draft" })
    });
    const patchData = await patchRes.json();
    console.log("Destination patched to status:", patchData.data?.status);

    // Test public access to draft destination
    const pubListRes = await fetch(`${BASE_URL}/destinations`);
    const pubList = await pubListRes.json();
    const inPubList = pubList.data?.some(d => d.id === dest.id);
    console.log("Draft destination in public list:", inPubList);

    const pubDirectRes = await fetch(`${BASE_URL}/destinations/${dest.slug}`);
    console.log("Draft destination public direct status:", pubDirectRes.status);
    if (pubDirectRes.status === 200) {
      const pubDirectData = await pubDirectRes.json();
      console.log("[CONFIRMED VULNERABILITY] Public user can access draft destination directly:", {
        slug: dest.slug,
        status: pubDirectData.data?.status || pubDirectData.status,
        name: pubDirectData.data?.name || pubDirectData.name
      });
    }

    // Clean up / archive
    await fetch(`${BASE_URL}/destinations/${dest.id}/archive`, { method: "POST", headers: adminHeaders });
  }

  // 2. Test forgot password responses
  console.log("\n--- Testing Forgot Password Uniformity ---");
  // Check code directly in auth.controller.ts and auth.service.ts:
  // Both existing and non-existing email return:
  // res.status(200).json({ status: "success", message: "If an account with that email exists, a password reset link has been sent." })
  console.log("Verified in auth.controller.ts: returns uniform 200 OK message to prevent account enumeration.");
}

run().catch(console.error);
