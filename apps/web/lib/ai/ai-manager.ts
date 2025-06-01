import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { CODE_EXPLAIN_SYSTEM_PROMPT } from './prompts/code-explain';
import { CODE_IMPROVE_SYSTEM_PROMPT } from './prompts/code-improve';
import { CODE_PATTERNS_SYSTEM_PROMPT } from './prompts/code-patterns';

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
            { role: "system", content: CODE_EXPLAIN_SYSTEM_PROMPT },
            { role: "user", content: `Explain the following ${language} code:

${code}` }
          ],
        });
        return response.choices[0]?.message?.content?.trim() || "Could not get explanation from OpenAI.";
      } catch (error) {
        console.error("Error explaining code with OpenAI:", error);
        // Fallback to Anthropic if OpenAI fails and Anthropic key is present
        if (this.anthropic.apiKey) {
          console.log("OpenAI failed, trying Anthropic for explanation...");
          return this.explainWithAnthropic(code, language);
        }
        return "Error explaining code with OpenAI.";
      }
    } else if (this.anthropic.apiKey) {
      return this.explainWithAnthropic(code, language);
    }
    return "No AI client configured to explain code. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY.";
  }

  private async explainWithAnthropic(code: string, language: string): Promise<string> {
    try {
      const response = await this.anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 1024,
        system: CODE_EXPLAIN_SYSTEM_PROMPT,
        messages: [
          { role: "user", content: `Explain the following ${language} code:

${code}` }
        ]
      });
      return response.content[0]?.type === 'text' ? response.content[0].text.trim() : "Could not get explanation from Anthropic.";
    } catch (error) {
      console.error("Error explaining code with Anthropic:", error);
      return "Error explaining code with Anthropic.";
    }
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
            { role: "system", content: CODE_IMPROVE_SYSTEM_PROMPT },
            { role: "user", content: `Suggest improvements for the following ${language} code:

${code}` }
          ],
        });
        const suggestionsText = response.choices[0]?.message?.content?.trim();
        return suggestionsText ? suggestionsText.split('\n').filter(s => s.length > 0) : ["Could not get suggestions from OpenAI."];
      } catch (error) {
        console.error("Error suggesting improvements with OpenAI:", error);
        // Fallback to Anthropic if OpenAI fails and Anthropic key is present
        if (this.anthropic.apiKey) {
          console.log("OpenAI failed, trying Anthropic for suggestions...");
          return this.suggestImprovementsWithAnthropic(code, language);
        }
        return ["Error suggesting improvements with OpenAI."];
      }
    } else if (this.anthropic.apiKey) {
      return this.suggestImprovementsWithAnthropic(code, language);
    }
    return ["No AI client configured to suggest improvements. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY."];
  }

  private async suggestImprovementsWithAnthropic(code: string, language: string): Promise<string[]> {
    try {
      const response = await this.anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 1024,
        system: CODE_IMPROVE_SYSTEM_PROMPT,
        messages: [
          { role: "user", content: `Suggest improvements for the following ${language} code:

${code}` }
        ]
      });
      const suggestionsText = response.content[0]?.type === 'text' ? response.content[0].text.trim() : "";
      return suggestionsText ? suggestionsText.split('\n').filter(s => s.length > 0) : ["Could not get suggestions from Anthropic."];
    } catch (error) {
      console.error("Error suggesting improvements with Anthropic:", error);
      return ["Error suggesting improvements with Anthropic."];
    }
  }

  async detectCodePatterns(code: string, language: string): Promise<string> {
    if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
      return "Error: API keys not configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY in .env.local.";
    }

    if (this.openai.apiKey) {
      try {
        const response = await this.openai.chat.completions.create({
          model: "gpt-3.5-turbo", // Or a model you prefer for this task
          messages: [
            { role: "system", content: CODE_PATTERNS_SYSTEM_PROMPT },
            { role: "user", content: `Analyze the following ${language} code for design patterns:

${code}` }
          ],
        });
        return response.choices[0]?.message?.content?.trim() || "Could not detect patterns from OpenAI.";
      } catch (error) {
        console.error("Error detecting patterns with OpenAI:", error);
        // Fallback to Anthropic if OpenAI fails and Anthropic key is present
        if (this.anthropic.apiKey) {
          console.log("OpenAI failed, trying Anthropic for pattern detection...");
          return this.detectCodePatternsWithAnthropic(code, language);
        }
        return "Error detecting patterns with OpenAI.";
      }
    } else if (this.anthropic.apiKey) {
      return this.detectCodePatternsWithAnthropic(code, language);
    }
    return "No AI client configured to detect patterns. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY.";
  }

  private async detectCodePatternsWithAnthropic(code: string, language: string): Promise<string> {
    try {
      const response = await this.anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 1024, // Adjust as needed
        system: CODE_PATTERNS_SYSTEM_PROMPT,
        messages: [
          { role: "user", content: `Analyze the following ${language} code for design patterns:

${code}` }
        ]
      });
      return response.content[0]?.type === 'text' ? response.content[0].text.trim() : "Could not detect patterns from Anthropic.";
    } catch (error) {
      console.error("Error detecting patterns with Anthropic:", error);
      return "Error detecting patterns with Anthropic.";
    }
  }
}
