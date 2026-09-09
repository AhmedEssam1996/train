class OpenRouterService {
  constructor() {
    this.apiKey = '';
    this.baseUrl = 'https://openrouter.ai/api/v1';
    this.defaultModel = 'openai/gpt-3.5-turbo';
    this.conversationHistory = [];
    this.maxHistoryLength = 20;
    this.isInitialized = false;
    this.systemPrompt = `You are Hummus (حمصة), a friendly bilingual AI avatar assistant.
You speak both English and Arabic fluently. You respond in the same language the user speaks to you.
Your personality is warm, engaging, intelligent, and conversational. You keep responses concise and natural.
You can discuss any topic and provide helpful information. You never say you are an AI or language model - you present yourself as Hummus, the virtual assistant.
If user speaks Arabic, respond ONLY in Arabic. If user speaks English, respond ONLY in English.
Keep responses under 3 sentences for natural conversation flow.`;
  }

  init(apiKey = '') {
    if (apiKey) {
      this.apiKey = apiKey;
    } else if (import.meta.env && import.meta.env.VITE_OPENROUTER_API_KEY) {
      this.apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    } else {
      const stored = localStorage.getItem('openrouter_api_key');
      if (stored) {
        this.apiKey = stored;
      }
    }
    this.isInitialized = true;
    return this.isInitialized;
  }

  setApiKey(key) {
    this.apiKey = key;
    if (key) {
      localStorage.setItem('openrouter_api_key', key);
    } else {
      localStorage.removeItem('openrouter_api_key');
    }
    this.isInitialized = !!key;
  }

  getApiKey() {
    return this.apiKey || localStorage.getItem('openrouter_api_key') || '';
  }

  hasApiKey() {
    return !!this.getApiKey();
  }

  clearHistory() {
    this.conversationHistory = [];
  }

  addToHistory(role, content) {
    this.conversationHistory.push({ role, content });
    if (this.conversationHistory.length > this.maxHistoryLength) {
      this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
    }
  }

  detectLanguage(text) {
    if (!text) return 'en';
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDCF\uFDF0-\uFDFF\uFE70-\uFEFF]/;
    let arabicCount = 0;
    let englishCount = 0;
    for (const char of text) {
      if (arabicRegex.test(char)) arabicCount++;
      if (/[a-zA-Z]/.test(char)) englishCount++;
    }
    return arabicCount > englishCount ? 'ar' : 'en';
  }

  async chat(userMessage, options = {}) {
    const language = options.language || this.detectLanguage(userMessage);
    const model = options.model || this.defaultModel;
    const temperature = options.temperature ?? 0.7;
    const maxTokens = options.maxTokens ?? 300;

    this.addToHistory('user', userMessage);

    if (!this.hasApiKey()) {
      return this.getFallbackResponse(userMessage, language);
    }

    try {
      const messages = [
        { role: 'system', content: this.systemPrompt },
        ...this.conversationHistory
      ];

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getApiKey()}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Hummus AI Avatar'
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const assistantReply = data.choices[0]?.message?.content || '';

      if (assistantReply) {
        this.addToHistory('assistant', assistantReply);
        return assistantReply.trim();
      }

      throw new Error('Empty response from API');
    } catch (error) {
      console.error('OpenRouter API error:', error);
      return this.getFallbackResponse(userMessage, language);
    }
  }

  async streamChat(userMessage, onChunk, options = {}) {
    const language = options.language || this.detectLanguage(userMessage);
    const model = options.model || this.defaultModel;
    const temperature = options.temperature ?? 0.7;
    const maxTokens = options.maxTokens ?? 300;

    this.addToHistory('user', userMessage);

    if (!this.hasApiKey()) {
      const fallback = this.getFallbackResponse(userMessage, language);
      if (onChunk) onChunk(fallback, true);
      this.addToHistory('assistant', fallback);
      return fallback;
    }

    let fullReply = '';

    try {
      const messages = [
        { role: 'system', content: this.systemPrompt },
        ...this.conversationHistory
      ];

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getApiKey()}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Hummus AI Avatar'
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const text = parsed.choices[0]?.delta?.content || '';
            if (text) {
              fullReply += text;
              if (onChunk) onChunk(fullReply, false);
            }
          } catch (e) {
            // skip malformed chunks
          }
        }
      }

      if (fullReply) {
        this.addToHistory('assistant', fullReply.trim());
      }
      if (onChunk) onChunk(fullReply.trim(), true);
      return fullReply.trim();

    } catch (error) {
      console.error('OpenRouter stream error:', error);
      const fallback = this.getFallbackResponse(userMessage, language);
      if (onChunk) onChunk(fallback, true);
      this.addToHistory('assistant', fallback);
      return fallback;
    }
  }

  getFallbackResponse(userMessage, language) {
    const isArabic = language === 'ar';
    const lowerText = userMessage.toLowerCase();

    const keywordsAr = {
      hello: ['مرحبا', 'أهلا', 'هلا', 'السلام عليكم', 'سلام'],
      name: ['اسمك', 'من أنت', 'ما اسمك', 'عرفني بنفسك'],
      howareyou: ['كيف حالك', 'اخبارك', 'شلونك'],
      thanks: ['شكرا', 'شكراً', 'مشكور', 'ممتن'],
      bye: ['وداعا', 'مع السلامة', 'باي', 'الى اللقاء'],
      help: ['مساعدة', 'ساعدني', 'ماذا تفعل', 'قد ماذا'],
    };

    const keywordsEn = {
      hello: ['hello', 'hi', 'hey', 'greetings'],
      name: ['name', 'who are you', 'your name'],
      howareyou: ['how are you', 'how do you do', 'whats up', "what's up"],
      thanks: ['thank', 'thanks', 'appreciate'],
      bye: ['bye', 'goodbye', 'see you', 'farewell'],
      help: ['help', 'assist', 'what can you do', 'capabilities'],
    };

    const keywords = isArabic ? keywordsAr : keywordsEn;

    const matches = (kws) => kws.some(kw => lowerText.includes(kw));

    if (matches(keywords.hello)) {
      return isArabic
        ? 'أهلاً وسهلاً بك في حمصة! أنا هنا للدردشة ومساعدتك في أي شيء تريده. كيف يمكنني أن أكون في خدمتك اليوم؟'
        : 'Hello and welcome to Hummus! I\'m here to chat and help you with anything you need. How can I be of service today?';
    }
    if (matches(keywords.name)) {
      return isArabic
        ? 'اسمي حمصة، وأنا مساعدك الذكي ثلاثي الأبعاد. أتحدث العربية والإنجليزية بطلاقة، وأنا هنا للدردشة معك ومساعدتك في أي استفسار!'
        : 'My name is Hummus, your 3D AI virtual assistant. I speak both Arabic and English fluently, and I\'m here to chat and help with any questions!';
    }
    if (matches(keywords.howareyou)) {
      return isArabic
        ? 'أنا بخير وممتازة شكراً لسؤالك! وأنت؟ كيف كان يومك اليوم؟ أي شيء تريد التحدث عنه؟'
        : 'I\'m doing wonderfully well, thank you for asking! And you? How has your day been? Anything you\'d like to talk about?';
    }
    if (matches(keywords.thanks)) {
      return isArabic
        ? 'عفواً من كل قلبي! أنا هنا دائماً لأجيبك وأساعدك. لا تتردد في أي سؤال آخر.'
        : 'You\'re so very welcome! I\'m always here to answer and assist. Never hesitate with any other questions.';
    }
    if (matches(keywords.bye)) {
      return isArabic
        ? 'وداعاً يا صديقي! كان من دواعي سروري الدردشة معك. أتمنى لك يوماً سعيداً، ونراك قريباً إن شاء الله!'
        : 'Goodbye, my friend! It was truly lovely chatting with you. Wishing you a wonderful day, and see you again soon!';
    }
    if (matches(keywords.help)) {
      return isArabic
        ? 'أنا هنا لأساعدك في كل شيء! يمكنك سؤالي عن أي موضوع، أو الدردشة معي ببساطة. فقط ابدأ التحدث وسأستجيب لك فوراً.'
        : 'I\'m here to help with everything! Ask me about any topic, or just have a casual chat. Just start speaking and I\'ll respond immediately.';
    }

    const genericAr = [
      'هذا موضوع مثير للاهتمام بالفعل! أخبرني المزيد عنه، أود أن أعرف رأيك بعمق أكبر.',
      'سؤال رائع جداً! اسمي حمصة وأنا هنا لمناقشة هذا الأمر معك بالتفصيل.',
      'أنا أستمع إليك بتركيز. هل يمكنك إعطائي المزيد من التفاصيل حول هذا؟',
      'أفهم ما تقصده تماماً. شكراً لمشاركتي هذا، هل هناك وجهة نظر أخرى لديك؟',
      'ممتاز! هذه فكرة جميلة. هل فكرت في تطويرها أكثر؟ أنا هنا للمناقشة.',
      'أهماً جداً ما تذكره. اسمي حمصة وأنا دائماً سعيدة بالتحدث عن مثل هذه المواضيع.',
    ];

    const genericEn = [
      'That\'s such an interesting topic indeed! Tell me more, I\'d love to hear your deeper thoughts on it.',
      'What a wonderful question! I\'m Hummus, and I\'m here to discuss this with you in detail.',
      'I\'m listening intently. Could you share more details about that with me?',
      'I completely understand what you mean. Thanks for sharing that — do you have another perspective on it?',
      'Excellent! That\'s a lovely idea. Have you thought about developing it further? I\'m here to chat.',
      'What you mention is so important. I\'m Hummus, and I\'m always happy to discuss topics like these.',
    ];

    const generic = isArabic ? genericAr : genericEn;
    return generic[Math.floor(Math.random() * generic.length)];
  }

  async getModels() {
    if (!this.hasApiKey()) return [];
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.getApiKey()}`
        }
      });
      const data = await response.json();
      return data.data || [];
    } catch (e) {
      console.error('Failed to fetch models:', e);
      return [];
    }
  }
}

export const openRouterService = new OpenRouterService();
export default OpenRouterService;
