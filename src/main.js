import { Actor } from 'apify';

await Actor.init();

try {

  // ──────────────────────────────
  // 1. GET INPUT
  // ──────────────────────────────
  const input          = await Actor.getInput();
  const serviceTagName = input.fileName     || '';
  const linkedinUrls   = input.linkedinUrls || [];
  const serviceName    = 'Linkedin Profile Scraper';
  const serviceOption1 = 'linkedin';
  const requestSource  = 'Linkedin_Profile_Scraper_AP';
  const boomerangInputUrl = 'https://s1.boomerangserver.co.in/webhook/private-profiles-scraper';

  console.log('Tag Name :', serviceTagName);
  console.log('Service  :', serviceName);
  console.log('URLs     :', linkedinUrls.length);

  if (!serviceTagName.trim()) throw new Error('fileName is required!');
  if (!linkedinUrls.length)   throw new Error('At least one LinkedIn URL is required!');

  // ──────────────────────────────
  // 2. VALIDATE + CLEAN URLS
  // ──────────────────────────────
  const validUrls = linkedinUrls
    .map(u => (typeof u === 'string' ? u.trim() : ''))
    .filter(u => u.startsWith('https://www.linkedin.com/in/'));

  console.log('Valid URLs:', validUrls.length);
  if (!validUrls.length) throw new Error('No valid LinkedIn profile URLs found!');

  const rowCount   = validUrls.length;
  const csvContent = 'url\n' + validUrls.join('\n');
  const fileName   = serviceTagName.replace(/[^a-zA-Z0-9]/g, '_') + '_' + new Date().toISOString().replace(/[:.]/g, '-') + '.csv';

  console.log('CSV preview:\n', csvContent.split('\n').slice(0, 3).join('\n'));

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

  console.log('User ID :', userId);
  console.log('Run ID  :', runId);
  console.log('Time    :', time);

  // ──────────────────────────────
  // 4. CALCULATE COST
  // ──────────────────────────────
  const creditsCost = parseFloat((rowCount * 0.005).toFixed(3));
  console.log('URL count    :', rowCount);
  console.log('Credits cost : $', creditsCost);

  // ──────────────────────────────
  // 5. STEP 1 — TRIGGER WORKFLOW 1
  //    Setup folders, batches, NocoDB
  // ──────────────────────────────
  console.log('\n════════════════════════════════════');
  console.log('Step 1 : Setting up master & batches');
  console.log('════════════════════════════════════');

  let wf1Res;
  try {
    wf1Res = await fetch(
      'https://n8n-internal.chitlangia.co/webhook/master_webhook',
      {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal : AbortSignal.timeout(60000),
        body   : JSON.stringify({
          userId,
          runId,
          time,
          serviceTagName,
          rowCount,
          creditsCost,
          csvContent,
          uploadedFile     : '',
          fileName,
          boomerangInputUrl,
          service_option_1 : serviceOption1,
          service_name     : serviceName,
          request_source   : requestSource
        })
      }
    );
  } catch (fetchErr) {
    throw new Error(`Step 1 failed: ${fetchErr.message}`);
  }

  const wf1Text = await wf1Res.text();
  console.log('n8n step 1 status  :', wf1Res.status);
  console.log('n8n step 1 response:', wf1Text);

  if (!wf1Res.ok) throw new Error(`Step 1 error ${wf1Res.status}: ${wf1Text.slice(0, 200)}`);

  let wf1Data;
  try {
    wf1Data = JSON.parse(wf1Text);
  } catch (e) {
    throw new Error(`Step 1 JSON parse failed: ${wf1Text.slice(0, 200)}`);
  }

  const request_unique_id = wf1Data.request_unique_id || '';
  const masterFileUrl     = wf1Data.masterFileUrl     || '';
  const total_batches     = parseInt(wf1Data.total_batches || '0');
  const batchFolderId     = wf1Data.batchFolderId     || '';
  const nocodb_master_id  = wf1Data.nocodb_master_id  || '';

  if (!request_unique_id) throw new Error('No request_unique_id returned from Step 1!');

  console.log('\n✅ Step 1 Complete!');
  console.log('   Request ID    :', request_unique_id);
  console.log('   Master File   :', masterFileUrl);
  console.log('   Total Batches :', total_batches);

  // ──────────────────────────────
  // 6. STEP 2 — PROCESS BATCHES
  //    5 batches at a time
  // ──────────────────────────────
  let completedBatches = 0;
  let round            = 0;
  let allOutputLinks   = [];

  while (true) {

    round++;
    const remaining = total_batches - completedBatches;
    const thisRound = Math.min(5, remaining);

    console.log(`\n════════════════════════════════════`);
    console.log(`Step 2 : Round ${round} — ${thisRound} batch(es)`);
    console.log(`         Completed : ${completedBatches}/${total_batches}`);
    console.log(`         Remaining : ${remaining}`);
    console.log(`════════════════════════════════════`);

    // ── 2a. Get pending batches from Workflow 2 ──
    let wf2Res;
    try {
      wf2Res = await fetch(
        'https://n8n-internal.chitlangia.co/webhook/batch-process',
        {
          method : 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal : AbortSignal.timeout(60000),
          body   : JSON.stringify({
            request_unique_id,
            batchFolderId,
            userId,
            runId,
            time,
            serviceTagName,
            rowCount,
            creditsCost,
            nocodb_master_id,
            boomerangInputUrl,
            service_option_1 : serviceOption1,
            service_name     : serviceName,
            request_source   : requestSource
          })
        }
      );
    } catch (fetchErr) {
      throw new Error(`Step 2 Round ${round} failed: ${fetchErr.message}`);
    }

    const wf2Text = await wf2Res.text();
    console.log('n8n step 2 status  :', wf2Res.status);
    console.log('n8n step 2 response:', wf2Text);

    if (!wf2Res.ok) throw new Error(`Step 2 error ${wf2Res.status}: ${wf2Text.slice(0, 200)}`);

    // Handle empty response
    if (!wf2Text || wf2Text.trim() === '') {
      console.log('✅ No more pending batches. All done!');
      break;
    }

    let wf2Data;
    try {
      wf2Data = JSON.parse(wf2Text);
    } catch (e) {
      console.log('Step 2 response not JSON, exiting loop.');
      break;
    }

    const batchJobs = wf2Data.batchJobs || [];

    if (batchJobs.length === 0) {
      console.log('✅ No more pending batches. All done!');
      break;
    }

    // ── 2b. Poll Boomerang for each batch ──
    console.log(`\nPolling Boomerang status every 2 minutes...`);

    const POLL_INTERVAL_MS = 2 * 60 * 1000;
    const batchResults     = [];

    for (const job of batchJobs) {

      const { request_id, driveInputLink, batch_number, nocodb_id } = job;

      console.log(`\n  ⏳ Batch ${batch_number} — Polling (request_id: ${request_id})...`);

      let requestStatus  = '';
      let profilesFound     = 0;
      let profilesNotFound  = 0;
      let pollAttempts   = 0;

      while (true) {

        pollAttempts++;

        let statsRes;
        try {
          statsRes = await fetch(
            `https://s1.boomerangserver.co.in/webhook/private-profile-scraper-stats?request_id=${request_id}`,
            { method: 'GET', signal: AbortSignal.timeout(15000) }
          );
        } catch (fetchErr) {
          console.log(`  Batch ${batch_number} poll ${pollAttempts} failed: ${fetchErr.message}, retrying...`);
          await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
          continue;
        }

        const statsText = await statsRes.text();
        let statsData;
        try {
          statsData = JSON.parse(statsText);
        } catch (e) {
          console.log(`  Batch ${batch_number} stats parse failed, retrying...`);
          await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
          continue;
        }

        requestStatus    = statsData.request_status || statsData.requestStatus || statsData.status || '';
        profilesFound    = statsData.total_profiles_found    || 0;
        profilesNotFound = statsData.total_profiles_not_found || 0;

        console.log(`  Batch ${batch_number} | Status: ${requestStatus || 'Pending'} | Found: ${profilesFound} | Not Found: ${profilesNotFound}`);

        if (requestStatus === 'Completed') {
          console.log(`  ✅ Batch ${batch_number} complete!`);
          break;
        }

        await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
      }

      // ── 2c. Call waterfall-output webhook ──
      const boomerangOutputUrl = `https://s1.boomerangserver.co.in/webhook/private-profile-scraper-output?request_id=${request_id}`;

      let outputLink = '';
      try {
        const outputRes = await fetch(
          'https://n8n-internal.chitlangia.co/webhook/waterfall-output',
          {
            method : 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal : AbortSignal.timeout(60000),
            body   : JSON.stringify({
              userId,
              runId,
              time,
              serviceTagName,
              rowCount      : job.batch_size || rowCount,
              creditsCost,
              request_id,
              requestStatus,
              driveInputLink,
              boomerangOutputUrl,
              nocodb_id,
              batch_number,
              request_unique_id,
              batchFolderId,
              service_option_1 : serviceOption1,
              service_name     : serviceName,
              request_source   : requestSource
            })
          }
        );

        const outputText = await outputRes.text();
        if (outputRes.ok) {
          try {
            const outputData = JSON.parse(outputText);
            outputLink = outputData['Output Link'] || outputData.outputLink || outputData.driveOutputLink || outputData.webViewLink || '';
          } catch (e) {
            console.log(`  Batch ${batch_number} output parse failed, continuing...`);
          }
        } else {
          console.log(`  Batch ${batch_number} output webhook returned ${outputRes.status}`);
        }
      } catch (fetchErr) {
        console.log(`  Batch ${batch_number} output webhook failed: ${fetchErr.message}`);
      }

      batchResults.push({
        batch_number,
        request_id,
        status           : requestStatus,
        profiles_found   : profilesFound,
        profiles_not_found: profilesNotFound,
        output_url       : outputLink
      });

      allOutputLinks.push(outputLink);
    }

    // ── 2d. Log round results ──
    console.log(`\n✅ Round ${round} Results:`);
    for (const result of batchResults) {
      console.log(`\n   📦 Batch ${result.batch_number}`);
      console.log(`      Request ID       : ${result.request_id}`);
      console.log(`      Status           : ${result.status}`);
      console.log(`      Profiles Found   : ${result.profiles_found}`);
      console.log(`      Profiles Missing : ${result.profiles_not_found}`);
      console.log(`      Output Link      : ${result.output_url}`);
    }

    completedBatches += batchResults.length;

    // Save round to Apify dataset
    await Actor.pushData({
      round,
      request_unique_id,
      completedBatches,
      total_batches,
      batchResults
    });

    if (completedBatches < total_batches) {
      console.log(`\n⏳ ${total_batches - completedBatches} batch(es) remaining. Starting next round...`);
    }
  }

  // ──────────────────────────────
  // 7. FINAL SUMMARY
  // ──────────────────────────────
  console.log('\n════════════════════════════════════');
  console.log('🎉 ALL BATCHES COMPLETED!');
  console.log('════════════════════════════════════');
  console.log('Request ID    :', request_unique_id);
  console.log('Total Batches :', total_batches);
  console.log('\nOutput Links:');
  allOutputLinks.forEach((link, i) => console.log(`  Batch ${i + 1} : ${link}`));
  console.log('════════════════════════════════════');

  await Actor.pushData({
    status           : 'completed',
    request_unique_id,
    total_batches,
    allOutputLinks
  });

} catch (err) {
  console.log('❌ Error:', err.message);
}

await Actor.exit();
