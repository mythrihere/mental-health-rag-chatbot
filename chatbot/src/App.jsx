import { useState, useRef, useEffect } from "react"
import botAvatar from "C:/Users/91914/Downloads/Gemini_Generated_Image_r5e8bgr5e8bgr5e8.png"
// data for quiz
const quiz = [
  {
    q: "When you have a big deadline, you usually...",
    options: [
      { text: "Start early and plan everything", type: "A" },
      { text: "Wait till the last minute but pull through", type: "B" },
      { text: "Panic quietly and push through", type: "C" },
      { text: "Ask for help or an extension", type: "D" },
    ]
  },
  {
    q: "When you're stressed, your body tells you by...",
    options: [
      { text: "Headaches or tight shoulders", type: "A" },
      { text: "Can't sleep or sleep too much", type: "B" },
      { text: "Eating more or not at all", type: "C" },
      { text: "Just feeling numb or zoned out", type: "D" },
    ]
  },
  {
    q: "Your go-to way to decompress is...",
    options: [
      { text: "Exercise or a walk", type: "A" },
      { text: "Music, shows, or gaming", type: "B" },
      { text: "Talking to someone", type: "C" },
      { text: "Alone time and silence", type: "D" },
    ]
  },
  {
    q: "You feel most anxious when...",
    options: [
      { text: "Things are out of your control", type: "A" },
      { text: "You've let someone down", type: "B" },
      { text: "You don't know what's coming next", type: "C" },
      { text: "You've been ignoring your own needs", type: "D" },
    ]
  },
]

const results = {
  A: { type: "The Planner", emoji: "📋", desc: "You cope by taking control. Structure helps you — but remember it's okay when things don't go to plan." },
  B: { type: "The Adapter", emoji: "🌊", desc: "You're flexible and handle pressure well in the moment. Watch out for building up stress over time." },
  C: { type: "The Feeler", emoji: "💛", desc: "You process stress emotionally and physically. Being aware of your body's signals is your superpower." },
  D: { type: "The Recharger", emoji: "🔋", desc: "You need space to process. Alone time is healthy — just make sure you're not isolating when things get hard." },
}

function getResult(answers) {
  const count = { A: 0, B: 0, C: 0, D: 0 }
  answers.forEach(a => count[a]++)
  return Object.entries(count).sort((x, y) => y[1] - x[1])[0][0]
}

function PersonalityQuiz({ onDone }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState([])
  const [result, setResult] = useState(null)

  function pick(type) {
    const next = [...answers, type]
    if (step + 1 < quiz.length) {
      setAnswers(next)
      setStep(step + 1)
    } else {
      setResult(getResult(next))
    }
  }

  if (result) {
    const r = results[result]
    return (
      <div style={qs.card}>
        <div style={qs.resultEmoji}>{r.emoji}</div>
        <div style={qs.resultType}>You're {r.type}</div>
        <div style={qs.resultDesc}>{r.desc}</div>
        <button style={qs.doneBtn} onClick={onDone}>Got it ✓</button>
      </div>
    )
  }

  const current = quiz[step]
  return (
    <div style={qs.card}>
      <div style={qs.label}>While you wait · Stress Quiz {step + 1}/{quiz.length}</div>
      <div style={qs.progress}>
        <div style={{ ...qs.progressFill, width: `${((step) / quiz.length) * 100}%` }} />
      </div>
      <div style={qs.question}>{current.q}</div>
      <div style={qs.options}>
        {current.options.map((o, i) => (
          <button key={i} style={qs.optBtn} onClick={() => pick(o.type)}>
            {o.text}
          </button>
        ))}
      </div>
    </div>
  )
}

