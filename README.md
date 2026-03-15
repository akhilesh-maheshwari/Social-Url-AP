# LinkedIn Profile Scraper
A powerful Apify Actor that enriches LinkedIn profiles with comprehensive data extraction, email discovery, and mobile number lookup capabilities.

## Overview
The LinkedIn Profile Scraper is an enterprise-grade Apify Actor designed to extract comprehensive information from LinkedIn profiles. It automatically enriches profile data with contact information, work history, education, skills, and more, making it an essential tool for lead generation, recruitment, market research, and sales outreach.

Key Highlights:
- No LinkedIn Cookies Required – Operates without authentication cookies
- Bulk Processing – Process multiple profiles concurrently
- Smart Email Discovery – Automatically attempts to find email addresses
- Mobile Number Lookup – Exclusive mobile number enrichment for paying users
- Structured Output – Returns normalized, consistent data format

## Features
### Comprehensive Profile Data
Extracts complete profile information including:
- Personal Information: Full name, headline, summary, profile pictures, location
- Work Experience: Current and past positions, companies, job descriptions, durations
- Education: Universities, degrees, fields of study, graduation dates
- Skills & Endorsements: Skills and endorsement counts
- Additional Data: Languages, certifications, publications, patents, volunteer work, recommendations

### Company Intelligence
Automatically gathers company information from job history:
- Company name, industry, website, LinkedIn URL
- Company size (headcount range)
- Founded year and company identifiers

### Contact Enrichment
- Email Discovery: Automatically attempts to find email addresses of the person
- Mobile Number Lookup: For paying users, attempts to find mobile phone numbers

### Performance & Reliability
- Concurrent Processing: Processes multiple profiles in parallel
- Error Handling: Graceful error handling with detailed logging
- URL Validation: Automatic validation and normalization of LinkedIn URLs

## Quick Start
1. Get Started: Create an Apify account if you don't have one
2. Prepare URLs: Collect the LinkedIn profile URLs you want to enrich
3. Run the Actor: Use the Apify Console UI to run the actor with your profile URLs and a file name
4. Download Results: Access your results via the generated Google Drive link

## Usage
### Prerequisites
- An Apify account
- LinkedIn profile URLs you want to enrich

### Input Format
The actor accepts a JSON input with an array of LinkedIn profile URLs and a target file name:
```json
{
  "fileName": "MyLeads",
  "linkedinUrls": [
    "https://www.linkedin.com/in/williamhgates",
    "https://www.linkedin.com/in/jeannie-wyrick-b4760710a"
  ]
}
```

### Running the Actor
#### Option 1: Apify Console (Recommended)
1. Navigate to the actor on Apify Console
2. Enter your LinkedIn profile URLs and the desired file name
3. Click Start to begin the enrichment process

#### Option 2: API
```bash
curl -X POST \
  'https://api.apify.com/v2/acts/linkedin-profile-scraper/runs?token=YOUR_API_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "fileName": "leads_export",
    "linkedinUrls": [
      "https://www.linkedin.com/in/williamhgates"
    ]
  }'
```

## Pricing
The actor is priced at $15 per 1,000 successful requests ($0.015 per profile).

## Output
The actor generates an Excel file containing the requested profiles and uploads it to Google Drive. Once processed, you will receive a secure link to download your enriched data.

The enriched data includes:
- Main Profile Data: Full Name, Headline, Email, Mobile Number, Connections, Followers
- Work Experience: Job Title, Company, Industry, Website, Staff Count, Durations, Descriptions
- Additional Fields: Education, Skills, Languages, Certifications, etc.

## Support
For issues, questions, or feature requests:
- Email: friends@theboomerang.co
- Apify Actor: LinkedIn Profile Scraper

Made with ❤️ for the LinkedIn data enrichment community
