# API Key Reminder

This project utilizes OpenAI and Anthropic AI services. To ensure full functionality, please configure the following API keys:

## OpenAI API Key

- **Environment Variable:** `OPENAI_API_KEY`
- **Used in:**
    - `apps/api` (Python backend)
    - `apps/web` (Next.js frontend)
- **To obtain an API key:** Visit [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)

## Anthropic API Key

- **Environment Variable:** `ANTHROPIC_API_KEY`
- **Used in:**
    - `apps/api` (Python backend)
    - `apps/web` (Next.js frontend)
- **To obtain an API key:** Visit [https://console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)

**Important:**

*   Ensure these environment variables are set in your development and deployment environments.
*   Refer to the `.env.example` file for a template of environment variable configuration.
*   The Python backend (`apps/api`) uses specific versions: `openai==1.3.7` and `anthropic==0.8.1`.
*   The Next.js frontend (`apps/web`) uses specific versions: `openai^5.0.1` and `@anthropic-ai/sdk^0.52.0`. While generally compatible, be mindful of potential version-specific features or breaking changes if you modify the AI service integrations.
