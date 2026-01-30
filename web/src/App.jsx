import './App.css'
import { useEffect, useMemo, useRef, useState } from 'react'

function useAutoScroll(dep) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [dep])
  return ref
}

function normalizeProviders(providersPayload) {
  const providers = providersPayload?.providers
  const defaults = providersPayload?.default
  if (!Array.isArray(providers)) return { providers: [], defaults: null }
  return { providers, defaults: defaults && typeof defaults === 'object' ? defaults : null }
}

function readNdjsonLines(reader) {
  const decoder = new TextDecoder()
  let buffer = ''

  return {
    async *[Symbol.asyncIterator]() {
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        while (true) {
          const idx = buffer.indexOf('\n')
          if (idx === -1) break
          const line = buffer.slice(0, idx).trim()
          buffer = buffer.slice(idx + 1)
          if (!line) continue
          try {
            yield JSON.parse(line)
          } catch {
            // ignore bad line
          }
        }
      }

      const tail = buffer.trim()
      if (tail) {
        try {
          yield JSON.parse(tail)
        } catch {
          // ignore
        }
      }
    },
  }
}

function parseKeyValueLines(text) {
  const out = {}
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  for (const line of lines) {
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const k = line.slice(0, eq).trim()
    const v = line.slice(eq + 1).trim()
    if (!k) continue
    out[k] = v
  }
  return out
}

function App() {
  const [threadId, setThreadId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [providerID, setProviderID] = useState('')
  const [modelID, setModelID] = useState('')
  const [modelsPayload, setModelsPayload] = useState(null)
  // Agent mode is supported by the backend, but the UI intentionally hides it.

  const scrollRef = useAutoScroll(messages.length + (loading ? 1 : 0))
  const providerInfo = useMemo(() => normalizeProviders(modelsPayload), [modelsPayload])

  const providerOptions = useMemo(() => {
    return (providerInfo.providers || [])
      .map((p) => ({ id: p?.id, name: p?.name || p?.id }))
      .filter((p) => p.id)
  }, [providerInfo])

  const modelOptions = useMemo(() => {
    const p = (providerInfo.providers || []).find((x) => x?.id === providerID)
    const models = p?.models
    if (!models) return []
    const list = Array.isArray(models) ? models : Object.values(models)
    return list.map((m) => ({ id: m?.id, name: m?.name || m?.id })).filter((m) => m.id)
  }, [providerInfo, providerID])

  useEffect(() => {
    let ignore = false
    ;(async () => {
      try {
        const res = await fetch('/api/models')
        const json = await res.json()
        if (ignore) return
        if (!json?.ok) throw new Error(json?.error || 'Failed to load models')
        setModelsPayload(json.providers)

        // Pick defaults if present.
        const defaults = json.providers?.default
        if (defaults && typeof defaults === 'object') {
          const preferredProvider = defaults.opencode ? 'opencode' : null
          const [p, m] = preferredProvider
            ? [preferredProvider, defaults[preferredProvider]]
            : (Object.entries(defaults)[0] || [])
          if (p && m) {
            setProviderID(p)
            setModelID(String(m))
          }
        }
      } catch (e) {
        if (!ignore) setError(String(e?.message || e))
      }
    })()
    return () => {
      ignore = true
    }
  }, [])


  // Agents are still supported by the backend, but the UI intentionally hides them.

  useEffect(() => {
    // If provider changes and model isn't in that provider, reset model.
    if (!providerID) return
    if (!modelID) return
    if (!modelOptions.some((m) => m.id === modelID)) setModelID('')
  }, [providerID, modelID, modelOptions])

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    setError('')
    setInput('')

    const optimisticUser = { role: 'user', text }
    const assistantIdx = messages.length + 1
    setMessages((m) => [...m, optimisticUser, { role: 'assistant', text: '' }])
    setLoading(true)

    try {
      const body = { threadId, message: text, mode: 'ask' }

      if (providerID && modelID) body.model = { providerID, modelID }
      body.agent = 'general'

      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok || !res.body) {
        const t = await res.text().catch(() => '')
        throw new Error(t || `HTTP ${res.status}`)
      }

      const reader = res.body.getReader()
      for await (const evt of readNdjsonLines(reader)) {
        if (evt?.type === 'meta' && evt.threadId) {
          if (!threadId) setThreadId(evt.threadId)
        }
        if (evt?.type === 'delta' && typeof evt.text === 'string') {
          setMessages((m) => {
            const next = [...m]
            if (!next[assistantIdx]) return next
            next[assistantIdx] = { ...next[assistantIdx], text: (next[assistantIdx].text || '') + evt.text }
            return next
          })
        }
        if (evt?.type === 'assistant_error' && evt.error) {
          const msg =
            evt.error?.data?.message ||
            evt.error?.message ||
            (typeof evt.error === 'string' ? evt.error : null) ||
            'Provider/agent error'
          setError(msg)
        }
        if (evt?.type === 'error') {
          throw new Error(evt.error || 'Chat failed')
        }
        if (evt?.type === 'done') {
          break
        }
      }

      // If we ended with no text, show placeholder.
      setMessages((m) => {
        const next = [...m]
        const cur = next[assistantIdx]
        if (cur && !String(cur.text || '').trim()) {
          next[assistantIdx] = { ...cur, text: '(no text response)' }
        }
        return next
      })
    } catch (e) {
      setError(String(e?.message || e))
      setMessages((m) => {
        const next = [...m]
        if (next[assistantIdx]) next[assistantIdx] = { ...next[assistantIdx], text: 'Sorry — something went wrong.' }
        return next
      })
    } finally {
      setLoading(false)
    }
  }

  function newChat() {
    setThreadId(null)
    setMessages([])
    setError('')
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="dot" />
          <div>
            <div className="title">OpenCode Chat</div>
            <div className="subtitle">Simple local UI</div>
          </div>
        </div>

        <div className="controls">
          <button className="btn" onClick={newChat} disabled={loading}>
            New chat
          </button>
        </div>
      </header>

      <main className="main">
        <aside className="settings">
          <div className="panelTitle">Settings</div>

          <label className="field">
            <div className="label">Provider</div>
            <select
              className="select"
              value={providerID}
              onChange={(e) => setProviderID(e.target.value)}
              disabled={loading}
            >
              <option value="">(default)</option>
              {providerOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <div className="label">Model</div>
            <select
              className="select"
              value={modelID}
              onChange={(e) => setModelID(e.target.value)}
              disabled={loading || !providerID}
            >
              <option value="">(default)</option>
              {modelOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>

          {error ? <div className="error">{error}</div> : null}
        </aside>

        <section className="chat">
          <div className="messages" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="empty">
                <div className="emptyTitle">Start a chat</div>
                <div className="emptyHint">Type a message below. The backend talks to OpenCode via the SDK.</div>
              </div>
            ) : null}

            {messages.map((m, idx) => (
              <div key={idx} className={`msg ${m.role === 'user' ? 'user' : 'assistant'}`}>
                <div className="bubble">
                  <div className="role">{m.role === 'user' ? 'You' : 'Assistant'}</div>
                  <div className="text">{m.text}</div>
                </div>
              </div>
            ))}

            {loading ? (
              <div className="msg assistant">
                <div className="bubble">
                  <div className="role">Assistant</div>
                  <div className="text">Streaming…</div>
                </div>
              </div>
            ) : null}
          </div>

          <form
            className="composer"
            onSubmit={(e) => {
              e.preventDefault()
              send()
            }}
          >
            <textarea
              className="composerInput"
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message"
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
            />
            <button className="btn primary" type="submit" disabled={loading || !input.trim()}>
              Send
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}

export default App
