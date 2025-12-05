import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Rocket } from 'lucide-react'

const Crash = ({ balance, updateBalance, onBust }) => {
  const [betAmount, setBetAmount] = useState(10)
  const [multiplier, setMultiplier] = useState(1.00)
  const [crashed, setCrashed] = useState(false)
  const [running, setRunning] = useState(false)
  const [cashedOutAt, setCashedOutAt] = useState(null)
  const [crashPoint, setCrashPoint] = useState(0)
  const [graphData, setGraphData] = useState([])
  
  const requestRef = useRef()
  const startTimeRef = useRef()
  const graphContainerRef = useRef(null)

  const generateCrashPoint = () => {
    if (Math.random() < 0.03) return 1.00
    const e = 2 ** 32
    const h = crypto.getRandomValues(new Uint32Array(1))[0]
    return Math.floor((100 * e - h) / (e - h)) / 100
  }

  const startGame = () => {
    if (betAmount > balance) return
    
    updateBalance(-betAmount)
    setRunning(true)
    setCrashed(false)
    setCashedOutAt(null)
    setMultiplier(1.00)
    setGraphData([{ x: 0, y: 1 }])
    setCrashPoint(generateCrashPoint())
    
    startTimeRef.current = Date.now()
    requestRef.current = requestAnimationFrame(animate)
  }

  const animate = () => {
    const now = Date.now()
    const timeElapsed = (now - startTimeRef.current) / 1000
    
    const currentMultiplier = Math.exp(0.15 * timeElapsed)
    
    setMultiplier(currentMultiplier)
    setGraphData(prev => [...prev, { x: timeElapsed, y: currentMultiplier }])

    if (currentMultiplier >= crashPoint) {
      crash(crashPoint)
    } else {
      requestRef.current = requestAnimationFrame(animate)
    }
  }

  const crash = (finalValue) => {
    cancelAnimationFrame(requestRef.current)
    setMultiplier(finalValue)
    setCrashed(true)
    setRunning(false)
    
    if (!cashedOutAt) {
      if (balance - betAmount <= 0.01) {
         if (balance <= 0.01) setTimeout(onBust, 1500)
      }
    }
  }

  const cashOut = () => {
    if (!running || crashed || cashedOutAt) return
    
    const winAmount = betAmount * multiplier
    setCashedOutAt(multiplier)
    updateBalance(winAmount)
  }

  useEffect(() => {
    return () => cancelAnimationFrame(requestRef.current)
  }, [])

  // Calculate SVG path
  const getPath = () => {
    if (graphData.length === 0) return ""
    
    const maxX = graphData[graphData.length - 1].x
    const maxY = Math.max(2, graphData[graphData.length - 1].y) // Minimum scale Y is 2
    
    const width = 800 // SVG internal width
    const height = 300 // SVG internal height
    const padding = 20

    const points = graphData.map(p => {
      const x = (p.x / Math.max(1, maxX)) * (width - padding * 2) + padding
      const y = height - ((p.y - 1) / (maxY - 1)) * (height - padding * 2) - padding
      return `${x},${y}`
    })

    return `M ${points.join(' L ')}`
  }

  return (
    <div className="glass-panel" style={{ padding: '40px', width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Rocket color="var(--accent-secondary)" /> CRASH
        </h2>
      </div>

      {/* Graph Area */}
      <div 
        ref={graphContainerRef}
        style={{ 
          height: '300px', 
          background: 'rgba(0,0,0,0.3)', 
          borderRadius: '16px', 
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.05)'
        }}
      >
        <svg width="100%" height="100%" viewBox="0 0 800 300" preserveAspectRatio="none">
          {/* Grid lines (optional) */}
          <line x1="0" y1="280" x2="800" y2="280" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <line x1="20" y1="0" x2="20" y2="300" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          
          {/* The Graph Line */}
          <path 
            d={getPath()} 
            fill="none" 
            stroke={crashed ? 'var(--accent-secondary)' : 'var(--accent-primary)'} 
            strokeWidth="4"
            vectorEffect="non-scaling-stroke"
          />
          
          {/* Fill area under graph */}
          <path 
            d={`${getPath()} L ${getPath().split(' ').pop().split(',')[0]},300 L 20,300 Z`} 
            fill={crashed ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)'} 
            stroke="none"
          />
        </svg>

        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          fontSize: '5rem', 
          fontWeight: 'bold', 
          color: crashed ? 'var(--accent-secondary)' : (cashedOutAt ? 'var(--accent-primary)' : 'white'),
          textShadow: crashed ? '0 0 30px rgba(244, 63, 94, 0.6)' : '0 0 20px rgba(255, 255, 255, 0.2)',
          zIndex: 10
        }}>
          {multiplier.toFixed(2)}x
        </div>
        
        {crashed && (
          <div style={{ 
            position: 'absolute', 
            top: '70%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            color: 'var(--accent-secondary)', 
            fontSize: '1.5rem' 
          }}>
            CRASHED
          </div>
        )}
        
        {cashedOutAt && (
          <div style={{ 
            position: 'absolute', 
            top: '70%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            color: 'var(--accent-primary)', 
            fontSize: '1.2rem' 
          }}>
            Cashed out at {cashedOutAt.toFixed(2)}x (+฿{(betAmount * cashedOutAt - betAmount).toFixed(2)})
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Bet Amount</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="number" 
              value={betAmount} 
              disabled={running}
              onChange={(e) => setBetAmount(Math.max(0, parseFloat(e.target.value)))}
              style={{ 
                background: 'var(--bg-color)', 
                border: '1px solid var(--bg-card)', 
                color: 'white', 
                padding: '12px', 
                borderRadius: '8px',
                width: '100%',
                fontSize: '1.1rem'
              }}
            />
            <button 
              disabled={running}
              onClick={() => setBetAmount(balance)} 
              style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', padding: '0 15px', borderRadius: '8px' }}
            >
              MAX
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          {!running ? (
            <button 
              onClick={startGame}
              disabled={betAmount > balance || betAmount <= 0}
              className="btn-primary"
              style={{ 
                width: '100%', 
                height: '50px',
                fontSize: '1.2rem',
                opacity: (betAmount > balance) ? 0.5 : 1
              }}
            >
              Place Bet
            </button>
          ) : (
            <button 
              onClick={cashOut}
              disabled={crashed || cashedOutAt}
              className="btn-primary"
              style={{ 
                width: '100%', 
                height: '50px',
                fontSize: '1.2rem',
                background: cashedOutAt ? 'var(--bg-card)' : 'var(--accent-gold)',
                color: cashedOutAt ? 'var(--text-secondary)' : 'black'
              }}
            >
              {cashedOutAt ? 'Cashed Out' : 'CASH OUT'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Crash
