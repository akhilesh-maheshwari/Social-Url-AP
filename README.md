# 🧠 LinkedIn profile scraper

Extract complete LinkedIn profile-level data from profile URLs including work experience, education, skills, recommendations, languages, and additional metadata. Designed for deep enrichment, recruiting intelligence, research, and advanced outreach workflows.

No login cookies required.

---

## 📌 Data Fields Included

| Field                   | Description                                                                      |
| ----------------------- | -------------------------------------------------------------------------------- |
| publicIdentifier        | Public LinkedIn profile username (profile slug)                                  |
| linkedInIdentifier      | Internal LinkedIn profile identifier                                             |
| memberIdentifier        | Unique LinkedIn member ID                                                        |
| linkedInUrl             | Direct LinkedIn profile URL                                                      |
| firstName               | Member first name                                                                |
| lastName                | Member last name                                                                 |
| headline                | Profile headline                                                                 |
| summary                 | About section description                                                        |
| location                | Profile location                                                                 |
| followerCount           | Total number of followers                                                        |
| premium                 | Indicates if the member has LinkedIn Premium                                     |
| is_open_profile         | Can receive messages without connection                                          |
| is_creator              | Creator mode enabled status                                                      |
| is_influencer           | Influencer badge status                                                          |
| is_self                 | Indicates whether profile belongs to logged-in user                              |
| is_relationship         | Relationship indicator between viewer and member                                 |
| websites                | Websites listed on the profile                                                   |
| connections_count       | Total number of connections                                                      |
| birthdate               | Birthdate (if available)                                                         |
| positions               | Full work experience history including company, title, duration, and description |
| schools                 | Education history including institutes, degrees, and fields of study             |
| skills                  | Skills listed on the profile with endorsements where available                   |
| languages               | Languages listed on the profile                                                  |
| recommendations         | Recommendations received or given on the profile                                 |
| volunteering_experience | Volunteer work and associated organizations                                      |
| photoUrl                | Profile image URL                                                                |
| backgroundUrl           | Cover image URL                                                                  |
| request_type            | Type of extraction request processed                                             |

---

## 📊 Sample Output