function App() {
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hi! I'm your Mental Health Research Assistant. Ask me anything about stress, sleep, anxiety, or burnout based on the loaded research papers." }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  async function sendMessage() {
    if (!input.trim() || loading) return
    const userText = input
    setMessages(prev => [...prev, { role: "user", text: userText }])
    setInput("")
    setLoading(true)
    setShowQuiz(true)

    try {
      const response = await fetch("http://localhost:8000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: userText })
      })
      const data = await response.json()
      setMessages(prev => [...prev, { role: "bot", text: data.answer }])
    } catch {
      setMessages(prev => [...prev, { role: "bot", text: "Something went wrong. Make sure the server is running." }])
    }

    setLoading(false)
    setShowQuiz(false)
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) sendMessage()
  }

  return (
    <div style={s.page}>
      <div style={s.window}>

        {/* header */}
        <div style={s.header}>
          <img src={botAvatar} alt="bot" style={s.headerAvatar} />
          <div>
            <div style={s.headerTitle}>Mental Health Research Bot</div>
            <div style={s.headerSub}>Powered by research papers · Local AI</div>
          </div>
          <div style={s.onlineBadge}>● Online</div>
        </div>

        {/* chat */}
        <div style={s.chat}>
          {messages.map((msg, i) => (
            <div key={i} style={msg.role === "user" ? s.userRow : s.botRow}>
              {msg.role === "bot" && (
                <img src={botAvatar} alt="bot" style={s.avatar} />
              )}
              <div style={msg.role === "user" ? s.userBubble : s.botBubble}>
                {msg.text}
              </div>
              {msg.role === "user" && (
                <div style={s.avatarUser}>You</div>
              )}
            </div>
          ))}

          {/* quiz appears while the the model's thinking */}
          {loading && showQuiz && (
            <div style={s.botRow}>
              <img src={botAvatar} alt="bot" style={s.avatar} />
              <PersonalityQuiz onDone={() => setShowQuiz(false)} />
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Displaying suggestions */}
        {messages.length === 1 && (
          <div style={s.suggestions}>
            {["How to manage stress?", "Tips for better sleep", "Signs of burnout", "Breathing for anxiety"].map((q, i) => (
              <button key={i} style={s.suggBtn} onClick={() => setInput(q)}>
                {q}
              </button>
            ))}
          </div>
        )}

        {/* giving input */}
        <div style={s.inputArea}>
          <input
            style={s.input}
            type="text"
            placeholder="Ask about mental health..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={loading}
          />
          <button style={loading ? s.btnDisabled : s.btn} onClick={sendMessage} disabled={loading}>
            {loading ? "Thinking..." : "Send →"}
          </button>
        </div>

      </div>
    </div>
  )
}
//styling part
const s = {
  page: { minHeight: "100vh", background: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', sans-serif", padding: "20px" },
  window: { width: "100%", maxWidth: "720px", background: "#13131f", borderRadius: "20px", border: "1px solid #2a2a3f", boxShadow: "0 25px 60px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column", height: "88vh", overflow: "hidden" },
  header: { padding: "14px 20px", background: "linear-gradient(90deg, #1e1e35, #16213e)", borderBottom: "1px solid #2a2a3f", display: "flex", alignItems: "center", gap: "12px" },
  headerAvatar: { width: "42px", height: "42px", borderRadius: "50%", objectFit: "cover", border: "2px solid #6366f1" },
  headerTitle: { color: "#ffffff", fontWeight: "600", fontSize: "15px" },
  headerSub: { color: "#6b7280", fontSize: "11px", marginTop: "2px" },
  onlineBadge: { marginLeft: "auto", color: "#34d399", fontSize: "11px", background: "#0d2d1f", padding: "4px 10px", borderRadius: "20px", border: "1px solid #065f46" },
  chat: { flex: 1, overflowY: "auto", padding: "20px 18px", display: "flex", flexDirection: "column", gap: "14px" },
  botRow: { display: "flex", alignItems: "flex-end", gap: "8px" },
  userRow: { display: "flex", alignItems: "flex-end", justifyContent: "flex-end", gap: "8px" },
  avatar: { width: "34px", height: "34px", borderRadius: "50%", objectFit: "cover", border: "2px solid #6366f1", flexShrink: 0 },
  avatarUser: { fontSize: "10px", color: "#6b7280", marginBottom: "2px", flexShrink: 0 },
  botBubble: { background: "#1e1e35", border: "1px solid #2a2a4f", color: "#e2e8f0", padding: "12px 16px", borderRadius: "18px 18px 18px 4px", fontSize: "13.5px", lineHeight: "1.7", maxWidth: "78%", whiteSpace: "pre-wrap" },
  userBubble: { background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "#ffffff", padding: "12px 16px", borderRadius: "18px 18px 4px 18px", fontSize: "13.5px", lineHeight: "1.7", maxWidth: "78%" },
  suggestions: { display: "flex", gap: "8px", padding: "0 18px 14px", flexWrap: "wrap" },
  suggBtn: { background: "transparent", border: "1px solid #2a2a4f", color: "#a5b4fc", padding: "6px 12px", borderRadius: "20px", fontSize: "12px", cursor: "pointer" },
  inputArea: { display: "flex", padding: "14px 16px", gap: "10px", borderTop: "1px solid #1e1e35", background: "#0f0f1a" },
  input: { flex: 1, background: "#1e1e35", border: "1px solid #2a2a4f", borderRadius: "12px", padding: "11px 16px", color: "#e2e8f0", fontSize: "13.5px", outline: "none" },
  btn: { background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "#fff", border: "none", borderRadius: "12px", padding: "11px 22px", fontSize: "13.5px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap" },
  btnDisabled: { background: "#2a2a4f", color: "#4b5563", border: "none", borderRadius: "12px", padding: "11px 22px", fontSize: "13.5px", fontWeight: "600", cursor: "not-allowed", whiteSpace: "nowrap" },
}

const qs = {
  card: { background: "#1a1a2e", border: "1px solid #312e81", borderRadius: "16px", padding: "18px", maxWidth: "400px", width: "100%" },
  label: { fontSize: "10px", color: "#818cf8", fontWeight: "600", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "8px" },
  progress: { height: "3px", background: "#2a2a4f", borderRadius: "2px", marginBottom: "14px", overflow: "hidden" },
  progressFill: { height: "100%", background: "linear-gradient(90deg, #6366f1, #8b5cf6)", borderRadius: "2px", transition: "width 0.3s" },
  question: { color: "#e2e8f0", fontSize: "14px", fontWeight: "500", lineHeight: "1.6", marginBottom: "14px" },
  options: { display: "flex", flexDirection: "column", gap: "8px" },
  optBtn: { background: "#13131f", border: "1px solid #2a2a4f", color: "#c7d2fe", padding: "10px 14px", borderRadius: "10px", fontSize: "12.5px", cursor: "pointer", textAlign: "left", transition: "all 0.15s" },
  resultEmoji: { fontSize: "36px", textAlign: "center", marginBottom: "8px" },
  resultType: { color: "#a5b4fc", fontSize: "16px", fontWeight: "700", textAlign: "center", marginBottom: "8px" },
  resultDesc: { color: "#94a3b8", fontSize: "13px", lineHeight: "1.6", textAlign: "center", marginBottom: "14px" },
  doneBtn: { width: "100%", background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "#fff", border: "none", borderRadius: "10px", padding: "10px", fontSize: "13px", fontWeight: "600", cursor: "pointer" },
}

export default App
