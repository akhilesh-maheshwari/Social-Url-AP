# 🧠 LinkedIn Profile Complete Export

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
  "publicIdentifier": "john-doe",
  "linkedInIdentifier": "ACoAAAB1234",
  "memberIdentifier": "123456789",
  "linkedInUrl": "https://www.linkedin.com/in/john-doe/",
  "firstName": "John",
  "lastName": "Doe",
  "headline": "Senior Product Manager",
  "summary": "Experienced product leader with strong background in SaaS",
  "location": "London, United Kingdom",
  "followerCount": 3200,
  "connections_count": 1500,
  "skills": ["Product Strategy","SaaS","Growth"],
  "languages": ["English"],
  "positions": [
    {
      "company": "TechCorp",
      "title": "Senior Product Manager"
    }
  ]
}
```

---

## 💰 Pricing

LinkedIn Profile Complete Export is available on a pay-per-result basis:

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
