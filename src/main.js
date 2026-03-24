import { Actor, log } from 'apify';
import axios from 'axios';
import * as xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';
import os from 'os';
import FormData from 'form-data';

const DRIVE_FOLDER_ID = process.env.DRIVE_FOLDER_ID;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const STATS_WEBHOOK_URL = process.env.STATS_WEBHOOK_URL;
const POLL_INTERVAL_MS = 60_000;
const MAX_POLL_ATTEMPTS = 60;

await Actor.init();

try {
    const input = await Actor.getInput() ?? {};
    const { linkedinUrls = [], fileName } = input;

    if (!fileName || typeof fileName !== 'string' || fileName.trim() === '') {
        throw new Error('File name (fileName) is required.');
    }

    if (!linkedinUrls || linkedinUrls.length === 0) {
        throw new Error('At least one LinkedIn profile URL is required.');
    }

    const cleanedUrls = linkedinUrls
        .map(url => url?.trim())
        .filter(url => url && url.length > 0)
        .filter(url => url.includes('linkedin.com/in/') || url.includes('linkedin.com/pub/'));

    if (cleanedUrls.length === 0) {
        throw new Error('No valid LinkedIn profile URLs found.');
    }

    log.info(`Enrichment started — processing ${cleanedUrls.length} profile(s)...`);

    const env = Actor.getEnv();
    const safeFileName = fileName.trim().endsWith('.xlsx') ? fileName.trim() : `${fileName.trim()}.xlsx`;
    const tagBaseName = safeFileName.replace(/\.xlsx$/, '');
    const filePath = path.join(os.tmpdir(), safeFileName);

    // ── STEP 1: Create Excel ──
    log.info('STEP 1: Creating Excel file...');
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(cleanedUrls.map(url => ({ "LinkedIn URL": url })));
    xlsx.utils.book_append_sheet(workbook, worksheet, "Profiles");
    xlsx.writeFile(workbook, filePath);
    log.info(`STEP 1: Excel file created at ${filePath}`);

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
        throw new Error('Missing Google OAuth credentials in environment variables.');
    }

    // ── STEP 2: Get OAuth Token ──
    log.info('STEP 2: Fetching Google OAuth token...');
    let tokenData;
    try {
        const res = await axios.post('https://oauth2.googleapis.com/token', null, {
            params: {
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: refreshToken,
                grant_type: 'refresh_token',
            },
        });
        tokenData = res.data;
        log.info('STEP 2: OAuth token received successfully');
    } catch (err) {
        throw new Error(`STEP 2 FAILED - OAuth token error: ${err.message} | Status: ${err?.response?.status} | Body: ${JSON.stringify(err?.response?.data)}`);
    }

    const accessToken = tokenData.access_token;
    const authHeader = { 'Authorization': `Bearer ${accessToken}` };

    // ── STEP 3: Upload to Drive ──
    log.info('STEP 3: Uploading file to Google Drive...');
    let uploadData;
    try {
        const form = new FormData();
        form.append('metadata', JSON.stringify({ name: safeFileName, parents: [DRIVE_FOLDER_ID] }), { contentType: 'application/json' });
        form.append('file', fs.createReadStream(filePath), {
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            filename: safeFileName,
        });

        const res = await axios.post(
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true',
            form,
            {
                headers: { ...form.getHeaders(), ...authHeader },
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
            },
        );
        uploadData = res.data;
        log.info(`STEP 3: File uploaded successfully. File ID: ${uploadData.id}`);
    } catch (err) {
        throw new Error(`STEP 3 FAILED - Drive upload error: ${err.message} | Status: ${err?.response?.status} | Body: ${JSON.stringify(err?.response?.data)}`);
    }

    const fileId = uploadData.id;

    // ── STEP 4: Set Permissions ──
    log.info('STEP 4: Setting file permissions...');
    try {
        await axios.post(
            `https://www.googleapis.com/drive/v3/files/${fileId}/permissions?supportsAllDrives=true`,
            { role: 'reader', type: 'anyone' },
            { headers: { ...authHeader, 'Content-Type': 'application/json' } },
        );
        log.info('STEP 4: Permissions set successfully');
    } catch (err) {
        throw new Error(`STEP 4 FAILED - Permissions error: ${err.message} | Status: ${err?.response?.status} | Body: ${JSON.stringify(err?.response?.data)}`);
    }

    // ── STEP 5: Get Drive Link ──
    log.info('STEP 5: Getting Drive link...');
    let fileData;
    try {
        const res = await axios.get(
            `https://www.googleapis.com/drive/v3/files/${fileId}?fields=webViewLink&supportsAllDrives=true`,
            { headers: authHeader },
        );
        fileData = res.data;
        log.info(`STEP 5: Drive link obtained: ${fileData.webViewLink}`);
    } catch (err) {
        throw new Error(`STEP 5 FAILED - Get link error: ${err.message} | Status: ${err?.response?.status} | Body: ${JSON.stringify(err?.response?.data)}`);
    }

    const driveLink = fileData.webViewLink;

    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    // ── STEP 6: Call Webhook ──
    log.info('STEP 6: Calling primary webhook...');
    const webhookPayload = {
        request_unique_id: env.actorRunId,
        time_of_request: new Date().toISOString(),
        service_name: "linkedin-profile-scraper",
        service_request_size: cleanedUrls.length,
        service_request_tag_name: tagBaseName,
        service_request_url: driveLink,
        source: "ap",
    };

    let pollRequestId = env.actorRunId;
    try {
        const { data: webhookResData } = await axios.post(WEBHOOK_URL, webhookPayload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 60_000,
        });
        log.info(`STEP 6: Webhook response: ${JSON.stringify(webhookResData)}`);
        if (webhookResData && webhookResData.request_id) {
            pollRequestId = webhookResData.request_id;
            log.info(`STEP 6: Poll request ID set to: ${pollRequestId}`);
        }
    } catch (err) {
        log.warning(`STEP 6 FAILED - Webhook error: ${err.message} | Status: ${err?.response?.status} | Body: ${JSON.stringify(err?.response?.data)}`);
    }

    // ── STEP 7: Poll for Results ──
    log.info(`STEP 7: Starting polling with request ID: ${pollRequestId}`);
    let finalDataset = [];
    let isCompleted = false;

    for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
        log.info(`STEP 7: Poll attempt ${i + 1}/${MAX_POLL_ATTEMPTS}...`);
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
        let pollData = null;
        try {
            const { data } = await axios.get(STATS_WEBHOOK_URL, {
                params: { request_unique_id: pollRequestId },
                headers: { 'Accept': 'application/json' },
                timeout: 30_000,
            });
            pollData = data;
            log.info(`STEP 7: Poll response: ${JSON.stringify(pollData)}`);
        } catch (err) {
            log.warning(`STEP 7: Poll attempt ${i + 1} failed: ${err.message}`);
            continue;
        }

        if (pollData) {
            const reqResult = pollData?.result?.request;
            const stats = pollData?.result?.child_stats;

            if (stats) {
                log.info(`Progress: Processed ${stats.processed || 0}/${stats.total || 0} (Success: ${stats.success || 0}, Failed: ${stats.failed || 0})`);
            }

            const isFullyProcessed = stats && stats.total > 0 && stats.processed === stats.total;
            const isMarkedCompleted = reqResult?.request_status === 'Completed' || reqResult?.request_status === 'Success' || pollData?.status === 'completed';

            if (isFullyProcessed || isMarkedCompleted) {
                if (stats && stats.total > 0 && stats.failed === stats.total) {
                    throw new Error(`Enrichment fully failed — all ${stats.total} profiles failed processing.`);
                }

                log.info(`Enrichment completed. Final Stats — Success: ${stats?.success || 0}, Failed: ${stats?.failed || 0}`);
                isCompleted = true;

                const csvUrl = reqResult?.output_csv_url;
                if (csvUrl) {
                    const fileIdMatch = csvUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
                    if (fileIdMatch) {
                        try {
                            const { data: downloadedData } = await axios.get(
                                `https://www.googleapis.com/drive/v3/files/${fileIdMatch[1]}?alt=media`,
                                { headers: authHeader, responseType: 'arraybuffer' }
                            );

                            try {
                                finalDataset = JSON.parse(downloadedData.toString('utf8'));
                            } catch {
                                const wb = xlsx.read(downloadedData, { type: 'buffer' });
                                finalDataset = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
                            }
                        } catch (err) {
                            log.error(`Failed to fetch final output from Drive: ${err.message}`);
                        }
                    }
                } else if (stats?.success > 0) {
                    log.warning('Enrichment completed but no output URL provided by webhook.');
                }
                break;
            } else if (reqResult?.request_status === 'Failed') {
                throw new Error('Enrichment failed according to stats webhook.');
            }
        }
    }

    if (finalDataset.length > 0) {
        await Actor.pushData(finalDataset);
    }

    const kvStore = await Actor.openKeyValueStore();
    await kvStore.setValue('RUN_RESULT', {
        status: 'success',
        file_name: safeFileName,
        drive_link: driveLink,
        urls_processed: cleanedUrls.length,
        timestamp: new Date().toISOString(),
    });

    // ── STEP 8: Save to Airtable ──
    try {
        log.info('STEP 8: Saving to Airtable...');

        const now = new Date();
        const timeOfRequest = now.toLocaleString('en-US', {
            year    : 'numeric',
            month   : 'long',
            day     : 'numeric',
            hour    : 'numeric',
            minute  : '2-digit',
            hour12  : true,
            timeZone: 'Asia/Kolkata'
        });

        const creditsCost = parseFloat((cleanedUrls.length * 0.01).toFixed(2));

        const atRes = await axios.post(
            'https://api.airtable.com/v0/appCuadMXrDqpfaDV/tblD3UXc3tYW0mOdT',
            {
                fields: {
                    user_unique_id              : env.userId        || 'unknown',
                    request_unique_id           : env.actorRunId    || 'unknown',
                    time_of_request             : timeOfRequest,
                    service_request_tag_name    : tagBaseName,
                    service_request_size        : cleanedUrls.length,
                    service_request_credits_cost: creditsCost,
                    service_request_url         : driveLink
                }
            },
            {
                headers: {
                    'Authorization': 'Bearer pat4bRijwFM7m1t9u.c5fa218d14d840e4180f628656b63c163ce71bd8d01881d971ee96fe2d939dd8',
                    'Content-Type' : 'application/json'
                }
            }
        );

        if (atRes.data && atRes.data.id) {
            log.info(`STEP 8: Airtable record saved! ID: ${atRes.data.id}`);
        } else {
            log.warning(`STEP 8: Airtable error: ${JSON.stringify(atRes.data)}`);
        }

    } catch (atError) {
        log.warning(`STEP 8 FAILED - Airtable error: ${atError.message} | Status: ${atError?.response?.status} | Body: ${JSON.stringify(atError?.response?.data)}`);
    }

} catch (error) {
    log.error(`FATAL ERROR at: ${error.message}`);

    const kvStore = await Actor.openKeyValueStore();
    await kvStore.setValue('ERROR', {
        message: error.message,
        timestamp: new Date().toISOString(),
    });

    throw error;
} finally {
    await Actor.exit();
}
