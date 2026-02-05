import './App.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function extractBoldNumberedItems(text) {
  const pattern = /(\*\*\d+(?:\.\d+)*\*\*)/g
  const parts = String(text || '').split(pattern).map((p) => p.trim()).filter(Boolean)
  const items = []

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    if (pattern.test(part)) {
      const label = part.replace(/\*\*/g, '')
      const body = parts[i + 1] && !pattern.test(parts[i + 1]) ? parts[i + 1] : ''
      items.push({ label, body })
      if (body) i += 1
    }
  }

  return items.length > 1 ? items : null
}

function extractJsonPayload(text) {
  const raw = String(text || '').trim()
  if (!raw) return null

  const tryParse = (candidate) => {
    if (!candidate) return null
    try {
      return JSON.parse(candidate)
    } catch {
      return null
    }
  }

  const fenced = raw.match(/```json\s*([\s\S]*?)\s*```/i) || raw.match(/```\s*([\s\S]*?)\s*```/i)
  if (fenced && fenced[1]) {
    const parsed = tryParse(fenced[1])
    if (parsed) return parsed
  }

  if ((raw.startsWith('{') && raw.endsWith('}')) || (raw.startsWith('[') && raw.endsWith(']'))) {
    const parsed = tryParse(raw)
    if (parsed) return parsed
  }

  const start = raw.search(/[\[{]/)
  if (start === -1) return null
  const open = raw[start]
  const close = open === '{' ? '}' : ']'
  let depth = 0
  let inString = false
  let escaped = false

  for (let i = start; i < raw.length; i++) {
    const ch = raw[i]
    if (inString) {
      if (escaped) {
        escaped = false
      } else if (ch === '\\') {
        escaped = true
      } else if (ch === '"') {
        inString = false
      }
      continue
    }

    if (ch === '"') {
      inString = true
      continue
    }

    if (ch === open) depth += 1
    if (ch === close) depth -= 1
    if (depth === 0) {
      const candidate = raw.slice(start, i + 1)
      return tryParse(candidate)
    }
  }

  return null
}

function renderStructuredPayload(payload) {
  if (!payload || typeof payload !== 'object') return null

  if (Array.isArray(payload)) {
    if (payload.length && payload.every((row) => row && typeof row === 'object')) {
      const headers = Object.keys(payload[0] || {})
      if (!headers.length) return null
      return (
        <table className="formattedTable">
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payload.map((row, idx) => (
              <tr key={idx}>
                {headers.map((h) => (
                  <td key={h}>{String(row?.[h] ?? '')}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )
    }
  }

  if (payload.table && typeof payload.table === 'object') {
    const headers = Array.isArray(payload.table.headers) ? payload.table.headers : []
    const rows = Array.isArray(payload.table.rows) ? payload.table.rows : []
    if (headers.length && rows.length) {
      return (
        <table className="formattedTable">
          <thead>
            <tr>
              {headers.map((h, idx) => (
                <th key={idx}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                {headers.map((_, hIdx) => (
                  <td key={hIdx}>{String(row?.[hIdx] ?? '')}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )
    }
  }

  if (Array.isArray(payload.rules)) {
    const rows = payload.rules.filter((r) => r && typeof r === 'object')
    if (rows.length) {
      const normalizeKey = (key) => String(key || '').trim()
      const prettyLabel = (key) =>
        normalizeKey(key)
          .replace(/[_-]+/g, ' ')
          .replace(/\s+/g, ' ')
          .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase())

      const firstKeys = Object.keys(rows[0] || {})
      const preferred = ['rule_no', 'regulation']
      const orderedKeys = preferred.filter((k) => firstKeys.includes(k))
      const remaining = firstKeys.filter((k) => !orderedKeys.includes(k))
      const headers = [...orderedKeys, ...remaining].map(normalizeKey).filter(Boolean)

      return (
        <table className="formattedTable">
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h}>{prettyLabel(h)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                {headers.map((h) => (
                  <td key={h}>{String(row?.[h] ?? '')}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )
    }
  }

  return null
}

function renderMarkdown(text) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]}>{String(text || '')}</ReactMarkdown>
}

function extractLineItems(text) {
  const lines = String(text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (!lines.length) return null

  const numbered = lines.every((l) => /^\d+\.\s+/.test(l))
  if (numbered) {
    return { type: 'ol', items: lines.map((l) => l.replace(/^\d+\.\s+/, '')) }
  }

  const bulleted = lines.every((l) => /^[-*•]\s+/.test(l))
  if (bulleted) {
    return { type: 'ul', items: lines.map((l) => l.replace(/^[-*•]\s+/, '')) }
  }

  return null
}

function renderMessageText(role, text) {
  if (role !== 'assistant') return text

  const payload = extractJsonPayload(text)
  if (payload) {
    const table = renderStructuredPayload(payload)
    if (table) {
      const display = payload.display_text || payload.displayText || payload.message || ''
      return (
        <div className="structuredBlock">
          {display ? <div className="structuredIntro">{renderMarkdown(display)}</div> : null}
          {table}
        </div>
      )
    }
  }

  const boldItems = extractBoldNumberedItems(text)
  if (boldItems) {
    return (
      <ul className="formattedList">
        {boldItems.map((item, idx) => (
          <li key={idx}>
            <strong>{item.label}</strong>{item.body ? ` ${item.body}` : ''}
          </li>
        ))}
      </ul>
    )
  }

  const lineItems = extractLineItems(text)
  if (lineItems) {
    const ListTag = lineItems.type === 'ol' ? 'ol' : 'ul'
    return (
      <ListTag className="formattedList">
        {lineItems.items.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ListTag>
    )
  }

  return renderMarkdown(text)
}

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
  const [conversations, setConversations] = useState([])
  const [currentConvId, setCurrentConvId] = useState(null)
  const [threadId, setThreadId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [providerID, setProviderID] = useState('')
  const [modelID, setModelID] = useState('')
  const [modelsPayload, setModelsPayload] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [abortController, setAbortController] = useState(null)
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

  function stopGeneration() {
    if (abortController) {
      abortController.abort()
      setAbortController(null)
      setLoading(false)
    }
  }

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    setError('')
    setInput('')

    const optimisticUser = { role: 'user', text }
    const assistantIdx = messages.length + 1
    const newMessages = [...messages, optimisticUser, { role: 'assistant', text: '', tools: [] }]
    setMessages(newMessages)
    setLoading(true)

    // Create conversation if new
    if (!currentConvId && messages.length === 0) {
      const convId = Date.now().toString()
      const title = text.slice(0, 40) + (text.length > 40 ? '...' : '')
      setCurrentConvId(convId)
      setConversations((prev) => [{ id: convId, title, timestamp: new Date() }, ...prev])
    }

    const controller = new AbortController()
    setAbortController(controller)

    try {
      const body = { threadId, message: text, mode: 'ask' }

      if (providerID && modelID) body.model = { providerID, modelID }
      body.agent = 'general'

      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
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
        if (evt?.type === 'tool' && evt.tool) {
          setMessages((m) => {
            const next = [...m]
            const cur = next[assistantIdx]
            if (!cur) return next
            const tools = Array.isArray(cur.tools) ? [...cur.tools] : []
            const idx = tools.findIndex((t) => t.callId && t.callId === evt.callId)
            const payload = {
              callId: evt.callId,
              tool: evt.tool,
              status: evt.status || 'unknown',
              title: evt.title || '',
            }
            if (idx >= 0) {
              tools[idx] = { ...tools[idx], ...payload }
            } else {
              tools.push(payload)
            }
            next[assistantIdx] = { ...cur, tools }
            return next
          })

          if (evt.status === 'completed' || evt.status === 'error') {
            const callId = evt.callId
            setTimeout(() => {
              setMessages((m) => {
                const next = [...m]
                const cur = next[assistantIdx]
                if (!cur || !Array.isArray(cur.tools)) return next
                next[assistantIdx] = {
                  ...cur,
                  tools: cur.tools.filter((t) => t.callId !== callId),
                }
                return next
              })
            }, 2000)
          }
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
    } if (e.name === 'AbortError') {
        setMessages((m) => {
          const next = [...m]
          if (next[assistantIdx]) next[assistantIdx] = { ...next[assistantIdx], text: (next[assistantIdx].text || '') + '\n\n_Generation stopped._' }
          return next
        })
      } else {
        setError(String(e?.message || e))
        setMessages((m) => {
          const next = [...m]
          if (next[assistantIdx]) next[assistantIdx] = { ...next[assistantIdx], text: 'Sorry — something went wrong.' }
          return next
        })
      }
    } finally {
      setLoading(false)
      setAbortController(null)
    }
  }
aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebarHeader">
          <button className="btn newChatBtn" onClick={newChat} disabled={loading}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New chat
          </button>
          <button className="btn iconBtn" onClick={() => setSidebarOpen(false)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </div>

        <div className="chatHistory">
          {conversations.length === 0 ? (
            <div className="emptyHistory">No conversations yet</div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`historyItem ${currentConvId === conv.id ? 'active' : ''}`}
                onClick={() => loadConversation(conv.id)}
              >
                <div className="historyTitle">{conv.title}</div>
                <button className="deleteBtn" onClick={(e) => deleteConversation(conv.id, e)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        <div className="sidebarFooterId, e) {
    e.stopPropagation()
    setConversations((prev) => prev.filter((c) => c.id !== convId))
    if (currentConvId === convId) {
      newChat()
    }[])
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
div>
      </aside>

      <main className="main">
        {!sidebarOpen && (
          <button className="openSidebarBtn" onClick={() => setSidebarOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
        )}
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
          </label>avatar">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                    </svg>
                  </div>
                  <div className="text">Thinking...</div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="composerWrapper">
            {loading && (
              <button className="btn stopBtn" onClick={stopGeneration}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
                Stop generating
              </button>
            )}
            <form
              className="composer"
              onSubmit={(e) => {
                e.preventDefault()
                send()
              }}
            >
              <textarea
                className="composerInput"
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message OpenCode..."
                disabled={loading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send()
                  }
                }}
              />
              <button className="btn sendBtn" type="submit" disabled={loading || !input.trim()}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </button>
            </form>
          </divsages.map((m, idx) => (
              <div key={idx} className={`msg ${m.role === 'user' ? 'user' : 'assistant'}`}>
                <div className="bubble">
                  <div className="text">{renderMessageText(m.role, m.text)}</div>
                    {m.role === 'assistant' && Array.isArray(m.tools) && m.tools.length ? (
                      <div className="toolCalls">
                        <div className="toolCallsTitle">Tools</div>
                        <div className="toolCallsList">
                          {m.tools.map((t, tIdx) => (
                            <div key={`${t.callId || tIdx}`} className={`toolCall ${t.status || 'unknown'}`}>
                              <span className="toolName">{t.tool}</span>
                              {t.title ? <span className="toolTitle">{t.title}</span> : null}
                              <span className="toolStatus">{t.status || 'unknown'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
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
