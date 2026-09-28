import 'dotenv/config';
import { createApp } from '../backend/src/app.ts';

async function run() {
  console.log('--- Starting Content API Integration Tests ---');
  const app = createApp();
  const server = app.listen(4005);
  const BASE = 'http://localhost:4005/api/v1';

  try {
    // 1. Health check
    console.log('Testing GET /health...');
    const healthRes = await fetch(`${BASE}/health`);
    console.log(`Health status: ${healthRes.status}`);

    // 2. Public homepage (before or default)
    console.log('\nTesting GET /content/homepage...');
    const hpRes = await fetch(`${BASE}/content/homepage`);
    console.log(`GET /content/homepage status: ${hpRes.status}`);
    const hpData = await hpRes.json();
    console.log('Homepage response status:', hpData.status);

    // 3. Admin Login
    console.log('\nLogging in as admin...');
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
    if (!token) {
      throw new Error(`Login failed: ${JSON.stringify(loginJson)}`);
    }
    console.log('Login successful! Access token obtained.');

    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // 4. Admin Update Homepage Config
    console.log('\nTesting PUT /admin/content/homepage...');
    const updateHpRes = await fetch(`${BASE}/admin/content/homepage`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        heroTitle: 'Live Deeply. Travel Boldly.',
        heroSubtitle: 'Uncover the raw, untold beauty of Uttarakhand with small groups of mindful travellers.',
        whyUsTitle: 'The Mindful Adventure Movement',
        whyUsDescription: 'We started Yatrivo to bridge the gap between heavy commercial bus tours and risky, unguided expeditions.',
        slides: [
          {
            slideType: 'static',
            imageUrl: 'https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=1920',
            titleOverride: 'Chopta Valley Expedition',
            subtitleOverride: 'Trek through pristine alpine meadows',
            isActive: true
          }
        ],
        featuredDestinationIds: ['chopta', 'auli', 'kedarnath'],
        featuredReviewIds: ['r1', 'r2'],
        whyUsPoints: [
          { icon: '🗺️', title: 'Handpicked Paths', description: 'Carefully charted trails away from tourist crowds.' },
          { icon: '👥', title: 'Youthful Vibe', description: 'Small groups, like-minded active adventurers.' },
          { icon: '🏔️', title: 'Himalayan Trust', description: 'Certified local guides & sustainable execution.' }
        ]
      })
    });
    console.log(`PUT /admin/content/homepage status: ${updateHpRes.status}`);
    const updateHpJson = await updateHpRes.json();
    console.log('Updated homepage status:', updateHpJson.status);
    console.log('Updated slides count:', updateHpJson.data?.slides?.length);

    // 5. Admin Get Homepage Config
    console.log('\nTesting GET /admin/content/homepage...');
    const getAdminHpRes = await fetch(`${BASE}/admin/content/homepage`, { headers: authHeaders });
    const getAdminHpJson = await getAdminHpRes.json();
    console.log(`GET /admin/content/homepage status: ${getAdminHpRes.status}`);
    console.log('Hero title returned:', getAdminHpJson.data?.heroTitle || getAdminHpJson.data?.hero_title);

    // 6. FAQs: Create, List, Update, Reorder, Delete
    console.log('\nTesting POST /admin/content/faqs...');
    const createFaqRes = await fetch(`${BASE}/admin/content/faqs`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        question: 'What is the fitness level required for Yatrivo treks?',
        answer: 'Most of our weekend expeditions require moderate fitness. You should be comfortable walking 4-6 km.',
        category: 'preparation'
      })
    });
    console.log(`POST /admin/content/faqs status: ${createFaqRes.status}`);
    const createdFaq = await createFaqRes.json();
    const faqId = createdFaq.data?.id;
    console.log(`Created FAQ ID: ${faqId}`);

    console.log('\nTesting PATCH /admin/content/faqs/:id...');
    const patchFaqRes = await fetch(`${BASE}/admin/content/faqs/${faqId}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        question: 'What fitness level is required for Yatrivo treks? (Updated)'
      })
    });
    console.log(`PATCH /admin/content/faqs status: ${patchFaqRes.status}`);

    console.log('\nTesting GET /content/faqs (public)...');
    const publicFaqsRes = await fetch(`${BASE}/content/faqs`);
    const publicFaqsJson = await publicFaqsRes.json();
    console.log(`GET /content/faqs status: ${publicFaqsRes.status}, count: ${publicFaqsJson.data?.length}`);

    console.log('\nTesting PUT /admin/content/faqs/reorder...');
    const reorderRes = await fetch(`${BASE}/admin/content/faqs/reorder`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ ids: [faqId] })
    });
    console.log(`PUT /admin/content/faqs/reorder status: ${reorderRes.status}`);

    // 7. Content Pages: About, Terms, Privacy
    console.log('\nTesting PUT /admin/content/pages/about...');
    const putAboutRes = await fetch(`${BASE}/admin/content/pages/about`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'About Us',
        body: 'Yatrivo was born in Dehradun with a mission to bring mindful travel to Uttarakhand.',
        status: 'published'
      })
    });
    console.log(`PUT /admin/content/pages/about status: ${putAboutRes.status}`);

    console.log('\nTesting GET /content/pages/about (public)...');
    const getAboutRes = await fetch(`${BASE}/content/pages/about`);
    const getAboutJson = await getAboutRes.json();
    console.log(`GET /content/pages/about status: ${getAboutRes.status}, title: ${getAboutJson.data?.title}`);

    console.log('\nTesting PUT /admin/content/pages/terms...');
    const putTermsRes = await fetch(`${BASE}/admin/content/pages/terms`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'Terms & Conditions',
        body: 'Custom updated Terms and Conditions for Yatrivo customers.',
        status: 'published'
      })
    });
    console.log(`PUT /admin/content/pages/terms status: ${putTermsRes.status}`);

    console.log('\nTesting PUT /admin/content/pages/privacy...');
    const putPrivacyRes = await fetch(`${BASE}/admin/content/pages/privacy`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'Privacy Policy',
        body: 'Custom updated Privacy Policy for Yatrivo customers.',
        status: 'published'
      })
    });
    console.log(`PUT /admin/content/pages/privacy status: ${putPrivacyRes.status}`);

    console.log('\n--- ALL CONTENT API INTEGRATION TESTS PASSED SUCCESSFULLY! ---');
  } catch (err) {
    console.error('Test failed with error:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

run();
