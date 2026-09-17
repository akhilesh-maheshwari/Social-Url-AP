# LinkedIn Profile Scraper

Extract complete LinkedIn profile-level data from profile URLs including work experience, education, skills, recommendations, languages, and additional metadata. Designed for deep enrichment, recruiting intelligence, research, and advanced outreach workflows.

No login cookies required.

---

## Data Fields Included

| Field | Description |
|-------|-------------|
| `publicIdentifier` | Public LinkedIn profile username (profile slug) |
| `linkedInIdentifier` | Internal LinkedIn profile identifier |
| `memberIdentifier` | Unique LinkedIn member ID |
| `linkedInUrl` | Direct LinkedIn profile URL |
| `firstName` | Member first name |
| `lastName` | Member last name |
| `headline` | Profile headline |
| `summary` | About section description |
| `location` | Profile location |
| `followerCount` | Total number of followers |
| `premium` | Indicates if the member has LinkedIn Premium |
| `is_open_profile` | Can receive messages without connection |
| `is_creator` | Creator mode enabled status |
| `is_influencer` | Influencer badge status |
| `is_self` | Indicates whether profile belongs to logged-in user |
| `is_relationship` | Relationship indicator between viewer and member |
| `websites` | Websites listed on the profile |
| `connections_count` | Total number of connections |
| `birthdate` | Birthdate (if available) |
| `positions` | Full work experience history including company, title, duration, and description |
| `schools` | Education history including institutes, degrees, and fields of study |
| `skills` | Skills listed on the profile with endorsements where available |
| `languages` | Languages listed on the profile |
| `recommendations` | Recommendations received or given on the profile |
| `volunteering_experience` | Volunteer work and associated organizations |
| `photoUrl` | Profile image URL |
| `backgroundUrl` | Cover image URL |
| `request_type` | Type of extraction request processed |

---

## Sample Output

```json
{
  "publicIdentifier": "salman-ha***d-638****198",
  "linkedInIdentifier": "ACoAAC5u7Aw*****z1lWSxgaqWCG1uV3cRARQ",
  "memberIdentifier": "779021324",
  "linkedInUrl": "https://www.linkedin.com/in/salman-h****d-638****98",
  "firstName": "Salman",
  "lastName": "H****d",
  "headline": "Founder/CEO of Kainaat Studios, and Professor of Integrated Science & Humanities, Hampshire College, Massachusetts",
  "location": "Amherst, Massachusetts, United States",
  "followerCount": "1606",
  "premium": "FALSE",
  "is_open_profile": "FALSE",
  "is_creator": "FALSE",
  "is_influencer": "FALSE",
  "is_self": "FALSE",
  "is_relationship": "FALSE",
  "connections_count": "1440",
  "positions": {
    "positionsCount": 3,
    "positionHistory": [
      {
        "start": "7/1/2005",
        "end": null,
        "company": "Hampshire College",
        "position": "Charles Taylor Chair and Professor of Integrated Science & Humanities",
        "status": "Full-time"
      }
    ]
  },
  "schools": {
    "educationsCount": 2,
    "educationHistory": [
      {
        "start": "1/1/1994",
        "end": "1/1/2001",
        "school": "New Mexico State University",
        "degree": "Doctor of Philosophy - PhD, Astronomy"
      }
    ]
  },
  "skills": { "Skills": [] },
  "languages": { "Languages": [] },
  "request_type": "Social Enrichment"
}
```

---

## Pricing

**$5.00 per 1,000 profiles — just $0.005 per profile**

One flat rate. Full profile enrichment included by default with no add-on tiers.

> On the free Apify plan, the platform caps at 50 leads one time.

---

## How We Compare

We ran both actors against the **same set of profile URLs** to give you a direct, apples-to-apples benchmark. Here are the results:

| Metric | Our Actor ($5/1000) | Harvest API ($2/1000) |
|--------|---------------------|-----------------------|
| Time Taken | 2 min 41 sec | 5 sec |
| Amount Charged | $2.140 | $0.002 |
| Total Results | 214 | 1 |
| Output | [View our output](https://docs.google.com/spreadsheets/d/1e1bmQLsgCW_47-VjZyNUh_za-o6F9ibORrxh4t440AE/edit?usp=sharing) | [View Harvest output](https://docs.google.com/spreadsheets/d/1e1bmQLsgCW_47-VjZyNUh_za-o6F9ibORrxh4t440AE/edit?usp=sharing) |

**Our actor returned 214 complete, enriched profiles. Harvest API returned 1.**

Full side-by-side data: [View the comparison spreadsheet](https://docs.google.com/spreadsheets/d/1e1bmQLsgCW_47-VjZyNUh_za-o6F9ibORrxh4t440AE/edit?usp=sharing)

![Same Profile URL Inputs Comparison](https://drive.google.com/uc?export=view&id=1gT__47OJor1HLerwNRySfeR_8aQpUWDG)

---

## Estimated Delivery Time

| Volume | Delivery Time |
|--------|--------------|
| 1k to 50k profiles | Within 3 hours |
| 50k to 100k profiles | 3 to 6 hours |
| 100k to 500k profiles | Within 12 hours |

---

## How to Use

1. [Create a free Apify account](https://apify.com)
2. Provide LinkedIn profile URLs as input
3. Run the actor
4. Download structured JSON, CSV, or Excel output

---

## Disclaimer

This actor is intended for legitimate business use cases such as market research, lead generation, and outreach. Use it in compliance with LinkedIn's Terms of Service and applicable data privacy regulations (GDPR, CCPA, etc.). The actor does not require or store any LinkedIn credentials.
