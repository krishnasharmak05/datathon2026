# AI Crime Intelligence Platform (Zoho Catalyst Native Edition)

An AI-powered Crime Analytics and Intelligence Platform for the Karnataka State Police. Built around an **Analytics First, LLM Second** philosophy, it provides deterministic query parsing, automated SQL/ZCQL generation, spatial hotspot analysis, offender relationship networking, and natural language explanations.

The platform is migrated entirely to a **100% Zoho Catalyst-native architecture**. All local infrastructure, SQLite database dependencies, local storage layers, offline ML/NLP mocks, and local file generators have been removed.

---

## 🏛️ System Architecture

The following diagram illustrates the Zoho Catalyst native execution flow:

```mermaid
graph TD
    User([User / Police Officer]) -->|1. Natural Language Query| Gateway[Catalyst API Gateway]
    Gateway -->|2. Route Request| API[Catalyst Function: crime_intel_api]
    
    subgraph "Catalyst Function (crime_intel_api)"
        Orchestrator[Conversation Orchestrator]
        ZiaTrans[Catalyst Zia Translation Service]
        Parser[Deterministic NL Parser]
        Planner[Execution Planner]
        Repo[Catalyst Repository Layer]
        ResponseBuilder[Response Builder]
        ZiaTTS[Catalyst Zia TTS Service]
    end

    Orchestrator -->|3. If Kannada: Translate to English| ZiaTrans
    Orchestrator -->|4. Parse Query (English)| Parser
    Orchestrator -->|5. Draft Step-by-Step Plan| Planner
    Planner -->|6. Execute Queries via ZCQL| Repo
    
    Repo -->|7. Data Retrieve/Aggregate| DataStore[(Catalyst Data Store)]
    
    Orchestrator -->|8. Explains Data (English)| ResponseBuilder
    ResponseBuilder -->|9. Summarize Data| CatalystLLM[Catalyst LLM REST API]
    
    Orchestrator -->|10. Translate Explanation to Kannada| ZiaTrans
    Orchestrator -->|11. Generate Audio Base64| ZiaTTS
    
    Orchestrator -->|12. Return JSON Payload| User
```

---

## 🛠️ Catalyst Services Adopted

1. **Catalyst Data Store & ZCQL**: Replaces SQLite. All database operations are run using Zoho Catalyst Query Language. Dynamic year-filter rewriting is handled transparently to translate SQLite `strftime` functions to standard ZCQL Date range filters.
2. **Catalyst Zia Translation**: Translates incoming Kannada queries into English before parsing, and translates English AI explanations back into Kannada.
3. **Catalyst Zia Speech Services**: Transcribes base64 Kannada/English voice queries and reads back explanations via Zia Text-to-Speech.
4. **Catalyst QuickML LLM Serving**: Leverages deployed generative models via secure REST endpoints to explain SQL outputs conversantly.
5. **Catalyst SmartBrowz**: Headerless browser service used to compile investigation summaries into printable PDFs.
6. **Catalyst Cache**: Stores segments of frequently accessed statistics and lookup tables to accelerate request speed.
7. **Catalyst Authentication**: Secures APIs and maintains police officer login sessions.
8. **Catalyst Mail & Push Notifications**: Sends urgent alerts, reports, and push notifications to patrolling officers.
9. **Catalyst Pipelines**: Orchestrates CI/CD builds and deployments for both the backend function and React web client.

---

## ⚙️ Environment Variables Config

Set these variables in the Catalyst console environment for the `crime_intel_api` function:

```env
# General Catalyst Configuration
CATALYST_PROJECT_ID=datathon2026
CATALYST_API_DOMAIN=https://api.catalyst.zoho.com

# LLMREST Configuration
CATALYST_LLM_ENDPOINT=https://quickml.zoho.com/api/v1/llm
CATALYST_LLM_API_KEY=your_quickml_llm_api_key_here

# Zia / QuickML Credentials
CATALYST_ZIA_API_KEY=your_zia_api_key_here
CATALYST_QUICKML_API_KEY=your_quickml_api_key_here

# Notification Sender
CATALYST_SENDER_EMAIL=alerts@karnatakapolice.gov.in
```

---

## 🚀 Getting Started (Onboarding & Development)

### Prerequisites
- Install [Node.js](https://nodejs.org/) (v20+ recommended).
- Install the [Catalyst CLI](https://lib.catalyst.zoho.com/cli):
  ```powershell
  npm install -g zcatalyst-cli
  ```
- Log in to your Zoho account:
  ```powershell
  catalyst login --force
  ```

### 1. Install Workspace Dependencies
Installs dependencies for root, client, and the Catalyst function:
```powershell
npm run install:all
```

### 2. Database Seeding
To populate the Zoho Catalyst Data Store with the ERD-compliant mock data (1,000 cases, accused, victims, and officers):
```powershell
npm run db:setup
```

### 3. Run Development Server
Launches concurrently the React web client and Node API server:
```powershell
npm run dev
```

### 4. Running Regression Tests
Verifies parser accuracy, planning correctness, dynamic ZCQL template compliance, and tests ZCQL syntax execution directly on the Catalyst Data Store:
```powershell
npm run test:regression
```

---

## 📦 Deployment

Deploy both the backend function and the React client directly to Zoho Cloud using the CLI:
```powershell
catalyst deploy
```
Continuous integration and deployments are configured automatically via Catalyst Pipelines using [catalyst-pipelines.yaml](file:///c:/Users/krish/Desktop/hackathon/datathon2026/catalyst-pipelines.yaml).