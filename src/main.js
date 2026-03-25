import { Actor } from 'apify';
await Actor.init();

const input = await Actor.getInput();
const fileName = input.fileName;
const profileUrls = input.profileUrls;

const userId         = input.userId;
const runId          = Actor.getEnv().actorRunId;
const time           = new Date().toISOString();
const serviceTagName = fileName;     
const rowCount       = profileUrls.length;
const creditsCost    = input.creditsCost;
const driveLink      = input.driveLink;

const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbyHsvED6vYA0SQf_HgsQ09o4Kn88YwOKai7BFIJ9Ioa_Bsiavlw8Xq0u8J_xf1XFKQAyw/exec";

// ── 1. Google Sheet ──────────────────────────────────────────────────────────
try {
    const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName, urls: profileUrls })
    });
    const result = await response.json();
    console.log("Google Sheet Response:", result);
} catch (error) {
    console.log("Error sending data to Google Sheet:", error);
}

// ── 2. Airtable ──────────────────────────────────────────────────────────────
try {
    const airtableResponse = await fetch(
        'https://api.airtable.com/v0/appCuadMXrDqpfaDV/tblD3UXc3tYW0mOdT',
        {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer pat4bRijwFM7m1t9u.c5fa218d14d840e4180f628656b63c163ce71bd8d01881d971ee96fe2d939dd8',
                'Content-Type': 'application/json'
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
                    service_name             : 'Linkedin Profile Scraper 2',
                    request_source           : 'Linkedin_profile_scraper_AP',
                }
            })
        }
    );

    if (!airtableResponse.ok) {
        const errText = await airtableResponse.text();
        console.log("Airtable error:", errText);
    } else {
        const airtableResult = await airtableResponse.json();
        console.log("Airtable Record Created:", airtableResult.id);
    }
} catch (error) {
    console.log("Error sending data to Airtable:", error);
}

await Actor.exit();
