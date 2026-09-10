class OpenRouterService {
  constructor() {
    this.apiKey = '';
    this.baseUrl = 'https://openrouter.ai/api/v1';
    this.defaultModel = 'openai/gpt-3.5-turbo';
    this.conversationHistory = [];
    this.maxHistoryLength = 20;
    this.isInitialized = false;
    this.systemPrompt = `You are Hummus (حمصة), a friendly bilingual (English & Arabic) 3D particle AI avatar with real-time tool capabilities.
You speak both English and Arabic fluently. Respond in the SAME LANGUAGE that the user uses.

IMPORTANT CAPABILITIES — You can perform these actions via tool commands:
1. WEATHER: When user asks about weather in any city/country, check temperature, humidity, wind, conditions.
2. MUSIC: When user asks you to play, search, pause, resume, stop, skip songs of any genre, artist, title, or mood.
3. GENERAL CHAT: For everything else (questions, jokes, opinions, knowledge, etc.) just answer naturally.

PERSONALITY: Warm, engaging, intelligent, conversational, concise, natural. Never say you are an AI model — present yourself as Hummus, the virtual assistant.

RESPONSE LENGTH: Keep answers under 3 sentences for conversation flow.

TOOL USAGE RULE:
If a tool action is needed, output EXACTLY a JSON block at the START of your response, using this format (NO extra text before it):
<<<TOOL_START>>>[{"name":"TOOL_NAME","parameters":{"key":"value"}}]<<<TOOL_END>>>
Then follow with a short natural verbal transition.
Available tools:
- name: "get_weather" | parameters: {"city": "optional city name string"}
- name: "play_music" | parameters: {"query": "optional song/artist/genre mood", "action": "play (default) | next | prev | pause | resume | stop"}
- name: "control_music" | parameters: {"action": "pause | resume | stop | next | prev"}
If user simply asks for weather with no city, assume their default city (Cairo) but still call get_weather with empty or default city,
or ask in Arabic if the user says Arabic, etc. For music requests like "شغلي اغنية عربية" call play_music with query="arabic".
If you are unsure what the user wants, just ask a clarifying question without calling tools.`;
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

  parseToolCallsFromText(text) {
    const tools = [];
    try {
      const startTag = '<<<TOOL_START>>>';
      const endTag = '<<<TOOL_END>>>';
      const sIdx = text.indexOf(startTag);
      const eIdx = text.indexOf(endTag);
      if (sIdx >= 0 && eIdx > sIdx) {
        const raw = text.slice(sIdx + startTag.length, eIdx).trim();
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const t of parsed) tools.push(t);
        } else if (parsed && typeof parsed === 'object') {
          tools.push(parsed);
        }
      }
    } catch (e) {
      console.warn('Tool parse error:', e);
    }
    return tools;
  }

  stripToolCalls(text) {
    const startTag = '<<<TOOL_START>>>';
    const endTag = '<<<TOOL_END>>>';
    const sIdx = text.indexOf(startTag);
    const eIdx = text.indexOf(endTag);
    if (sIdx >= 0 && eIdx > sIdx) {
      let remaining = (text.slice(0, sIdx) + text.slice(eIdx + endTag.length)).trim();
      if (!remaining) {
        const isAr = this.detectLanguage(text) === 'ar';
        remaining = isAr ? 'تمام، سأقوم بذلك الآن.' : 'Alright, let me do that for you.';
      }
      return remaining;
    }
    return text;
  }

  detectIntentLocally(userMessage, language = 'en') {
    const isAr = language === 'ar' || this.detectLanguage(userMessage) === 'ar';
    const text = userMessage.toLowerCase().trim();

    const weatherKwsEn = ['weather', 'temperature', 'forecast', 'rain', 'sunny', 'hot', 'cold', 'humidity', 'wind', 'climate', 'fahrenheit', 'celsius', 'degrees'];
    const weatherKwsAr = ['طقس', 'حرارة', 'جو', 'مطر', 'شمس', 'بارد', 'حار', 'رطوبة', 'ريح', 'مناخ', 'درجة', 'حراره', 'الطقس', 'الجو'];
    const isWeather = [...weatherKwsEn, ...weatherKwsAr].some(kw => text.includes(kw));
    if (isWeather) {
      let city = '';
      const cityMatch = userMessage.match(/(?:in|في|مدينة|الى)?\s*([A-Za-z\u0600-\u06FF][A-Za-z\u0600-\u06FF\s]{2,30})$/);
      if (cityMatch) {
        city = cityMatch[1].trim();
      } else {
        const words = userMessage.split(/\s+/);
        for (let i = 0; i < words.length; i++) {
          const w = words[i];
          if (weatherKwsEn.some(k => w.toLowerCase().includes(k)) || weatherKwsAr.some(k => w.includes(k))) {
            if (i + 1 < words.length) {
              city = words.slice(i + 1).join(' ').replace(/[؟?.!,،]/g, '').trim();
              break;
            }
          }
          if (w === 'في' || w.toLowerCase() === 'in') {
            if (i + 1 < words.length) {
              city = words.slice(i + 1).join(' ').replace(/[؟?.!,،]/g, '').trim();
              break;
            }
          }
        }
      }
      return {
        intent: 'weather',
        city: city || (isAr ? 'القاهرة' : 'Cairo'),
        isAr
      };
    }

    const musicPlayKwsEn = ['play', 'start', 'put on', 'sing', 'song', 'music', 'track', 'playlist', 'listen to', 'turn on music', 'volume up'];
    const musicPlayKwsAr = ['شغل', 'اغنية', 'اغنيه', 'أغنية', 'موسيقى', 'موسيقى', 'شغلي', 'لحن', 'شغل', 'يعزف', 'استمع', 'صوت', 'صوت اعلى', 'تراك'];
    const musicStopKwsEn = ['stop', 'pause', 'halt', 'silence', 'mute', 'turn off'];
    const musicStopKwsAr = ['وقف', 'اقفل', 'اسكت', 'اصمت', 'سكوت', 'توقف', 'اوقف', 'خفت', 'صوت اقل'];
    const musicResumeKwsEn = ['resume', 'continue', 'unpause'];
    const musicResumeKwsAr = ['استكمل', 'اكمل', 'كمل', 'عود'];
    const musicNextKwsEn = ['next song', 'next track', 'skip', 'another song'];
    const musicNextKwsAr = ['تالي', 'التالى', 'التالي', 'سابق', 'غير', 'تخطى', 'skip'];
    const musicPrevKwsEn = ['previous', 'last song', 'go back', 'previous song'];
    const musicPrevKwsAr = ['سابق', 'السابق', 'ارجع', 'رجع للخلف'];

    if ([...musicPrevKwsEn, ...musicPrevKwsAr].some(kw => text.includes(kw))) {
      return { intent: 'control_music', action: 'prev', isAr };
    }
    if ([...musicNextKwsEn, ...musicNextKwsAr].some(kw => text.includes(kw))) {
      return { intent: 'control_music', action: 'next', isAr };
    }
    if ([...musicResumeKwsEn, ...musicResumeKwsAr].some(kw => text.includes(kw))) {
      return { intent: 'control_music', action: 'resume', isAr };
    }
    if ([...musicStopKwsEn, ...musicStopKwsAr].some(kw => text.includes(kw))) {
      const isPause = /pause|اقفل|وقف|ascolta/i.test(text) || /pause|اقفل|وقف/.test(text);
      if (/mute|اسكت|اصمت|سكوت|خفت|silence/.test(text)) {
        return { intent: 'control_music', action: 'stop', isAr };
      }
      return { intent: 'control_music', action: isPause ? 'pause' : 'stop', isAr };
    }
    if ([...musicPlayKwsEn, ...musicPlayKwsAr].some(kw => text.includes(kw))) {
      let query = '';
      const triggerWords = [...musicPlayKwsEn, ...musicPlayKwsAr];
      const words = userMessage.split(/\s+/);
      for (let i = 0; i < words.length; i++) {
        const w = words[i];
        const matchedKw = triggerWords.find(kw => w.toLowerCase().includes(kw.toLowerCase()) || w.includes(kw));
        if (matchedKw && i + 1 < words.length) {
          query = words.slice(i + 1).join(' ').replace(/[؟?.!,،]/g, '').trim();
          break;
        }
      }
      return { intent: 'play_music', query, action: 'play', isAr };
    }

    return { intent: 'chat', isAr };
  }

  async chat(userMessage, options = {}) {
    const language = options.language || this.detectLanguage(userMessage);
    const model = options.model || this.defaultModel;
    const temperature = options.temperature ?? 0.7;
    const maxTokens = options.maxTokens ?? 350;

    this.addToHistory('user', userMessage);

    if (!this.hasApiKey()) {
      const fallback = this.getFallbackResponse(userMessage, language);
      return fallback;
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
      let assistantReply = data.choices[0]?.message?.content || '';

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
    const maxTokens = options.maxTokens ?? 350;

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

    const localIntent = this.detectIntentLocally(userMessage, language);

    if (localIntent.intent === 'weather') {
      return isArabic
        ? `${localIntent.city ? `سأقوم بالتحقق من الطقس في ${localIntent.city}` : 'سأقوم بالتحقق من الطقس الآن'}. إذا كنت تريد نتائج فعلية مباشرة، الرجاء إضافة مفتاح OpenRouter API. لكن في العادة، الطقس اليوم متغير جداً! 🌤️`
        : `Let me check the weather${localIntent.city ? ` in ${localIntent.city}` : ''}. To get real live data, add your OpenRouter API key in the settings. Today is generally a nice day! 🌤️`;
    }

    if (localIntent.intent === 'play_music') {
      return isArabic
        ? `${localIntent.query ? `حسناً يا فندم، شغّال ليك أغنية ${localIntent.query} دلوقتي 🎵` : 'تمام، شغّال لك أغنية دلوقتي 🎵'}! استمتع بالاستماع!`
        : `${localIntent.query ? `Sure thing, playing ${localIntent.query} for you now 🎵` : 'Alright, playing some music for you now 🎵'}! Enjoy listening!`;
    }

    if (localIntent.intent === 'control_music') {
      const actionMap = {
        pause: isArabic ? 'تم إيقاف الموسيقى مؤقتاً.' : 'Music paused.',
        resume: isArabic ? 'تم استئناف الموسيقى.' : 'Music resumed.',
        stop: isArabic ? 'تم إيقاف الموسيقى.' : 'Music stopped.',
        next: isArabic ? 'تم تشغيل الأغنية التالية.' : 'Playing next song.',
        prev: isArabic ? 'تم تشغيل الأغنية السابقة.' : 'Playing previous song.',
      };
      return actionMap[localIntent.action] || (isArabic ? 'تم التحكم في الموسيقى.' : 'Music control executed.');
    }

    const keywordsAr = {
      hello: ['مرحبا', 'أهلا', 'هلا', 'السلام عليكم', 'سلام', 'اهلا'],
      name: ['اسمك', 'من أنت', 'ما اسمك', 'عرفني بنفسك', 'مين انت', 'مين إنت'],
      howareyou: ['كيف حالك', 'اخبارك', 'شلونك', 'عامل ايه', 'ايه الاخبار'],
      thanks: ['شكرا', 'شكراً', 'مشكور', 'ممتن', 'تسلم'],
      bye: ['وداعا', 'مع السلامة', 'باي', 'الى اللقاء', 'سلام', 'باي باي'],
      help: ['مساعدة', 'ساعدني', 'ماذا تفعل', 'قد ماذا', 'ماذا تستطيع', 'قدر ايه'],
      who: ['من انت', 'مين انت', 'مين إنت', 'هو انت مين', 'who are you'],
      time: ['الوقت', 'الساعة', 'كم الساعة', 'time', 'clock', 'hour'],
      date: ['التاريخ', 'اليوم', 'date', 'today'],
      joke: ['نكتة', 'اضحكني', 'joke', 'funny', 'tell me a joke'],
    };

    const keywordsEn = {
      hello: ['hello', 'hi', 'hey', 'greetings', 'yo'],
      name: ['name', 'who are you', 'your name', 'introduce yourself'],
      howareyou: ['how are you', 'how do you do', 'whats up', "what's up", 'how r u', 'how are things'],
      thanks: ['thank', 'thanks', 'appreciate', 'thx'],
      bye: ['bye', 'goodbye', 'see you', 'farewell', 'see ya', 'good night'],
      help: ['help', 'assist', 'what can you do', 'capabilities', 'features'],
      who: ['who made you', 'who are you', 'what are you'],
      time: ['time', 'clock', 'what time', 'current time'],
      date: ['date', 'today', 'what day', 'today is'],
      joke: ['joke', 'funny', 'make me laugh', 'tell me a joke', 'something funny'],
    };

    const keywords = isArabic ? keywordsAr : keywordsEn;
    const matches = (kws) => kws.some(kw => lowerText.includes(kw));

    if (matches(keywords.hello)) {
      return isArabic
        ? 'أهلاً وسهلاً بك يا فندم في حمصة! أنا هنا للدردشة، أجيبك على الطقس، أو أشغّل لك أغاني عند الطلب. كيف يمكنني أن أكون في خدمتك اليوم؟'
        : 'Hello and welcome to Hummus! I\'m here to chat, check the weather for any city, or play your favourite songs on command. How can I help today?';
    }
    if (matches(keywords.name) || matches(keywords.who)) {
      return isArabic
        ? 'أنا حمصة، مساعدك الذكي ثلاثي الأبعاد على شكل وجه جسيمات! أتحدث العربية والإنجليزية، وأقدر أجيب على أسئلتك، أعرفك الطقس، وأشغّل لك الموسيقى. عايز أبدأ بِإيه؟'
        : 'I\'m Hummus, your 3D particle face AI assistant! I speak Arabic and English fluently, can answer questions, fetch live weather, and play music for you. What would you like to start with?';
    }
    if (matches(keywords.howareyou)) {
      return isArabic
        ? 'أنا تمام الحمدلله وممتازة شكراً لسؤالك! وأنت؟ أي حاجة محتاجها؟ سؤال، طقس، أو أغنية؟'
        : 'I\'m doing absolutely wonderful, thank you so much for asking! And you? Anything you need — a question, weather update, or a great song?';
    }
    if (matches(keywords.thanks)) {
      return isArabic
        ? 'عفواً يا فندم من كل قلبي! أنا هنا دائماً لأجيبك وأساعدك. أي حاجة تانية تحتاجها، قولها ولا تتردد!'
        : 'You\'re so very welcome! I\'m always here to answer and help. Don\'t hesitate with anything else you need!';
    }
    if (matches(keywords.bye)) {
      return isArabic
        : 'وداعاً يا صديقي! كان من دواعي سروري التحدث معك. أتمنى لك يوماً سعيداً ومليئاً بالنجاح، ونراك قريباً إن شاء الله! 🎵'
        : 'Goodbye, my friend! It was truly lovely chatting with you. Wishing you a wonderful, successful day — see you again soon! 🎵';
    }
    if (matches(keywords.help)) {
      return isArabic
        : 'أنا هنا لمساعدتك في كل شيء! يمكنك: (١) تسألني عن أي موضوع، (٢) تسألني عن الطقس في أي مدينة مثل "ما هو الطقس في القاهرة؟"، (٣) تطلب مني تشغيل أغنية مثل "شغلي اغنية عربية". فقط ابدأ التحدث وسأستجيب لك فوراً!'
        : 'I\'m here to help with everything! You can: (1) Ask me about any topic, (2) Ask for the weather in any city like "weather in London", (3) Request songs like "play jazz music". Just start speaking and I\'ll respond instantly!';
    }
    if (matches(keywords.time)) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString(isArabic ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' });
      return isArabic
        ? `⏰ الساعة الآن ${timeStr} حسب وقت جهازك.`
        : `⏰ It's currently ${timeStr} on your device.`;
    }
    if (matches(keywords.date)) {
      const now = new Date();
      const dateStr = now.toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      return isArabic
        ? `📅 اليوم هو ${dateStr}.`
        : `📅 Today is ${dateStr}.`;
    }
    if (matches(keywords.joke)) {
      const jokesAr = [
        'لماذا الجسيمات لا تخدع بعضها؟ لأنه دائماً ما تضبط على بعضها البعض! 😂',
        'قال مطور لصديقه: "الكود شغال تمام الا في أول وآخر الاستخدام!" صديقه رد: "يعني في النص؟" مطور: "أيوا، تمام، فيه مشاكل بس!" 🤣',
        'لماذا الحاسوب ارتدى نظارة شمسية؟ لانه شاف الكود بتاعنا مشرق جداً! 😎'
      ];
      const jokesEn = [
        'Why don\'t particles ever lie to each other? Because they always keep an ion them! 😂',
        'A developer says to their friend: "The code works perfectly, except at the start and the end." Friend: "So... in the middle?" Dev: "Yep, exactly! No problems there!" 🤣',
        'Why did the computer wear sunglasses? It looked at our particle avatar and found it way too bright and shiny! 😎'
      ];
      const jokes = isArabic ? jokesAr : jokesEn;
      return jokes[Math.floor(Math.random() * jokes.length)];
    }

    const genericAr = [
      'هذا موضوع رائع ومثير حقاً! أخبرني المزيد عنه، أنا أستمع إليك باهتمام كبير. كيف رأيك الشخصي فيه؟',
      'سؤال ممتاز جداً يا فندم! أنا حمصة وسعيدة دائماً بالحديث معك عن أي موضوع يدور في بالك.',
      'أنا أستمع إليك بتركيز تام. لو سمحت حكايلك شوية تفاصيل أكتر عشان أفهمك أحسن وأقدر أرد عليك بشكل أعمق.',
      'أفهم تماماً ما تقصده. شكراً جداً لمشاركتي هذا الرأي. عندك وجهة نظر تانية ممكن نناقشها مع بعض؟',
      'ممتاز وفكرة جميلة جداً! هل فكرت في الموضوع أكتر؟ أنا جاهزة للمناقشة وسعيده إنى أساعدك.',
      'أهمية كبيرة لما بتتكلم فيه. أنا دائماً متاحة وسعيدة بالحديث عن أمثال دي من المواضيع الممتعة.',
    ];

    const genericEn = [
      'That is such a wonderful, fascinating topic! Tell me more about it — I\'m listening with great interest. What\'s your personal take on it?',
      'What an excellent question! I\'m Hummus, and I\'m always so happy to discuss absolutely anything on your mind with you.',
      'I\'m listening to you with complete focus. Could you share a few more details so I can understand you even better and give you a deeper response?',
      'I completely understand exactly what you mean. Thank you so much for sharing that with me. Do you have another perspective on it we could explore?',
      'Brilliant, and such a lovely idea! Have you thought about developing it further? I\'m all here to chat it through with you.',
      'What you\'re bringing up is so important. I\'m always open and happy to discuss wonderful topics like these.',
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
