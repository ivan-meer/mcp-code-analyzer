import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export class AIManager {
  private openai: OpenAI;
  private anthropic: Anthropic;
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
  }
  
  async explainCode(code: string, language: string): Promise<string> {
    // TODO: Implement actual logic using OpenAI or Anthropic
    // This is a placeholder implementation
    console.log(`Explaining code in ${language}: ${code.substring(0, 50)}...`);
    if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
      return "Error: API keys not configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY in .env.local.";
    }
    if (this.openai.apiKey) {
      try {
        const response = await this.openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a helpful assistant that explains code." },
            { role: "user", content: `Explain the following ${language} code:

${code}` }
          ],
        });
        return response.choices[0]?.message?.content?.trim() || "Could not get explanation from OpenAI.";
      } catch (error) {
        console.error("Error explaining code with OpenAI:", error);
        return "Error explaining code with OpenAI.";
      }
    } else if (this.anthropic.apiKey) {
      // Placeholder for Anthropic implementation
      return "Anthropic client is configured, but explanation logic is not implemented yet.";
    }
    return "No AI client configured to explain code.";
  }
  
  async suggestImprovements(code: string, language: string): Promise<string[]> {
    // TODO: Implement actual logic using OpenAI or Anthropic
    // This is a placeholder implementation
    console.log(`Suggesting improvements for code: ${code.substring(0, 50)}...`);
     if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
      return ["Error: API keys not configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY in .env.local."];
    }
    if (this.openai.apiKey) {
      try {
        const response = await this.openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a helpful assistant that suggests code improvements." },
            { role: "user", content: `Suggest improvements for the following ${language} code:

${code}` }
          ],
        });
        const suggestions = response.choices[0]?.message?.content?.trim().split('
').filter(s => s.length > 0);
        return suggestions || ["Could not get suggestions from OpenAI."];
      } catch (error) {
        console.error("Error suggesting improvements with OpenAI:", error);
        return ["Error suggesting improvements with OpenAI."];
      }
    } else if (this.anthropic.apiKey) {
      // Placeholder for Anthropic implementation
      return ["Anthropic client is configured, but suggestion logic is not implemented yet."];
    }
    return ["No AI client configured to suggest improvements."];
  }
}
