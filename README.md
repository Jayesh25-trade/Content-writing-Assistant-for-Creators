# ✨ Content-Writing Assistant for Creators

An **AI-powered content assistant** that helps creators, marketers, and businesses generate **captions, blog outlines, article drafts, scripts, SEO snippets, and polished content** tailored for **social media, newsletters, and video platforms**.

---

##  Features

 **Multi-Platform Captions**  
  Generate platform-ready captions for **Instagram, LinkedIn, Twitter/X, TikTok, YouTube**, and more.

- **Blog & Article Outlines**  
  AI suggests titles, subheadings, and word count recommendations for structured writing.

- **Full Drafts**  
  Create short posts, medium-length newsletters, or long-form blogs in minutes.

- **Polish & Rewrite**  
  Adapt tone, improve clarity, shorten, or make content more professional/friendly.

- **SEO Optimization**  
  Get optimized headlines and **meta descriptions** under 160 characters.

- **#️ Hashtag Suggestions**  
  Auto-generate relevant hashtags to maximize reach.

- **Safety Controls**  
  - Flags unverifiable claims (`needs_verification`)  
  - Refuses medical, legal, or financial advice with a clear reason (`refusal_reason`)  
  - Cites URLs if user provides a link (`citation_urls`)

- **Consistent JSON Schema**  
  Every response follows a **strict JSON format** for easy parsing in your frontend or automation tools.

---

##  Example Use Cases

- Social media managers scheduling **multi-platform posts**  
- Bloggers drafting **structured outlines** and SEO-ready content  
- YouTubers/TikTok creators writing **short video scripts**  
- Businesses polishing **LinkedIn articles or newsletters**  
- Marketing teams ensuring **safe, fact-checked AI outputs**

---

## Tech Stack

- **Frontend:**  
  - HTML + TailwindCSS  

- **Backend:**  
  - Node.js with **Express** OR **Serverless functions** (Netlify/Vercel/Render)  

- **AI Integration:**  
  - OpenAI GPT models (`gpt-4o-mini` or latest)  
  - Outputs parsed and validated JSON  

---

## 📐 JSON Response Schema

All AI-generated outputs strictly follow this schema:

```json
{
  "meta": {
    "task": "string",
    "platform": "string",
    "tone": "string",
    "length": "string",
    "variations_requested": "integer",
    "generated_at": "string (ISO 8601 UTC)"
  },
  "summary": "string (<=2 sentences; if URL present, summarize page)",
  "variations": [
    {
      "id": "string (v1, v2, ...)",
      "title": "string (short label)",
      "text": "string (the generated content)",
      "character_count": "integer",
      "recommended_hashtags": ["string"],
      "cta": "string",
      "notes_for_designer": "string"
    }
  ],
  "seo": {
    "suggested_headline": "string",
    "meta_description": "string (<=160 chars)"
  },
  "safety": {
    "refusal": "boolean",
    "refusal_reason": "string",
    "needs_verification": "boolean",
    "citation_urls": ["string"]
  }
}


##Project Structure 

├── frontend/               # HTML + Tailwind frontend
│   ├── index.html          # Main UI
│   ├── styles.css          # Optional custom styles
│   └── script.js           # Handles API calls & rendering
│
├── netlify/functions/      # Serverless backend
│   └── generate.js         # Forwards requests to OpenAI API
│
├── netlify.toml            # Netlify config
└── README.md               # Project documentation
