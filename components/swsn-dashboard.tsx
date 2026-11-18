'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Battery,
  Bell,
  Check,
  ChevronDown,
  Clock3,
  Compass,
  Download,
  Gauge,
  Radio,
  RefreshCw,
  Shield,
  Signal,
  Wifi,
  Wind,
} from 'lucide-react'

type Reading = {
  moisture: number
  vibration: number
  status: number
  time: string
}

const initialTrend = Array(24).fill(50)

function MoistureChart({ data }: { data: number[] }) {
  const points = data
    .map((value, index) => `${(index / (data.length - 1)) * 100},${100 - value}`)
    .join(' ')

  return (
    <div className="chart-wrap" aria-label="Soil moisture trend over the last 24 readings">
      <div className="chart-grid">
        <span>80%</span>
        <span>60%</span>
        <span>40%</span>
        <span>20%</span>
      </div>
      <svg
        className="trend-chart"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        role="img"
        aria-label="Moisture level is trending upward"
      >
        <defs>
          <linearGradient id="area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity=".2" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={`0,100 ${points} 100,100`} fill="url(#area)" />
        <polyline
          points={points}
          fill="none"
          stroke="#0ea5e9"
          strokeWidth="1.8"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="chart-times">
        <span>−2h</span>
        <span>−90m</span>
        <span>−60m</span>
        <span>−30m</span>
        <span>Now</span>
      </div>
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  unit,
  status,
  tone,
  footer,
}: {
  icon: typeof Activity
  label: string
  value: string
  unit?: string
  status: string
  tone: string
  footer: string
}) {
  return (
    <article className="metric-card">
      <div className="metric-top">
        <span className={`metric-icon ${tone}`}>
          <Icon size={18} strokeWidth={2} />
        </span>
        <span className="metric-label">{label}</span>
        <span className="metric-menu" aria-hidden="true">
          ···
        </span>
      </div>
      <div className="metric-number">
        {value}
        <span>{unit}</span>
      </div>
      <div className="metric-bottom">
        <span className={`status-pill ${tone}`}>
          <i /> {status}
        </span>
        <span className="metric-footnote">{footer}</span>
      </div>
    </article>
  )
}

export function SWSNDashboard() {
  const [reading, setReading] = useState<Reading>({
    moisture: 0,
    vibration: 0,
    status: 0,
    time: '—',
  })
  const [trend, setTrend] = useState<number[]>(initialTrend)
  const [updated, setUpdated] = useState(new Date())
  const [paused, setPaused] = useState(false)
  const [events, setEvents] = useState([
    {
      time: '—',
      title: 'Waiting for first reading',
      detail: 'Sensor node has not reported yet',
      type: 'info',
    },
  ])

  const isAlert = reading.status === 1 || reading.vibration > 0.7
  const moistureState =
    reading.moisture < 30 ? 'Dry' : reading.moisture > 75 ? 'Wet' : 'Moist'

  const timeLabel = useMemo(
    () =>
      updated.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    [updated]
  )

  // ========== REAL DATA FETCHING ==========
  useEffect(() => {
    if (paused) return

    const fetchLatest = async () => {
      try {
        const res = await fetch('/api/readings/latest')
        const json = await res.json()

        if (json.success && json.data) {
          const d = json.data

          setReading({
            moisture: Number(d.soil ?? 0),
            vibration: Number(d.vibration ?? 0),
            status: Number(d.status ?? 0),
            time: 'just now',
          })

          setTrend((prev) => [...prev.slice(1), Math.round(Number(d.soil ?? 50))])
          setUpdated(new Date())

          // Add event when status changes to alert
          if (d.status === 1) {
            setEvents((prev) => [
              {
                time: new Date().toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                }),
                title: 'Safety threshold exceeded',
                detail: `Soil: ${Number(d.soil).toFixed(1)}% · Vibration: ${d.vibration}`,
                type: 'alert',
              },
              ...prev,
            ])
          }
        }
      } catch (err) {
        console.error('Failed to fetch reading', err)
      }
    }

    // Fetch immediately
    fetchLatest()

    // Then poll every 4 seconds
    const timer = setInterval(fetchLatest, 4000)
    return () => clearInterval(timer)
  }, [paused])

  return (
    <main className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Activity size={22} />
          </div>
          <div>
            <strong>SWSN</strong>
            <span>FIELD OPERATIONS</span>
          </div>
        </div>

        <div className="workspace-label">WORKSPACE</div>
        <button className="site-select">
          <span className="site-dot" />
          <span>
            <b>North Ridge Mine</b>
            <small>Site · NR-01</small>
          </span>
          <ChevronDown size={16} />
        </button>

        <div className="nav-label">MONITORING</div>
        <nav aria-label="Main navigation" className="side-nav">
          <a className="nav-item active" href="#overview">
            <Gauge size={18} /> Overview <span className="nav-count">01</span>
          </a>
          <a className="nav-item" href="#readings">
            <Activity size={18} /> Sensor readings
          </a>
          <a className="nav-item" href="#events">
            <Bell size={18} /> Event log <span className="nav-alert">3</span>
          </a>
        </nav>

        <div className="sidebar-spacer" />

        <div className="sidebar-node">
          <div className="node-avatar">
            <Radio size={18} />
          </div>
          <div>
            <b>Gateway online</b>
            <span>GW-01 · Firmware 2.4.1</span>
          </div>
          <span className="online-dot" />
        </div>

        <div className="profile-row">
          <div className="profile-avatar">JM</div>
          <div>
            <b>Jordan Miller</b>
            <span>Safety operator</span>
          </div>
          <ChevronDown size={15} />
        </div>
      </aside>

      <section className="main-content" id="overview">
        <header className="topbar">
          <div className="breadcrumbs">
            North Ridge Mine <span>/</span> <b>Overview</b>
          </div>
          <div className="top-actions">
            <span className="today-label">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            <button className="icon-button" aria-label="Notifications">
              <Bell size={18} />
              <i />
            </button>
            <div className="top-avatar">JM</div>
          </div>
        </header>

        <div className="page-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <span className="live-pulse" /> LIVE MONITORING{' '}
                <span className="eyebrow-separator">/</span> ZONE A — LEVEL 03
              </div>
              <h1>Mine safety overview</h1>
              <p className="page-subtitle">
                Real-time environmental conditions across your monitored zone.
              </p>
            </div>

            <div className="heading-actions">
              <button
                className="outline-button"
                onClick={() => {
                  setPaused(!paused)
                  setUpdated(new Date())
                }}
              >
                <RefreshCw size={15} className={paused ? '' : 'spin-slow'} />
                {paused ? 'Resume live' : 'Live updates'}
                <span className={`toggle-dot ${paused ? 'off' : ''}`} />
              </button>

              <button
                className="primary-button"
                onClick={() => {
                  const content = `SWSN Mine Safety Report
Generated: ${new Date().toLocaleString()}
Moisture: ${reading.moisture.toFixed(1)}%
Vibration: ${reading.vibration}
Status: ${isAlert ? 'Alert' : 'Normal'}`
                  const link = document.createElement('a')
                  link.href = URL.createObjectURL(new Blob([content], { type: 'text/plain' }))
                  link.download = 'swsn-safety-report.txt'
                  link.click()
                  URL.revokeObjectURL(link.href)
                }}
              >
                <Download size={16} /> Export report
              </button>
            </div>
          </div>

          <div className="connection-strip">
            <div className="connection-main">
              <span className="connection-icon">
                <Wifi size={17} />
              </span>
              <span>
                <b>All systems operational</b>
                <small>Sensor network is reporting normally</small>
              </span>
            </div>
            <div className="connection-divider" />
            <div className="connection-detail">
              <span className="muted-label">LAST DATA SYNC</span>
              <b>{timeLabel}</b>
            </div>
            <div className="connection-detail">
              <span className="muted-label">ACTIVE NODES</span>
              <b>
                01 <small>/ 01</small>
              </b>
            </div>
            <div className="connection-detail connection-strength">
              <span className="muted-label">NETWORK</span>
              <b>
                <Signal size={15} /> Strong
              </b>
            </div>
          </div>

          <section className="metrics-grid" aria-label="Key sensor metrics">
            <MetricCard
              icon={Wind}
              label="Soil moisture"
              value={reading.moisture.toFixed(1)}
              unit="%"
              status={moistureState}
              tone="blue"
              footer="Target 30–75%"
            />
            <MetricCard
              icon={Activity}
              label="Vibration status"
              value={reading.vibration > 0 ? 'Detected' : 'Normal'}
              status={reading.vibration > 0 ? 'Review needed' : 'No activity'}
              tone={reading.vibration > 0 ? 'orange' : 'green'}
              footer="Digital sensor"
            />
            <MetricCard
              icon={Gauge}
              label="Vibration intensity"
              value={reading.vibration.toFixed(0)}
              unit=""
              status={reading.vibration > 0 ? 'Active' : 'Idle'}
              tone="orange"
              footer="0 = None · 1 = Detected"
            />
            <MetricCard
              icon={Shield}
              label="System status"
              value={isAlert ? 'Alert' : 'Normal'}
              status={isAlert ? 'Action required' : 'All clear'}
              tone={isAlert ? 'orange' : 'green'}
              footer="TinyML + Rules"
            />
          </section>

          {isAlert && (
            <div className="alert-banner" role="alert">
              <span className="alert-icon">
                <AlertTriangle size={20} />
              </span>
              <div>
                <b>Safety threshold exceeded</b>
                <span>An unusual sensor reading needs immediate review.</span>
              </div>
              <button
                onClick={() =>
                  setEvents([
                    {
                      time: timeLabel,
                      title: 'Safety threshold exceeded',
                      detail: 'Anomaly detected · Review sensor readings',
                      type: 'alert',
                    },
                    ...events,
                  ])
                }
              >
                Review alert <ArrowUpRight size={15} />
              </button>
            </div>
          )}

          <div className="content-grid" id="readings">
            <section className="panel readings-panel">
              <div className="panel-heading">
                <div>
                  <h2>Live sensor readings</h2>
                  <p>Node SN-01 · Chamber A-03</p>
                </div>
                <span className="live-tag">
                  <i /> LIVE
                </span>
              </div>

              <div className="readings-display">
                <div className="reading-block moisture-block">
                  <div className="reading-label">
                    <span className="reading-symbol blue-symbol">
                      <Wind size={16} />
                    </span>
                    SOIL MOISTURE
                  </div>
                  <div className="reading-value">
                    {reading.moisture.toFixed(1)}
                    <span>%</span>
                  </div>
                  <div className="reading-caption">Volumetric water content</div>
                  <div className="progress-track">
                    <div
                      className="progress-fill blue-fill"
                      style={{ width: `${Math.min(100, reading.moisture)}%` }}
                    />
                  </div>
                  <div className="progress-labels">
                    <span>Dry</span>
                    <span>Optimal range</span>
                    <span>Wet</span>
                  </div>
                </div>

                <div className="reading-separator" />

                <div className="reading-block vibration-block">
                  <div className="reading-label">
                    <span className="reading-symbol orange-symbol">
                      <Activity size={16} />
                    </span>
                    VIBRATION
                  </div>
                  <div className="vibration-state">
                    <span className="vibration-indicator">
                      <i />
                    </span>
                    <span>{reading.vibration > 0 ? 'Detected' : 'Normal'}</span>
                  </div>
                  <div className="reading-caption">Ground movement activity</div>
                  <div className="vibration-meter">
                    {Array.from({ length: 34 }, (_, i) => (
                      <span
                        key={i}
                        style={{
                          height: `${16 + ((i * 17 + 7) % 26)}px`,
                          opacity: i > 26 ? 0.35 : 0.95,
                        }}
                      />
                    ))}
                  </div>
                  <div className="progress-labels">
                    <span>None</span>
                    <span>
                      Current <b>{reading.vibration > 0 ? 'Active' : 'Idle'}</b>
                    </span>
                    <span>Detected</span>
                  </div>
                </div>
              </div>

              <div className="reading-footer">
                <span>
                  <Clock3 size={14} /> Updated {timeLabel}
                </span>
                <span>
                  <span className="calibration-dot" /> Live from node
                </span>
              </div>
            </section>

            <section className="panel chart-panel">
              <div className="panel-heading">
                <div>
                  <h2>Moisture trend</h2>
                  <p>Readings over the last 2 hours</p>
                </div>
                <button className="range-select">
                  Last 2 hours <ChevronDown size={14} />
                </button>
              </div>

              <div className="chart-key">
                <span>
                  <i /> Soil moisture
                </span>
                <span className="chart-current">
                  <b>{reading.moisture.toFixed(1)}%</b>
                </span>
              </div>

              <MoistureChart data={trend} />

              <div className="chart-foot">
                <span>
                  <span className="legend-dot" /> Sensor SN-01
                </span>
                <span>Updated in real time</span>
              </div>
            </section>
          </div>

          <div className="lower-grid">
            <section className="panel node-panel">
              <div className="panel-heading">
                <div>
                  <h2>Node information</h2>
                  <p>Device and connection health</p>
                </div>
                <button className="more-button" aria-label="More node information">
                  ···
                </button>
              </div>

              <div className="node-details">
                <div className="node-detail">
                  <span className="detail-icon">
                    <Radio size={16} />
                  </span>
                  <span>
                    <small>Sensor node</small>
                    <b>
                      SN-01 <span className="detail-tag">ACTIVE</span>
                    </b>
                  </span>
                </div>
                <div className="node-detail">
                  <span className="detail-icon">
                    <Wifi size={16} />
                  </span>
                  <span>
                    <small>Gateway</small>
                    <b>GW-01 · Connected</b>
                  </span>
                </div>
                <div className="node-detail">
                  <span className="detail-icon">
                    <Signal size={16} />
                  </span>
                  <span>
                    <small>Signal strength</small>
                    <b>
                      Strong <span className="signal-bars"><i /><i /><i /><i /></span>
                    </b>
                  </span>
                </div>
                <div className="node-detail">
                  <span className="detail-icon">
                    <Battery size={16} />
                  </span>
                  <span>
                    <small>Power</small>
                    <b>USB / Battery</b>
                  </span>
                </div>
              </div>
            </section>

            <section className="panel events-panel" id="events">
              <div className="panel-heading">
                <div>
                  <h2>Recent activity</h2>
                  <p>Latest network events</p>
                </div>
                <button
                  className="view-all"
                  onClick={() =>
                    setEvents([
                      {
                        time: timeLabel,
                        title: 'Manual refresh completed',
                        detail: 'Latest readings requested from node SN-01',
                        type: 'info',
                      },
                      ...events,
                    ])
                  }
                >
                  View all <ArrowUpRight size={14} />
                </button>
              </div>

              <div className="event-list">
                {events.slice(0, 4).map((event, index) => (
                  <div className="event-item" key={`${event.time}-${index}`}>
                    <span className={`event-marker ${event.type}`}>
                      {event.type === 'good' ? (
                        <Check size={12} />
                      ) : event.type === 'alert' ? (
                        <AlertTriangle size={12} />
                      ) : (
                        <Activity size={12} />
                      )}
                    </span>
                    <div className="event-copy">
                      <b>{event.title}</b>
                      <span>{event.detail}</span>
                    </div>
                    <time>{event.time}</time>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <footer className="page-footer">
            <span>
              <span className="footer-mark">
                <Compass size={13} />
              </span>
              SWSN <span className="footer-divider">·</span> Subterranean Wireless
              Sensor Network
            </span>
            <span>
              Live data from ESP32 nodes <span className="footer-divider">·</span> v1.1.0
            </span>
          </footer>
        </div>
      </section>
    </main>
  )
}