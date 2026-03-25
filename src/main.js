import { Actor } from 'apify';
await Actor.init();

const input       = await Actor.getInput();
const fileName    = input.fileName;
const profileUrls = input.linkedinUrls ?? [];

// Auto values
const env            = Actor.getEnv();
const userId         = env.userId       || 'unknown';
const runId          = env.actorRunId   || 'unknown';
const now            = new Date();
const time           = now.toLocaleString('en-US', {
    year    : 'numeric',
    month   : 'long',
    day     : 'numeric',
    hour    : 'numeric',
    minute  : '2-digit',
    hour12  : true,
    timeZone: 'Asia/Kolkata'
});
const serviceTagName = fileName;
const rowCount       = profileUrls.length;
const creditsCost = parseFloat((rowCount * 0.005).toFixed(3));

const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbyHsvED6vYA0SQf_HgsQ09o4Kn88YwOKai7BFIJ9Ioa_Bsiavlw8Xq0u8J_xf1XFKQAyw/exec";

try {

    // ── 1. Google Sheet ──────────────────────────────────────────────────────
    let driveLink = '';
    try {
        const response = await fetch(GOOGLE_SHEET_URL, {
            method : "POST",
            headers: { "Content-Type": "application/json" },
            body   : JSON.stringify({ fileName, urls: profileUrls })
        });
        const result = await response.json();
        console.log("Google Sheet Response:", result);
        driveLink = result.fileLink ?? '';
    } catch (error) {
        console.log("Error sending data to Google Sheet:", error);
    }

    // ── 2. Airtable ──────────────────────────────────────────────────────────
    try {
        const airtableResponse = await fetch(
            'https://api.airtable.com/v0/appCuadMXrDqpfaDV/tblD3UXc3tYW0mOdT',
            {
                method : 'POST',
                headers: {
                    'Authorization': 'Bearer pat4bRijwFM7m1t9u.c5fa218d14d840e4180f628656b63c163ce71bd8d01881d971ee96fe2d939dd8',
                    'Content-Type' : 'application/json'
                },
                body: JSON.stringify({
                    fields: {
                        user_unique_id           : userId,
                        request_unique_id        : runId,
                        time_of_request          : time,
                        service_request_tag_name : serviceTagName,
                        service_request_size     : rowCount,
                        service_cost             : creditsCost,
                        service_request_url      : driveLink,
                        service_option_1         : 'linkedin',
                        service_name             : 'Linkedin Profile Scraper',
                        request_source           : 'Linkedin_Profile_Scraper_AP',
                    }
                })
            }
        );

        if (!airtableResponse.ok) {
            const errText = await airtableResponse.text();
            console.log("Airtable error:", errText);
        } else {
            const airtableResult = await airtableResponse.json();
            console.log("✅ Airtable Record Created:", airtableResult.id);
        }
    } catch (error) {
        console.log("Error sending data to Airtable:", error);
    }

    // ── 3. Webhook ───────────────────────────────────────────────────────────
    console.log('Sending to Webhook...');
    const webhookRes = await fetch(
        'https://s1.boomerangserver.co.in/webhook/private-profiles-scraper',
        {
            method : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body   : JSON.stringify({
                request_unique_id        : runId,
                time_of_request          : time,
                service_name             : 'Linkedin Profile Scraper',
                service_request_tag_name : serviceTagName,
                service_request_size     : rowCount,
                service_request_url      : driveLink,
                source                   : 'ap',
            })
        }
    );

    console.log('Webhook status:', webhookRes.status);
    const webhookText = await webhookRes.text();
    console.log('Webhook response:', webhookText);

    if (webhookRes.status !== 200) {
        throw new Error('❌ Webhook error: ' + webhookText);
    }

    console.log('✅ Webhook sent successfully!');

    // ── 4. Get request_id ────────────────────────────────────────────────────
    const webhookResult = JSON.parse(webhookText);
    const requestId     = webhookResult.request_id || '';

    if (!requestId) {
        throw new Error('⚠️ No request_id found in webhook response!');
    }
    console.log('Request ID:', requestId);

    // ── 5. Poll Stats Webhook ─────────────────────────────────────────────────
    console.log('Polling stats webhook every 2 min until Completed...');
    let isCompleted = false;
    let pollCount   = 0;

    while (!isCompleted) {
        pollCount++;
        console.log(`\n🔄 Poll attempt #${pollCount}...`);

        const statsRes = await fetch(
            `https://s1.boomerangserver.co.in/webhook/private-profile-export-request-stats?request_id=${requestId}`,
            {
                method : 'GET',
                headers: { 'Content-Type': 'application/json' }
            }
        );

        console.log('Stats webhook status:', statsRes.status);
        const statsText = await statsRes.text();
        console.log('Stats webhook response:', statsText);

        if (statsRes.status !== 200) {
            console.log('❌ Stats webhook returned non-200, stopping poll.');
            break;
        }

        const statsResult = JSON.parse(statsText);
        console.log('Request status:', statsResult.request_status);

        if (statsResult.request_status === 'Completed') {
            console.log('✅ Status = Completed! Stopping poll.');
            isCompleted = true;
        } else {
            console.log(`⏳ Still "${statsResult.request_status}" — waiting 2 minutes...`);
            await new Promise(resolve => setTimeout(resolve, 120000));
        }
    }

} catch (err) {
    console.log('❌ Error:', err.message);
}

await Actor.exit();
