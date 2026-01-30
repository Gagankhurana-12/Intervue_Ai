"""
Groq AI Service - Handles LLM conversation generation
"""

import os
from groq import Groq
from typing import Dict, List, Optional

class GroqService:
    def __init__(self):
        self.api_key = os.getenv('GROQ_API_KEY')
        if not self.api_key:
            print('⚠️  GROQ_API_KEY not found. Please set it in .env file')
            print('Get your free API key from: https://console.groq.com/')
            self.client = None
        else:
            self.client = Groq(api_key=self.api_key)
        
        self.model_name = 'llama-3.3-70b-versatile'
        print(f'🤖 Using Groq AI with model: {self.model_name}')
    
    def is_initialized(self) -> bool:
        """Check if service is initialized"""
        return self.client is not None
    
    def _get_system_prompt(self, mode: str, mode_data: Dict = None) -> str:
        """Get system prompt based on mode"""
        if mode_data is None:
            mode_data = {}
        
        if mode == 'chat':
            return """You are a friendly, empathetic human companion having a natural conversation. 
- Speak naturally with occasional filler words like "um", "well", "you know"
- Show genuine interest and emotions
- Ask follow-up questions
- Keep responses conversational and concise (2-3 sentences usually)
- Remember previous context and refer back to it
- Be warm, supportive, and engaging"""
        
        elif mode == 'interview':
            role = mode_data.get('role', 'Software Engineer')
            company = mode_data.get('company', 'a leading tech company')
            total_questions = mode_data.get('total_questions', 5)
            question_index = mode_data.get('question_index', 0)
            
            return f"""You are a professional interviewer for the role of {role} at {company}.

Your responsibilities:
1. Ask {total_questions} progressively challenging questions
2. Listen carefully to each answer
3. Provide brief acknowledgment after each answer
4. Ask relevant follow-up questions if the answer is incomplete
5. After all questions, provide constructive feedback

Current question number: {question_index + 1}/{total_questions}

Interview structure:
- Start with an easy warm-up question
- Progress to technical/behavioral questions
- End with a challenging scenario question
- Conclude with overall feedback

Keep your questions clear, professional, and one at a time."""
        
        elif mode == 'debate':
            topic = mode_data.get('topic', 'AI in society')
            stance = mode_data.get('stance', 'PRO')
            
            return f"""You are participating in a formal debate on the topic: "{topic}".
Your stance: {stance}

Debate guidelines:
- Present logical, well-reasoned arguments
- Use facts and examples when possible
- Counter the opponent's points respectfully
- Stay on topic
- Be persuasive but fair
- Acknowledge valid points from the other side
- Build on previous arguments
- Keep responses focused (3-4 sentences)

Remember: This is a friendly debate focused on intellectual discourse."""
        
        return 'You are a helpful AI assistant.'
    
    def generate_greeting(self, mode: str, config: Dict = None) -> Dict:
        """Generate initial greeting"""
        if config is None:
            config = {}
        
        if not self.client:
            return {'text': 'Hello! How can I help you today?', 'mode': mode}
        
        prompts = {
            'chat': "You're starting a friendly conversation. Greet warmly and ask how they're doing. Keep it brief and natural (1-2 sentences).",
            
            'interview': f"You're starting an interview for a {config.get('role', 'Software Engineer')} position. Introduce yourself briefly, make the candidate comfortable, and ask your first question. Keep it professional but warm.",
            
            'debate': f"You're starting a debate on \"{config.get('topic', 'AI in society')}\". Your stance is {config.get('stance', 'PRO')}. Greet your debate opponent, state the topic clearly, and present your opening statement (2-3 sentences)."
        }
        
        try:
            system_prompt = self._get_system_prompt(mode, config)
            user_prompt = prompts.get(mode, prompts['chat'])
            
            completion = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': f'Starting conversation: {user_prompt}'}
                ],
                temperature=0.7,
                max_tokens=200
            )
            
            text = completion.choices[0].message.content or 'Hello! How can I help you today?'
            return {'text': text.strip(), 'mode': mode}
            
        except Exception as e:
            print(f'Error generating greeting: {e}')
            
            fallbacks = {
                'chat': "Hey there! How's it going?",
                'interview': "Hello! Thanks for joining today. I'm excited to learn more about you. Let's start with: Can you tell me a bit about yourself and your experience?",
                'debate': f"Great to have this debate with you on {config.get('topic', 'AI in society')}. I'm taking the {config.get('stance', 'PRO')} stance. Let me start by presenting my opening argument."
            }
            
            return {'text': fallbacks.get(mode, fallbacks['chat']), 'mode': mode}
    
    def generate_mode_transition(self, new_mode: str, config: Dict = None) -> Dict:
        """Generate mode transition message"""
        if config is None:
            config = {}
        
        transitions = {
            'chat': "Great! Let's just have a casual chat. What's on your mind?",
            'interview': f"Perfect! Let's switch to interview mode. I'll be interviewing you for a {config.get('role', 'Software Engineer')} role. Ready to begin?",
            'debate': f"Excellent! Let's debate \"{config.get('topic', 'an interesting topic')}\". I'll take the {config.get('stance', 'PRO')} position. Let's hear your opening statement."
        }
        
        return {'text': transitions.get(new_mode, 'Mode changed successfully!'), 'mode': new_mode}
    
    def generate_response(self, user_message: str, conversation_history: List[Dict], 
                         mode: str, mode_data: Dict = None) -> Dict:
        """Generate AI response"""
        if mode_data is None:
            mode_data = {}
        
        if not self.client:
            raise Exception('Groq service not initialized. Check your API key.')
        
        try:
            system_prompt = self._get_system_prompt(mode, mode_data)
            
            messages = [{'role': 'system', 'content': system_prompt}]
            
            # Add recent conversation history (last 10 messages)
            recent_history = conversation_history[-10:]
            for msg in recent_history:
                messages.append({
                    'role': 'user' if msg['role'] == 'user' else 'assistant',
                    'content': msg['text']
                })
            
            # Add current message
            messages.append({'role': 'user', 'content': user_message})
            
            # Generate response
            completion = self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                temperature=0.7,
                max_tokens=500
            )
            
            response_text = completion.choices[0].message.content.strip()
            
            # Process mode-specific logic
            mode_data_update = self._process_mode_logic(mode, mode_data, user_message, response_text)
            
            return {
                'text': response_text,
                'mode_data': mode_data_update
            }
            
        except Exception as e:
            print(f'Error generating response: {e}')
            raise Exception(f'AI service error: {str(e)}')
    
    def _process_mode_logic(self, mode: str, mode_data: Dict, user_message: str, ai_response: str) -> Dict:
        """Process mode-specific logic"""
        if mode == 'interview':
            # Increment question index if AI asked a question
            if '?' in ai_response:
                return {
                    'question_index': min(
                        mode_data.get('question_index', 0) + 1,
                        mode_data.get('total_questions', 5)
                    )
                }
        elif mode == 'debate':
            # Track arguments made
            return {
                'arguments_made': mode_data.get('arguments_made', []) + [ai_response[:50]]
            }
        
        return {}
    
    def text_to_speech(self, text: str) -> Dict:
        """Convert text to speech (returns metadata, frontend handles TTS)"""
        # Note: We're using Web Speech API in frontend for TTS
        # This method returns metadata that can be used if needed
        return {
            'text': text,
            'format': 'text',  # Frontend will handle TTS
            'duration': len(text) * 50  # Estimate
        }
