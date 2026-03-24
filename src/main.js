import { Actor } from 'apify';

await Actor.init();

const input = await Actor.getInput();

const fileName = input.fileName;
const profileUrls = input.profileUrls;

const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbyHsvED6vYA0SQf_HgsQ09o4Kn88YwOKai7BFIJ9Ioa_Bsiavlw8Xq0u8J_xf1XFKQAyw/exec";

try {

    const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            fileName: fileName,
            urls: profileUrls
        })
    });

    const result = await response.json();

    console.log("Google Sheet Response:", result);

} catch (error) {

    console.log("Error sending data:", error);

}

await Actor.exit();
