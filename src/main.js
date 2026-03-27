import { Actor } from 'apify';

await Actor.init();

try {

  // ──────────────────────────────
  // 1. GET INPUT
  // ──────────────────────────────
  const input         = await Actor.getInput();
  const fileName      = input.fileName         || '';
  const linkedinUrls  = input.linkedinUrls     || [];

  console.log('File Name:', fileName);
  console.log('URLs provided:', linkedinUrls.length);

  if (!fileName.trim()) throw new Error('fileName is required!');
  if (!linkedinUrls.length) throw new Error('At least one LinkedIn URL is required!');

  // ──────────────────────────────
  // 2. VALIDATE + CLEAN URLS
  // ──────────────────────────────
  const validUrls = linkedinUrls
    .map(u => (typeof u === 'string' ? u.trim() : ''))
    .filter(u => u.startsWith('https://www.linkedin.com/in/'));

  console.log('Valid URLs:', validUrls.length);

  if (!validUrls.length) throw new Error('No valid LinkedIn profile URLs found!');

  const rowCount = validUrls.length;

  // ──────────────────────────────
  // 3. GET APIFY RUN DETAILS
  // ──────────────────────────────
  const env    = Actor.getEnv();
  const userId = env.userId     || 'unknown';
  const runId  = env.actorRunId || 'unknown';
  const now    = new Date();
  const time   = now.toLocaleString('en-US', {
    year    : 'numeric',
    month   : 'long',
    day     : 'numeric',
    hour    : 'numeric',
    minute  : '2-digit',
    hour12  : true,
    timeZone: 'Asia/Kolkata'
  });

  console.log('User ID:', userId);
  console.log('Run ID :', runId);
  console.log('Time   :', time);

  // ──────────────────────────────
  // 4. CALCULATE COST
  // ──────────────────────────────
  const creditsCost = parseFloat((rowCount * 0.005).toFixed(3));
  console.log('URL count    :', rowCount);
  console.log('Credits cost : $', creditsCost);

  // ──────────────────────────────
  // 5. TRIGGER N8N — STEP 1
  // Sends URLs + metadata → n8n responds with { request_id, driveLink }
  // Timeout: 30 seconds
  // ──────────────────────────────
  console.log('\nStep 1: Triggering n8n social-url input...');

  let n8nRes;
  try {
    n8nRes = await fetch(
      'https://n8n-internal.chitlangia.co/webhook/waterfall-input',
      {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal : AbortSignal.timeout(30000),
        body   : JSON.stringify({
          userId,
          runId,
          time,
          fileName,
          rowCount,
          creditsCost,
          linkedinUrls : validUrls,
          service_option_1         : 'linkedin',
          service_name             : 'Linkedin Profile Scraper',
          request_source           : 'Linkedin_Profile_Scraper_AP'
        })
      }
    );
  } catch (fetchErr) {
    throw new Error(`Step 1 fetch failed: ${fetchErr.message}`);
  }

  console.log('n8n step 1 status:', n8nRes.status);

  const n8nText = await n8nRes.text();
  console.log('n8n step 1 raw response:', n8nText);

  if (!n8nRes.ok) {
    throw new Error(`Step 1 failed with status ${n8nRes.status}. Response: ${n8nText.slice(0, 200)}`);
  }

  let n8nData;
  try {
    n8nData = JSON.parse(n8nText);
  } catch (parseErr) {
    throw new Error(`Step 1 JSON parse failed. Raw response: ${n8nText.slice(0, 200)}`);
  }

  console.log('n8n step 1 response:', JSON.stringify(n8nData));

  const request_id = String(n8nData.request_id || '');
  const driveLink  = n8nData.driveLink || '';

  if (!request_id) throw new Error('No request_id returned from n8n step 1!');

  console.log('Request ID :', request_id);
  console.log('Drive Link :', driveLink);

  // ──────────────────────────────
  // 6. POLL BOOMERANG DIRECTLY — STEP 2
  // Polls every 2 min until request_status = Completed
  // ──────────────────────────────
  console.log('\nStep 2: Polling Boomerang directly for status...');
  console.log('Polling every 2 minutes until Completed...');

  const POLL_INTERVAL_MS = 2 * 60 * 1000;
  let requestStatus      = '';
  let attempts           = 0;

  while (true) {

    attempts++;
    console.log(`\nPoll attempt ${attempts}...`);

    let boomerangRes;
    try {
      boomerangRes = await fetch(
        `https://s1.boomerangserver.co.in/webhook/private-profile-scraper-stats?request_id=${requestId}`,
        { method: 'GET', signal: AbortSignal.timeout(15000) }
      );
    } catch (fetchErr) {
      console.log(`Poll attempt ${attempts} fetch failed: ${fetchErr.message}, retrying in 2 min...`);
      await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
      continue;
    }

    const boomerangText = await boomerangRes.text();

    let boomerangData;
    try {
      boomerangData = JSON.parse(boomerangText);
    } catch (e) {
      console.log('Boomerang JSON parse failed, retrying in 2 min...');
      await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
      continue;
    }

    requestStatus = boomerangData.request_status || boomerangData.requestStatus || boomerangData.status || '';

    const emailFound    = boomerangData.total_email_found    || 0;
    const emailNotFound = boomerangData.total_email_not_found || 0;

    if (requestStatus)   console.log(`Status           : ${requestStatus}`);
    if (emailFound)      console.log(`Emails Found     : ${emailFound}`);
    if (emailNotFound)   console.log(`Emails Not Found : ${emailNotFound}`);

    if (requestStatus === 'Completed') {
      console.log('✅ Boomerang processing complete!');
      break;
    }

    console.log(requestStatus
      ? `Waiting 2 minutes... (${requestStatus})`
      : 'No status returned yet, retrying in 2 min...'
    );

    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
  }

  // ──────────────────────────────
  // 7. TRIGGER N8N — STEP 3
  // Sends request_id + status → n8n returns outputLink
  // Timeout: 30 seconds
  // ──────────────────────────────
  console.log('\nStep 3: Sending output to n8n social-url-output...');

  let outputLink = '';

  try {
    const outputRes = await fetch(
      'https://n8n-internal.chitlangia.co/webhook/waterfall-output',
      {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal : AbortSignal.timeout(30000),
        body   : JSON.stringify({
          userId,
          runId,
          time,
          fileName,
          rowCount,
          creditsCost,
          request_id,
          requestStatus,
          driveInputLink : driveLink
        })
      }
    );

    const outputText = await outputRes.text();
    console.log('n8n step 3 status:', outputRes.status);
    console.log('n8n step 3 raw response:', outputText);

    if (outputRes.ok) {
      try {
        const outputData = JSON.parse(outputText);
        outputLink = outputData.driveOutputLink || outputData['Output Link'] || outputData.outputLink || outputData.webViewLink || '';
        if (outputLink) console.log('Output Link:', outputLink);
      } catch (e) {
        console.log('Step 3 JSON parse failed, continuing...');
      }
    } else {
      console.log(`Warning: Step 3 returned status ${outputRes.status}, continuing...`);
    }

  } catch (fetchErr) {
    console.log(`Warning: Step 3 fetch failed: ${fetchErr.message}`);
    console.log('Continuing to save output anyway...');
  }

  // ──────────────────────────────
  // 8. SAVE FINAL OUTPUT TO APIFY DATASET
  // ──────────────────────────────
  await Actor.pushData({
    userId,
    runId,
    time,
    fileName,
    rowCount,
    creditsCost,
    request_id,
    driveInputLink  : driveLink,
    driveOutputLink : outputLink,
    requestStatus
  });

  console.log('\n✅ Final output saved!');
  console.log('Request ID   :', request_id);
  console.log('Input Link   :', driveLink);
  if (outputLink) console.log('Output Link  :', outputLink);
  console.log('Status       :', requestStatus);

} catch (err) {
  console.log('❌ Error:', err.message);
}

await Actor.exit();
