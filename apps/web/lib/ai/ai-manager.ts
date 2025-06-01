// AI Manager for MCP Code Analyzer
// This module handles integration with AI services like OpenAI and Anthropic for code analysis and explanations

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export class AIManager {
  private openai: OpenAI | null;
  private anthropic: Anthropic | null;
  
  constructor() {
    // Initialize OpenAI if API key is provided
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      console.log('OpenAI service initialized');
    } else {
      this.openai = null;
      console.warn('OpenAI API key not found. OpenAI service will not be available.');
    }
    
    // Initialize Anthropic if API key is provided
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
      console.log('Anthropic service initialized');
    } else {
      this.anthropic = null;
      console.warn('Anthropic API key not found. Claude service will not be available.');
    }
  }
  
  // Check if any AI service is available
  public isAvailable(): boolean {
    return this.openai !== null || this.anthropic !== null;
  }
  
  // Explain code using the available AI service
  public async explainCode(code: string, language: string, level: string = 'intermediate'): Promise<string> {
    if (this.openai) {
      return this.explainCodeWithOpenAI(code, language, level);
    } else if (this.anthropic) {
      return this.explainCodeWithAnthropic(code, language, level);
    } else {
      throw new Error('No AI service available. Please configure API keys.');
    }
  }
  
  // Suggest improvements for code using the available AI service
  public async suggestImprovements(code: string): Promise<string[]> {
    if (this.openai) {
      return this.suggestImprovementsWithOpenAI(code);
    } else if (this.anthropic) {
      return this.suggestImprovementsWithAnthropic(code);
    } else {
      throw new Error('No AI service available. Please configure API keys.');
    }
  }
  
  // Private method for OpenAI code explanation
  private async explainCodeWithOpenAI(code: string, language: string, level: string): Promise<string> {
    if (!this.openai) throw new Error('OpenAI service not initialized');
    
    try {
      const prompt = this.buildExplanationPrompt(code, language, level);
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          { role: 'system', content: 'You are a highly knowledgeable coding assistant helping developers understand code.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.7
      });
      
      return completion.choices[0].message.content || 'Failed to generate explanation.';
    } catch (error) {
      console.error('Error with OpenAI API:', error);
      throw new Error(`Failed to explain code with OpenAI: ${error.message}`);
    }
  }
  
  // Private method for Anthropic code explanation
  private async explainCodeWithAnthropic(code: string, language: string, level: string): Promise<string> {
    if (!this.anthropic) throw new Error('Anthropic service not initialized');
    
    try {
      const prompt = this.buildExplanationPrompt(code, language, level);
      const completion = await this.anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 500,
        temperature: 0.7,
        system: 'You are a highly knowledgeable coding assistant helping developers understand code.',
        messages: [
          { role: 'user', content: prompt }
        ]
      });
      
      return completion.content[0].text || 'Failed to generate explanation.';
    } catch (error) {
      console.error('Error with Anthropic API:', error);
      throw new Error(`Failed to explain code with Anthropic: ${error.message}`);
    }
  }
  
  // Private method for OpenAI code improvement suggestions
  private async suggestImprovementsWithOpenAI(code: string): Promise<string[]> {
    if (!this.openai) throw new Error('OpenAI service not initialized');
    
    try {
      const prompt = this.buildImprovementPrompt(code);
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          { role: 'system', content: 'You are a code optimization expert, providing actionable suggestions to improve code quality.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 300,
        temperature: 0.7
      });
      
      const response = completion.choices[0].message.content || '';
      return response.split('\n').filter(item => item.trim().startsWith('-') || item.trim().startsWith('*')).map(item => item.trim());
    } catch (error) {
      console.error('Error with OpenAI API for improvements:', error);
      return [];
    }
  }
  
  // Private method for Anthropic code improvement suggestions
  private async suggestImprovementsWithAnthropic(code: string): Promise<string[]> {
    if (!this.anthropic) throw new Error('Anthropic service not initialized');
    
    try {
      const prompt = this.buildImprovementPrompt(code);
      const completion = await this.anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 300,
        temperature: 0.7,
        system: 'You are a code optimization expert, providing actionable suggestions to improve code quality.',
        messages: [
          { role: 'user', content: prompt }
        ]
      });
      
      const response = completion.content[0].text || '';
      return response.split('\n').filter(item => item.trim().startsWith('-') || item.trim().startsWith('*')).map(item => item.trim());
    } catch (error) {
      console.error('Error with Anthropic API for improvements:', error);
      return [];
    }
  }
  
  // Helper method to build prompt for code explanation
  private buildExplanationPrompt(code: string, language: string, level: string): string {
    return `Explain the following ${language} code for a ${level} level developer. Provide a clear, concise explanation focusing on the purpose, key components, and functionality:

\`\`\`${language}
${code}
\`\`\`

Break down complex parts if necessary and use analogies if helpful for the given level.`;
  }
  
  // Helper method to build prompt for code improvements
  private buildImprovementPrompt(code: string): string {
    return `Analyze the following code and suggest specific improvements for readability, performance, or maintainability. Provide a list of actionable recommendations:

\`\`\`
${code}
\`\`\`

Focus on best practices and explain why each suggestion is beneficial.`;
  }
}