```json
{
    "publicIdentifier": "salman-ha***d-638a86198",
    "linkedInIdentifier": "ACoAAC5u7Aw*****z1lWSxgaqWCG1uV3cRARQ",
    "memberIdentifier": "779021324",
    "linkedInUrl": "https://www.linkedin.com/in/salman-h****d-638a86198",
    "firstName": "Salman",
    "lastName": "H****d",
    "headline": "Founder/CEO of Kainaat Studios, and Professor of Integrated Science & Humanities, Hampshire College, Massachusetts",
    "summary": "Salman Hameed is the founder and CEO of the non-profit Kainaat Studios, that creates topical astronomy videos in Urdu for audiences in Pakistan (and broader South Asia). He is also Charles Taylor Chair and Professor of Integrated Science & Humanities at Hampshire College, Amherst, Massachusetts. He holds a Ph.D. in astronomy and is a member of the Five College Astronomy Department (FCAD), but his research is inter-disciplinary and it focuses on analyzing how science interacts with society. Science communication is still his primary focus: Salman has a YouTube Channel (Kainaat Astronomy) for Urdu videos and a weekly astronomy segment in English for a radio station (WRSI FM93.9) in Western Massachusetts. His writings have appeared in Dawn Magazine, Express Tribune, Science Magazine, NPR, and the Guardian.",
    "location": "Amherst, Massachusetts, United States",
    "followerCount": "1606",
    "premium": "FALSE",
    "is_open_profile": "FALSE",
    "is_creator": "FALSE",
    "is_influencer": "FALSE",
    "is_self": "FALSE",
    "is_relationship": "FALSE",
    "websites": "[\"https://www.kainaatstudios.com/salman-hameed\",\"https://www.youtube.com/KainaatAstronomyInUrdu\"]",
    "connections_count": "1440",
    "birthdate": "",
    "positions": "{\"positionsCount\": 3, \"positionHistory\": [{\"end\": null, \"start\": \"7/1/2005\", \"skills\": [], \"status\": \"Full-time\", \"company\": \"Hampshire College\", \"position\": \"Charles Taylor Chair and Professor of Integrated Science & Humanities\", \"company_id\": \"21340\", \"company_picture_url\": \"https://media.licdn.com/dms/image/v2/C4D0BAQFbLrZ0GjCa8Q/company-logo_200_200/company-logo_200_200/0/1631313355679?e=1780531200&v=beta&t=z9qIhdDdYfAogF7-bA7zMXfFhGy24nQu_O9O-ND37X4\", \"company_linkedin_url\": \"http://www.linkedin.com/school/hampshire-college\"}, {\"end\": null, \"start\": \"1/1/2019\", \"skills\": [], \"status\": \"Self-employed\", \"company\": \"Kainaat Studios\", \"location\": \"United States\", \"position\": \"President and CEO\", \"company_id\": \"72754179\", \"company_picture_url\": \"https://media.licdn.com/dms/image/v2/D4D0BAQHQwjPpkMadAw/company-logo_200_200/B4DZpBB8w3IkAI-/0/1762027622118/kainaat_logo?e=1780531200&v=beta&t=9V602KmM-PaCVwY7qvFjaKHCotbZdOGklky5LvFwVDw\", \"company_linkedin_url\": \"http://www.linkedin.com/company/kainaat\"}, {\"end\": null, \"start\": \"4/1/2019\", \"skills\": [], \"status\": \"Self-employed\", \"company\": \"Amherst Cinema Arts Center\", \"location\": \"United States\", \"position\": \"Board Of Directors\", \"company_id\": \"4026193\", \"company_picture_url\": \"https://media.licdn.com/dms/image/v2/C4D0BAQG4RE69Qa-Bfg/company-logo_200_200/company-logo_200_200/0/1630527737296/amherst_cinema_logo?e=1780531200&v=beta&t=ZkF_1z-pJJOjsIgXiCMZ1kYP1JnN0d3Bva4mnro9Dgc\", \"company_linkedin_url\": \"http://www.linkedin.com/company/amherst-cinema\"}]}",
    "schools": "{\"educationsCount\": 2, \"educationHistory\": [{\"end\": \"1/1/2001\", \"start\": \"1/1/1994\", \"degree\": \"Doctor of Philosophy - PhD, Astronomy\", \"school\": \"New Mexico State University\", \"school_id\": \"10188\", \"school_picture_url\": \"https://media.licdn.com/dms/image/v2/C4E0BAQGrCLDBTVSazw/company-logo_200_200/company-logo_200_200/0/1630620059876/new_mexico_state_university_logo?e=1780531200&v=beta&t=P6t0oSQxMHxI87C1eQ_Ib9YMtDA8ZPUo26mc5H6CuoQ\"}, {\"end\": \"1/1/1993\", \"start\": \"1/1/1989\", \"degree\": \"Bachelor of Science - BS, Physics and Astronomy\", \"school\": \"Stony Brook University\", \"school_id\": \"7201\", \"school_picture_url\": \"https://media.licdn.com/dms/image/v2/C4E0BAQHOeNb0KmKXYQ/company-logo_200_200/company-logo_200_200/0/1630647027307/stony_brook_university_logo?e=1780531200&v=beta&t=bCxt2h0qrNyv-2Chn2BCsGoYu8uHMYiOupRm4D4QvkQ\"}]}",
    "skills": "{\"Skills\": []}",
    "languages": "{\"Languages\": []}",
    "recommendations": "",
    "volunteering_experience": "{\"recommendationsCount\": 0, \"recommendationHistory\": []}",
    "photoUrl": "https://media.licdn.com/dms/image/v2/C4D03AQEmEDnuXjO3Rw/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1574796321477?e=1780531200&v=beta&t=QcVjTqICS9u-JKEQMmQWzf5Rjqoad-F_1u5zPHFi8PY",
    "backgroundUrl": "",
    "request_type": "Social Enrichment"
  }
```

---

## 💰 Pricing

LinkedIn Profile Complete Export is available on a pay-per-result basis:

**On the free Apify plan, the platform caps at 50 leads one time**

**$5.00 per 1,000 profiles → just $0.005 per profile**

---

## 📦 Estimated Delivery Time

| Volume               | Delivery Time   |
| -------------------- | --------------- |
| 1k – 50k profiles    | within 3 hours  |
| 50k – 100k profiles  | 3 – 6 hours     |
| 100k – 500k profiles | within 12 hours |

---

## 🗂️ How to Use

1. Create a free Apify account
2. Provide LinkedIn profile URLs as input
3. Run the actor
4. Download structured JSON, CSV, or Excel output
