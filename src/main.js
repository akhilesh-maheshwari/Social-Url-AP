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
  const boomerangInputUrl = 'https://s1.boomerangserver.co.in/webhook/15663bd4-b260-49a7-af01-8e0ada511bf7';
  const boomerangStatUrl  = 'https://s1.boomerangserver.co.in/webhook/private-profile-scraper-stats';

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
  // ──────────────────────────────
  console.log('\n════════════════════════════════════');
  console.log('Step 1 : Setting up master & batches');
  console.log('════════════════════════════════════');

  let wf1Res;
  try {
    wf1Res = await fetch(
      'https://frontend.boomerangserver.co.in/webhook/master_webhook_socialurl',
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
  const batch_id          = wf1Data.batch_id          || '';

  if (!request_unique_id) throw new Error('No request_unique_id returned from Step 1!');

  console.log('\n✅ Step 1 Complete!');
  console.log('   Request ID    :', request_unique_id);
  console.log('   Master File   :', masterFileUrl);
  console.log('   Total Batches :', total_batches);

  // ──────────────────────────────
  // 6. STEP 2 — PROCESS BATCHES
  // ──────────────────────────────
  let completedBatches = 0;
  let round            = 0;
  let allOutputLinks   = [];

  // Helper: call Workflow 2 to get next pending batches
  const getNextBatchJobs = async () => {
    try {
      const wf2Res = await fetch(
        'https://frontend.boomerangserver.co.in/webhook/batches_socialurl',
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
            batch_id,
            boomerangInputUrl,
            service_option_1 : serviceOption1,
            service_name     : serviceName,
            request_source   : requestSource
          })
        }
      );
      const wf2Text = await wf2Res.text();
      console.log('n8n step 2 status  :', wf2Res.status);
      console.log('n8n step 2 response:', wf2Text);
      if (!wf2Text || wf2Text.trim() === '') return null;
      const wf2Data = JSON.parse(wf2Text);
      return wf2Data.batchJobs || null;
    } catch (err) {
      console.log('❌ No response, please try again.');
      return null;
    }
  };

  // Get first round of batchJobs
  let batchJobs = await getNextBatchJobs();

  if (!batchJobs || batchJobs.length === 0) {
    console.log('❌ No response, please try again.');
  } else {

    while (true) {

      round++;
      console.log(`\n════════════════════════════════════`);
      console.log(`Step 2 : Round ${round} — ${batchJobs.length} batch(es)`);
      console.log(`         Completed : ${completedBatches}/${total_batches}`);
      console.log(`         Remaining : ${total_batches - completedBatches}`);
      console.log(`════════════════════════════════════`);

      // ── Call Workflow 3 for ALL batches simultaneously ──
      console.log(`\n  Sending ${batchJobs.length} batches to n8n for status checking...`);

      const batchStatusResults = await Promise.all(
        batchJobs.map(async (job) => {
          const { request_id, driveInputLink, batch_number, nocodb_id } = job;
          console.log(`  ⏳ Batch ${batch_number} — Waiting for n8n to complete (request_id: ${request_id})...`);
          let statusData = null;
          while (!statusData) {
            try {
              const statusRes = await fetch(
                'https://frontend.boomerangserver.co.in/webhook/batch-status-socialurl',
                {
                  method : 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  signal : AbortSignal.timeout(60 * 60 * 1000),
                  body   : JSON.stringify({
                    request_id,
                    batch_number,
                    nocodb_id,
                    driveInputLink,
                    request_unique_id,
                    batchFolderId,
                    boomerangStatUrl,
                    userId,
                    runId,
                    time,
                    serviceTagName,
                    rowCount  : job.batch_size || rowCount,
                    creditsCost
                  })
                }
              );
              const statusText = await statusRes.text();

              if (statusText.includes('<html>') || statusText.includes('504')) {
                console.log(`  ❌ Batch ${batch_number} — 504 Gateway Timeout, please try again.`);
                statusData = { status: 'GatewayTimeout' };
                break;
              }

              console.log(`  ✅ Batch ${batch_number} n8n response:`, statusText);
              statusData = JSON.parse(statusText);

            } catch (err) {
              console.log(`  ❌ No response, please try again.`);
              statusData = { status: 'Failed' };
            }
          }
          return { ...statusData, job };
        })
      );

      // Stop if 504 timeout
      const hasTimeout = batchStatusResults.some(r => r.status === 'GatewayTimeout');
      if (hasTimeout) {
        console.log('\n❌ 504 Gateway Timeout — stopping. Please try again.');
        break;
      }

      // ── Call Workflow 4 for each completed batch ──
      const batchResults = [];

      for (const result of batchStatusResults) {
        const { job } = result;
        const { request_id, driveInputLink, batch_number, nocodb_id } = job;

        // Skip output if not completed
        if (result.status !== 'Completed') {
          console.log(`  ⚠️ Batch ${batch_number} did not complete. Skipping output.`);
          batchResults.push({
            batch_number,
            request_id,
            status             : result.status || 'Failed',
            profiles_found     : 0,
            profiles_not_found : 0,
            output_url         : ''
          });
          allOutputLinks.push('');
          continue;
        }

        const boomerangOutputUrl = `https://s1.boomerangserver.co.in/webhook/private-profile-scraper-output?request_id=${request_id}`;

        let outputLink = '';
        try {
          const outputRes = await fetch(
            'https://frontend.boomerangserver.co.in/webhook/waterfall-output-socialurl',
            {
              method : 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal : AbortSignal.timeout(60000),
              body   : JSON.stringify({
                userId,
                runId,
                time,
                serviceTagName,
                rowCount         : job.batch_size || rowCount,
                creditsCost,
                request_id,
                requestStatus    : result.status,
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
              console.log(`  Batch ${batch_number} output parse failed.`);
            }
          } else {
            console.log(`  ❌ No response, please try again.`);
          }
        } catch (fetchErr) {
          console.log(`  ❌ No response, please try again.`);
        }

        batchResults.push({
          batch_number,
          request_id,
          status             : result.status,
          profiles_found     : result.profiles_found     || 0,
          profiles_not_found : result.profiles_not_found || 0,
          output_url         : outputLink
        });

        allOutputLinks.push(outputLink);
      }

      // ── Log round results ──
      console.log(`\n✅ Round ${round} Results:`);
      for (const result of batchResults) {
        console.log(`\n   📦 Batch ${result.batch_number}`);
        console.log(`      Request ID       : ${result.request_id}`);
        console.log(`      Status           : ${result.status}`);
        console.log(`      Output Link      : ${result.output_url}`);
      }

      completedBatches += batchResults.length;

      await Actor.pushData({ round, request_unique_id, completedBatches, total_batches, batchResults });

      // ── Break if all done ──
      if (completedBatches >= total_batches) {
        const anyFailed = batchResults.some(r => r.status !== 'Completed' || !r.output_url);
        if (anyFailed) {
          console.log('\n⚠️ Some batches did not complete successfully.');
        } else {
          // Call Workflow 2 once more to trigger false branch → updates apify_master → Completed
          await getNextBatchJobs();
        }
        break;
      }

      // ── Get next round ──
      console.log(`\n⏳ ${total_batches - completedBatches} batch(es) remaining. Getting next round...`);
      batchJobs = await getNextBatchJobs();

      if (!batchJobs || batchJobs.length === 0) {
        console.log('✅ No more pending batches.');
        break;
      }
    }
  }

  // ──────────────────────────────
  // 7. FINAL SUMMARY
  // ──────────────────────────────
  const successLinks = allOutputLinks.filter(l => l);
  if (successLinks.length > 0 && successLinks.length === total_batches) {
    console.log('\n════════════════════════════════════');
    console.log('🎉 ALL BATCHES COMPLETED!');
    console.log('════════════════════════════════════');
    console.log('Request ID    :', request_unique_id);
    console.log('Total Batches :', total_batches);
    console.log('\nOutput Links:');
    allOutputLinks.forEach((link, i) => console.log(`  Batch ${i + 1} : ${link || 'Failed'}`));
    console.log('════════════════════════════════════');

    await Actor.pushData({ status: 'completed', request_unique_id, total_batches, allOutputLinks });
  }

} catch (err) {
  console.log('❌ Error:', err.message);
}

await Actor.exit();
