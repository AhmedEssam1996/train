# 🌌 Hummus AI Avatar — نظام الأفاتار ثلاثي الأبعاد بالجسيمات

نظام تفاعلي ثلاثي الأبعاد مذهل للأفاتار بالجسيمات مستوحى من AVATARI.IO، مبني باستخدام Three.js و React Three Fiber و Web Audio API. يتميز بوجه مُنشأ بالكامل برمجياً من 25,000 جسيم سيلاني، ومحادثة ذكاء اصطناعي ثنائية اللغة (العربية والإنجليزية)، وبيانات طقس مباشرة، وتشغيل موسيقى، وأنيميشن مطابقة حركة الشفاه، وكشف نشاط الصوت — وكل ذلك دون الحاجة لأي ملفات نماذج ثلاثية الأبعاد (بدون GLB).

---

## 🇸🇦 دليل التشغيل السريع بالعربية

### 📋 المتطلبات الأساسية
قبل البدء، تأكد من تثبيت البرامج التالية على جهازك:

| البرنامج | الإصدار الموصى به | رابط التحميل |
|---|---|---|
| **Node.js** | 18+ (الإصدار LTS) | [nodejs.org](https://nodejs.org/) |
| **npm** (يأتي مع Node.js) | 9+ | يثبت تلقائياً مع Node.js |
| **متصفح حديث** | Chrome 110+ / Edge 110+ / Firefox 110+ | يدعم WebGL 2.0 و Web Speech API |
| **ميكروفون** | أي نوع | اختياري لكن مستحسن لأوامر الصوت |

> ✅ **ملاحظة**: لا تحتاج لأي مفاتيح API لتجربة المشروع! يعمل بشكل كامل في الوضع الاحتياطي. الطقس والموسيقى يعملون مجاناً بدون إعدادات إضافية.

---

### 🚀 خطوات التشغيل (خطوة بخطوة)

#### الخطوة 1: افتح Terminal / موجه الأوامر
- على **Windows**: اضغط `Win + R`، اكتب `cmd` أو `powershell` ثم اضغط Enter
- على **Mac/Linux**: افتح تطبيق Terminal

#### الخطوة 2: انتقل لمجلد المشروع
```bash
cd c:\Users\ahmed.essam\Desktop\dd
```
*إذا كان المسار مختلف عندك، استخدم المسار الصحيح للمجلد*

#### الخطوة 3: قم بتثبيت المكتبات والتبعيات
```bash
npm install
```
⏳ هذه الخطوة قد تستغرق من 2 إلى 10 دقائق حسب سرعة الإنترنت لديك.
سيتم إنشاء مجلد `node_modules` وتحميل كل المكتبات المطلوبة (React, Three.js, Vite, إلخ).

> ⚠️ إذا ظهرت أخطاء أثناء التثبيت:
> - تأكد من اتصال الإنترنت
> - جرب حذف مجلد `node_modules` وملف `package-lock.json` ثم أعمل `npm install` مرة أخرى
> - جرب استخدام `npm install --force` أو `npm install --legacy-peer-deps`

#### الخطوة 4 (اختياري): إعداد ملف البيئة .env
هذه الخطوة **اختيارية** — فقط لو عايز تستخدم الذكاء الاصطناعي المتقدم عبر OpenRouter:

```bash
# Windows (PowerShell / CMD)
copy .env.example .env

# Mac / Linux
cp .env.example .env
```

ثم افتح الملف `.env` وضع مفتاح OpenRouter API:
```env
VITE_OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxx
```
*احصل على مفتاح مجاني من هنا: [openrouter.ai/keys](https://openrouter.ai/keys)*

> 🎯 ماذا يحدث لو لم تفعل هذه الخطوة؟
> - التطبيق سيعمل بشكل طبيعي 100%
> - الطقس والموسيقى سوف تشتغل تمام (مجانية بدون API)
> - فقط المحادثة مع الذكاء الاصطناعي ستكون في الوضع الاحتياطي (إجابات محلية قائمة على القواعد)

#### الخطوة 5: شغل خادم التطوير
```bash
npm run dev
```

🎉 بعد لحظات، سترى رسالة مشابهة لهذه:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://xxx.xxx.xxx.xxx:3000/
  ➜  press h + enter to show help
```

#### الخطوة 6: افتح التطبيق في المتصفح
افتح الرابط التالي في متصفحك:
👉 **http://localhost:3000/**

> 💡 الخادم يعمل على **المنفذ 3000** حسب إعدادات `vite.config.js`. إذا كان المنفذ مشغول مسبقاً، سيقوم Vite باختيار منفذ آخر تلقائياً.

---

### ✅ أول مرة تستخدم فيها التطبيق

1. بعد فتح الموقع، سترى شاشة الترحيب بعنوان **AVATARI.IO / HUMMUS**
2. اضغط على الزر الأزرق: **🚀 GET STARTED**
3. سينبثق لك طلب إذن الميكروفون 🔊 — اضغط **Allow** (سماح) لتستخدم أوامر الصوت
   *لو رفضت الإذن، الموقع هيعمل بشكل طبيعي بس من غير ميزة الأوامر الصوتية (تقدر تستخدم الدردشة النصية بدلها)*
4. بعد ثانيتين، ستظهر وجه الأفاتار ثلاثي الأبعاد بـ 25,000 جسيم!
5. الأفاتار يبدأ في الحالة **IDLE** مع تشغيل موسيقى خلفية هادئة

---

### 🗣️ جرب الأوامر الصوتية!

| الامر بالعربي | ماذا سيحدث؟ |
|---|---|
| **"مرحباً"** أو **"أهلاً"** | يرد الأفاتار عليك بالتحية |
| **"ما اسمك؟"** أو **"مين إنت؟"** | يعرفك بنفسه حمصة (Hummus) |
| **"الطقس في القاهرة"** | يجيبلك ببيانات الطقس المباشرة للقاهرة (بدون API key!) |
| **"الطقس في دبي"** أو **"الطقس في لندن"** | بيانات الطقس لأي مدينة تريد |
| **"شغلي أغنية عربية"** | يشغّل لك أغنية من المكتبة العربية المدمجة |
| **"شغل موسيقى جاز"** أو **"شغل موسيقى هادئة"** | يختار أغنية تناسب النوع المطلوب |
| **"وقف الموسيقى"** أو **"اسكت"** | يوقف الموسيقى |
| **"استكمل الموسيقى"** | يكمل تشغيل الموسيقى مرة أخرى |
| **"كم الساعة؟"** | يخبرك بالوقت الحالي |
| **"اليوم إيه؟"** | يخبرك بتاريخ اليوم |
| **"قول نكتة"** أو **"اضحكني"** | يحكي لك نكتة عربية |
| **"ماذا تفعل؟"** أو **"مساعدة"** | يشرح لك كل ماذا يستطيع أن يفعل |

---

### 🎛️ أزرار التحكم في الواجهة

| اللوحة | الزر | الوظيفة |
|---|---|---|
| **Avatar Status** | الحالة الملونة | تظهر الحالة الحالية (IDLE / LISTENING / THINKING / SPEAKING) |
| **Performance** | FPS / 25,000 | عداد الإطارات في الثانية + عدد الجسيمات |
| **Lip-Sync** | Toggle | تفعيل/إيقاف أنيميشن حركة الفم أثناء الكلام |
| **Mic Input** | Toggle | تفعيل/إيقاف استقبال الميكروفون |
| **Ambient Music** | Toggle | تشغيل/إيقاف الموسيقى الخلفية |
| **🔑 API Key** | الزر بالقفل | فتح نافذة لإدخال مفتاح OpenRouter |

---

### 🏗️ بناء النسخة النهائية للإنتاج

لو عايز تنشر المشروع على استضافة:

```bash
# 1. بناء المشروع (سيتم إنشاء مجلد dist)
npm run build

# 2. تجربة النسخة المبنية محلياً
npm run preview
```

سيتم إنشاء مجلد `dist` يحتوي على كل الملفات الجاهزة للرفع على أي استضافة (Vercel, Netlify, Hostinger, إلخ).

---

### ❓ حل المشاكل الشائعة

| المشكلة | الحل |
|---|---|
| **الصفحة بيضاء ولا يظهر شيء** | تأكد أن المتصفح يدعم WebGL 2.0، وجرب تحديث متصفحك |
| **الأفاتار لا يظهر / يظهر متقطع** | تأكد من تثبيت أحدث تعريفات لكرت الشاشة، وخالّص البرامج اللي بتستهلك كرت الشاشة كتير |
| **الميكروفون لا يعمل** | تأكد من السماح بالإذن، وتأكد أن الميكروفون مشغول على برنامج تاني. جرب الكتابة في لوحة الشات بدلاً من الصوت |
| **npm install بياخد وقت طويل** | طبيعي أول مرة! لو وقف في النص، جرب `npm cache clean --force` ثم اعمل التثبيت مرة أخرى |
| **npm run dev بيعطيك خطأ EADDRINUSE** | المنفذ 3000 مشغول — غير البورت في `vite.config.js` أو أوقف البرنامج اللي بيستخدمه |
| **الطقس لا يعمل** | تأكد من اتصال الإنترنت — خدمة الطقس مجانية عبر Open-Meteo ولا تحتاج مفتاح |
| **الأغاني لا تشتغل** | بعض المتصفحات تمنع الصوت التلقائي — اضغط أي مكان في الصفحة أولاً لتفعيل السياق الصوتي |

---

## ✨ Features (English Summary)

### 🎨 Visual & 3D
- **25,000 Particle Face**: Procedurally generated avatar using ShaderMaterial, organized into facial regions (cranium, eyes, nose, lips, jaw, cheeks, chin)
- **Dynamic State Animations**: Idle / Listening / Thinking / Speaking states with unique visual feedback
- **Shader-Powered Glow**: Real-time glow intensity driven by avatar state
- **Interactive Orbit Controls**: Smooth camera zoom, rotation, and auto-rotate during Thinking state
- **Deep Navy-Teal Aesthetic**: Cyan (#00e5ff) particles on a gradient foggy background with infinite grid floor

### 🎙️ Audio & Voice
- **Voice Activity Detection (VAD)**: Real-time speech detection from microphone
- **Bilingual Speech Recognition**: Automatic Arabic / English language detection and transcription
- **Text-to-Speech**: Natural speech output in both Arabic and English
- **Lip-Sync Animation**: Particle mouth movements synced to TTS audio amplitude
- **Ambient Music**: Atmospheric background music with smart ducking during voice interactions
- **Music Player**: Search, play, pause, skip songs; auto-ducks ambient music when user music plays
- **Live Audio Visualizer**: Waveform + frequency spectrum visualizer

### 🧠 AI Assistant (Hummus)
- **Bilingual Chat**: Fluent Arabic and English responses; auto-detects user language
- **Weather Integration**: Live weather for any city via **Open-Meteo** (100% free, no API key!)
- **Music Control**: Voice commands to play/search/pause/skip songs (built-in procedural song library — no API key!)
- **Local Intent Detection**: Keyword-based routing (no API call needed for basic commands)
- **Fallback Mode**: Works without API key using local rule-based responses
- **Conversation History**: Retains context up to 20 messages
- **Streaming Support**: Optional chunked streaming responses

### 🖥️ UI Overlay
- **Avatar Status Panel**: Real-time state indicator
- **Performance Panel**: Live FPS counter + particle count (25,000)
- **Lip-Sync Control Toggle**: Enable/disable lip animation
- **Mic Input Toggle**: Microphone on/off switch
- **Ambient Music Toggle**: Background music control
- **Features & States Panels**: Visual reference of capabilities
- **Chat Panel**: Text message input with full conversation history
- **API Key Modal**: Secure local storage of OpenRouter API key

---

## 🛠️ Tech Stack

| Category | Libraries |
|---|---|
| **Frontend** | React 18, Vite 5 |
| **3D Rendering** | Three.js 0.160, @react-three/fiber 8, @react-three/drei 9 |
| **Shaders** | Custom GLSL ShaderMaterial (vertex + fragment) |
| **Audio** | Web Audio API (AudioContext, AnalyserNode, GainNode) |
| **Speech** | Web Speech API (SpeechRecognition + SpeechSynthesis) |
| **AI** | OpenRouter API (gpt-3.5-turbo default, customizable) — *optional* |
| **Weather** | **Open-Meteo** (FREE, no API key required) |
| **Styling** | Inline CSS with CSS animations, no external CSS framework |

---

## 📦 Installation (English)

### Prerequisites
- Node.js **18+** (LTS recommended)
- npm / yarn / pnpm
- Modern browser with WebGL 2.0 support
- Microphone (for voice input — optional but recommended)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (optional — only needed for advanced AI chat)
#    Copy .env.example to .env and fill in your OpenRouter API key
cp .env.example .env   # (on Windows: copy .env.example .env)

# 3. Start the development server (runs on port 3000)
npm run dev

# 4. Build for production (outputs to /dist)
npm run build

# 5. Preview production build locally
npm run preview
```

---

## 🔑 Configuration — API Keys

The app works **fully functional** without any API keys! Weather (Open-Meteo) and the built-in music library require zero configuration.

An API key is **only needed** if you want to use advanced AI chat powered by OpenRouter LLMs.

### Method 1: In-App Modal (Recommended)
1. Launch the app → click **GET STARTED**
2. Click the **API Key** button (🔑) in the UI overlay
3. Paste your OpenRouter API key → **Save**
4. Key is stored securely in `localStorage` (never sent anywhere except directly to OpenRouter)

### Method 2: Environment Variables
Create a `.env` file in the project root:

```env
# OpenRouter API key — OPTIONAL, for advanced AI chat only
# Get one free at: https://openrouter.ai/keys
VITE_OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxx

# NOTE: Weather uses Open-Meteo — no API key required, 100% free!
# NOTE: Music has a built-in library — no API keys required!
```

> ⚠️ **Security Note**: Vite environment variables are bundled into the client build. For production use, consider proxying API calls through a backend server.

---

## 📁 Project Structure

```
dd/
├── index.html                    # Vite HTML entry
├── package.json                  # Dependencies & scripts
├── vite.config.js                # Vite configuration (port 3000, host: true)
├── .env.example                  # Environment variable template
│
└── src/
    ├── main.jsx                  # React DOM entry point
    ├── App.jsx                   # Main app: state orchestration, Canvas, UI
    ├── index.css                 # Global base styles
    │
    ├── components/
    │   ├── ParticleFace.jsx      # 25,000 particle avatar (geometry + shader)
    │   ├── UIOverlay.jsx         # Control panels, HUD, status indicators
    │   ├── ChatPanel.jsx         # Conversation chat UI + text input
    │   ├── AudioWave.jsx         # Waveform / frequency visualizer
    │   ├── ApiKeyModal.jsx       # API key entry modal
    │   └── shaders/
    │       └── faceShaders.js    # GLSL vertex + fragment shaders
    │
    └── services/                 # Singleton service classes
        ├── ai/
        │   └── OpenRouterService.js         # AI chat, tool calls, language detection
        ├── audio/
        │   └── AmbientMusicService.js       # Background music + audio ducking
        ├── music/
        │   └── MusicPlayerService.js        # Procedural song library (5 built-in songs)
        ├── speech/
        │   ├── BilingualSpeechService.js    # SpeechRecognition + SpeechSynthesis (AR/EN)
        │   └── VoiceActivityDetectionService.js  # Microphone VAD, amplitude, waveform
        ├── lip-sync/
        │   └── AudioLipSyncService.js       # Audio analyser → mouth amplitude
        └── weather/
            └── WeatherService.js            # Open-Meteo API (FREE, no key) + caching
```

---

## 🚀 Usage (English)

### Getting Started
1. Click **GET STARTED** on the welcome screen
2. Allow **microphone permission** when prompted (for voice commands)
3. The avatar initializes in **IDLE** state and starts ambient music

### Voice Commands (Examples)

| Category | English Examples | أمثلة عربية |
|---|---|---|
| **Greeting** | "Hello", "Hi there", "What's up?" | "مرحباً", "أهلاً", "إزيك؟" |
| **Who are you?** | "What's your name?", "Who are you?" | "ما اسمك؟", "مين إنت؟" |
| **Weather** | "Weather in London", "What's the temperature?" | "الطقس في القاهرة", "كم درجة الحرارة؟" |
| **Play Music** | "Play jazz music", "Play a song" | "شغلي أغنية عربية", "شغل موسيقى" |
| **Control Music** | "Pause", "Next song", "Stop music", "Resume" | "وقف", "التالي", "توقف الموسيقى", "استكمل" |
| **Help** | "What can you do?", "Help" | "ماذا تفعل؟", "مساعدة" |
| **Time/Date** | "What time is it?", "What's today?" | "كم الساعة؟", "اليوم إيه؟" |
| **Jokes** | "Tell me a joke", "Make me laugh" | "قول نكتة", "اضحكني" |

### Text Chat
- Click the **Chat Panel** on the right side
- Type any message and press **Enter** (or click Send)
- Avatar transitions to Thinking → Speaking, same as voice

### UI Controls
| Panel | Control | Effect |
|---|---|---|
| **Avatar Status** | State badge | Shows current state (IDLE/LISTENING/THINKING/SPEAKING) |
| **Performance** | FPS / 25,000 | Live frame rate + particle count |
| **Lip-Sync** | Toggle | Enable/disable mouth movement animation |
| **Mic Input** | Toggle | Enable/disable microphone listening |
| **Ambient Music** | Toggle | Turn background music on/off |
| **API Key** | 🔑 Button | Open modal to save/update OpenRouter key |

---

## 🎛️ Services Deep Dive

### OpenRouterService
Handles all AI interaction:
- `chat(userMessage, options)` — Full chat completion with history
- `streamChat(userMessage, onChunk, options)` — Streaming responses
- `detectLanguage(text)` — Arabic/English detection via Unicode ranges
- `detectIntentLocally(userMessage, lang)` — Keyword-based routing (weather/music/chat)
- `parseToolCallsFromText(text)` — Extracts `<<<TOOL_START>>>...<<<TOOL_END>>>` JSON blocks
- `getFallbackResponse(userMessage, lang)` — Local rule-based responses (no API key needed)

### VoiceActivityDetectionService
Microphone processing pipeline:
- `init(audioContext)` — Request mic, create AnalyserNode
- `onSpeechStart` / `onSpeechEnd` — State machine callbacks
- `onAudioLevel(vol, freq, combined)` — Raw amplitude for visualizers
- `onWaveform(wf, fd, vol)` — Uint8Array time-domain + frequency data

### WeatherService
Powered by **Open-Meteo** (100% free, no API key):
- `geocodeCity(cityName)` — Convert city name → latitude/longitude
- `getCurrentWeather(city, lang)` — Current temp, humidity, wind, weather code, daily min/max
- `formatWeatherReport(data, lang)` — Human-readable AR/EN weather summary
- Built-in caching (10 minutes) to reduce API calls
- Default city: **Cairo / القاهرة** if none specified

### MusicPlayerService
Built-in procedural song library (5 songs across genres):
- **Calm Sunrise** (Ambient) — keywords: calm, relax, هادئ, استرخاء
- **Electric Dreams** (Electronic/Synthwave) — keywords: dance, party, رقص, حفلة
- **Neel Waraq** (Arabic/Oriental) — keywords: عربي, نيل, مصرى, تراب
- **Midnight Jazz** (Jazz/Blues) — keywords: jazz, blues, جاز, بليز
- **Classic Serenade** (Classical/Piano) — keywords: classical, piano, كلاسيكى, بيانو
- `playSong(query)` — Fuzzy search by keyword/genre/mood
- `pause()` / `resume()` / `stop()` / `next()` / `previous()` — Playback controls
- Smart ducking: automatically lowers volume when Hummus speaks

---

## 🎨 Customization Guide

### Change Particle Count
Edit [ParticleFace.jsx](src/components/ParticleFace.jsx#L6):
```javascript
const PARTICLE_COUNT = 25000;  // Adjust (keep between 5k-100k for perf)
```

### Change Color Theme
Edit [faceShaders.js](src/components/shaders/faceShaders.js) — look for:
- Particle base color (`#00e5ff`)
- Glow color uniforms
Edit [App.jsx](src/App.jsx#L575-L580) for the background gradient.

### Change AI Model
Edit [OpenRouterService.js](src/services/ai/OpenRouterService.js#L5):
```javascript
this.defaultModel = 'openai/gpt-3.5-turbo';  // Any OpenRouter model
```
See [OpenRouter Models](https://openrouter.ai/models) for available options.

### Adjust Facial Regions
In [ParticleFace.jsx](src/components/ParticleFace.jsx#L35-L48), modify `REGION_WEIGHTS` to change how particles are distributed across facial features.

---

## 📊 Performance Tips

- **Target**: 60 FPS at 25,000 particles (mid-range GPU)
- **Low-end devices**: Reduce `PARTICLE_COUNT` to 10,000–15,000
- **High-end GPUs**: Can push to 50,000–75,000 particles
- Keep DevTools closed for accurate FPS readings
- `powerPreference: 'high-performance'` is set on the WebGL context in [App.jsx](src/App.jsx#L600)

---

## 🧩 State Machine

```
IDLE ──(speech detected)──► LISTENING
  ▲                              │
  │                              │ (speech end + transcript)
  │                              ▼
  │                          THINKING ──(AI response ready)──► SPEAKING
  │                                                              │
  │                                                              │ (TTS end)
  └──────────────────────────────────────────────────────────────┘
```

Glow intensity per state:
- **IDLE**: 0.15 (subtle)
- **LISTENING**: 1.0 (bright pulse)
- **THINKING**: 0.6 + auto-rotate camera
- **SPEAKING**: 0.9 + lip-sync animation

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📜 License

MIT License — feel free to use this in personal and commercial projects.

---

## 🙏 Acknowledgements

- Inspired by **AVATARI.IO** particle avatar aesthetics
- Built with **React Three Fiber** ecosystem (@react-three/drei)
- Shader pipeline powered by Three.js **ShaderMaterial**
- Speech APIs via browser-native **Web Speech API**
- Audio graph via **Web Audio API**
- Weather data generously provided by **Open-Meteo** (open-source & free)
