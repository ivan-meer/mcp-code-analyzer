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
  

  /**
   * Объясняет код с использованием OpenAI или Anthropic.
   * @param code Код для объяснения.
   * @param language Язык программирования.
   * @returns Объяснение кода.
   */
  async explainCode(code: string, language: string): Promise<string> {
    console.log(`\x1b[36mExplaining code in ${language}: ${code.substring(0, 50)}...\x1b[0m`);
    if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
      console.error(`\x1b[31mAPI keys not configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY in .env.local.\x1b[0m`);
main
      return "Error: API keys not configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY in .env.local.";
    }
    if (this.openai.apiKey) {
      try {
        const response = await this.openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [

            { role: "system", content: CODE_EXPLAIN_SYSTEM_PROMPT },
 main
            { role: "user", content: `Explain the following ${language} code:

${code}` }
          ],
        });

        const explanation = response.choices[0]?.message?.content?.trim() || "Could not get explanation from OpenAI.";
        if (response.usage) {
          console.log(`\x1b[32mTokens used: ${response.usage.total_tokens}\x1b[0m`);
        }
        return explanation;
      } catch (error) {
        console.error(`\x1b[31mError explaining code with OpenAI:\x1b[0m`, error);
        // Fallback to Anthropic if OpenAI fails and Anthropic key is present
        if (this.anthropic.apiKey) {
          console.log(`\x1b[33mOpenAI failed, trying Anthropic for explanation...\x1b[0m`);
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
    console.error(`\x1b[31mError explaining code with Anthropic:\x1b[0m`, error);
      return "Error explaining code with Anthropic.";
    }
  }
  
  /**
   * Предлагает улучшения для кода с использованием OpenAI или Anthropic.
   * @param code Код для улучшения.
   * @param language Язык программирования.
   * @returns Массив предложений по улучшению кода.
   */
  async suggestImprovements(code: string, language: string): Promise<string[]> {
    console.log(`\x1b[36mSuggesting improvements for code: ${code.substring(0, 50)}...\x1b[0m`);
    if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
      console.error(`\x1b[31mAPI keys not configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY in .env.local.\x1b[0m`);
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
        if (response.usage) {
          console.log(`\x1b[32mTokens used: ${response.usage.total_tokens}\x1b[0m`);
        }
        return suggestionsText ? suggestionsText.split('\n').filter(s => s.length > 0) : ["Could not get suggestions from OpenAI."];
      } catch (error) {
        console.error(`\x1b[31mError suggesting improvements with OpenAI:\x1b[0m`, error);
        // Fallback to Anthropic if OpenAI fails and Anthropic key is present
        if (this.anthropic.apiKey) {
          console.log(`\x1b[33mOpenAI failed, trying Anthropic for suggestions...\x1b[0m`);
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
    console.error(`\x1b[31mError suggesting improvements with Anthropic:\x1b[0m`, error);
      return ["Error suggesting improvements with Anthropic."];
    }
  }

  /**
   * Обнаруживает паттерны в коде с использованием OpenAI или Anthropic.
   * @param code Код для анализа.
   * @param language Язык программирования.
   * @returns Описание обнаруженных паттернов.
   */
  async detectCodePatterns(code: string, language: string): Promise<string> {
    console.log(`\x1b[36mDetecting code patterns in ${language}: ${code.substring(0, 50)}...\x1b[0m`);
    if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
      console.error(`\x1b[31mAPI keys not configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY in .env.local.\x1b[0m`);
      return "Error: API keys not configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY in .env.local.";
    }

    if (this.openai.apiKey) {
      try {
        const response = await this.openai.chat.completions.create({
          model: "gpt-3.5-turbo", // Or a model you prefer for this task
          messages: [
            { role: "system", content: CODE_PATTERNS_SYSTEM_PROMPT },
            { role: "user", content: `Analyze the following ${language} code for design patterns:
 main

${code}` }
          ],
        });

        const patterns = response.choices[0]?.message?.content?.trim() || "Could not detect patterns from OpenAI.";
        if (response.usage) {
          console.log(`\x1b[32mTokens used: ${response.usage.total_tokens}\x1b[0m`);
        }
        return patterns;
      } catch (error) {
        console.error(`\x1b[31mError detecting patterns with OpenAI:\x1b[0m`, error);
        // Fallback to Anthropic if OpenAI fails and Anthropic key is present
        if (this.anthropic.apiKey) {
          console.log(`\x1b[33mOpenAI failed, trying Anthropic for pattern detection...\x1b[0m`);
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
    console.error(`\x1b[31mError detecting patterns with Anthropic:\x1b[0m`, error);
      return "Error detecting patterns with Anthropic.";
    }
 main
  }
}
