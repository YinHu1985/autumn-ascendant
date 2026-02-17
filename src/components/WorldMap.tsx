import React, { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { selectSettlements } from '../store/gameState'
import type { Settlement } from '../types/Settlement'

const MIN_SCALE = 0.2
const MAX_SCALE = 5
const ZOOM_SENSITIVITY = 0.0015
const NODE_RADIUS = 6

function ownerColor(ownerId: string): string {
  if (!ownerId) return '#4ade80' // default green
  let hash = 0
  for (let i = 0; i < ownerId.length; i++) hash = (hash * 31 + ownerId.charCodeAt(i)) >>> 0
  const hue = hash % 360
  return `hsl(${hue}, 60%, 55%)`
}

export default function WorldMap({ onSettlementSelect }: { onSettlementSelect?: (id: string) => void }) {
  const settlements = useSelector(selectSettlements)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const dprRef = useRef<number>(1)
  const widthRef = useRef<number>(0)
  const heightRef = useRef<number>(0)
  const scaleRef = useRef<number>(1)
  const offsetXRef = useRef<number>(0)
  const offsetYRef = useRef<number>(0)
  const draggingRef = useRef<boolean>(false)
  const lastMouseXRef = useRef<number>(0)
  const lastMouseYRef = useRef<number>(0)
  const dragDistanceRef = useRef<number>(0)
  const settlementsRef = useRef<Settlement[]>([])
  settlementsRef.current = settlements

  useEffect(() => {
    const canvasEl = canvasRef.current
    if (!canvasEl) return
    const canvas: HTMLCanvasElement = canvasEl
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      widthRef.current = Math.floor(rect.width)
      heightRef.current = Math.floor(rect.height)
      dprRef.current = window.devicePixelRatio || 1
      canvas.width = Math.floor(widthRef.current * dprRef.current)
      canvas.height = Math.floor(heightRef.current * dprRef.current)
    }
    resize()

    let ro: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(resize)
      ro.observe(canvas)
    } else {
      window.addEventListener('resize', resize)
    }

    const draw = () => {
      const dpr = dprRef.current
      const scale = scaleRef.current
      const ox = offsetXRef.current * dpr
      const oy = offsetYRef.current * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      // Antique parchment background
      ctx.fillStyle = '#e8dfc8' 
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Optional: Draw a subtle grid or texture could be added here
      
      ctx.setTransform(dpr * scale, 0, 0, dpr * scale, ox, oy)

      const sList = settlementsRef.current
      const idMap = new Map<string, Settlement>()
      for (const s of sList) idMap.set(s.id, s)

      ctx.lineWidth = Math.max(1 / scale, 0.5)
      ctx.strokeStyle = '#8b5a2b' // Antique wood/leather color for roads
      ctx.lineCap = 'round'
      ctx.setLineDash([5, 5]) // Dashed lines for old map feel? Or solid. Let's keep solid for now but maybe less harsh.
      ctx.setLineDash([]) 
      
      const seen = new Set<string>()
      for (const a of sList) {
        for (const bid of a.connections) {
          const targetId = typeof bid === 'string' ? bid : bid.targetId
          const b = idMap.get(targetId)
          if (!b) continue
          const key = a.id < b.id ? `${a.id}|${b.id}` : `${b.id}|${a.id}`
          if (seen.has(key)) continue
          seen.add(key)
          ctx.beginPath()
          ctx.moveTo(a.position.x, a.position.y)
          ctx.lineTo(b.position.x, b.position.y)
          ctx.stroke()
        }
      }

      for (const s of sList) {
        ctx.beginPath()
        ctx.arc(s.position.x, s.position.y, NODE_RADIUS, 0, Math.PI * 2)
        ctx.fillStyle = ownerColor(s.ownerId)
        ctx.fill()
        ctx.strokeStyle = '#2c1810' // Antique dark
        ctx.lineWidth = Math.max(1.5 / scale, 1)
        ctx.stroke()
        
        // Optional: Draw a small dot in center for city location
        ctx.beginPath()
        ctx.arc(s.position.x, s.position.y, 1, 0, Math.PI * 2)
        ctx.fillStyle = '#2c1810'
        ctx.fill()
      }
    }

    const loop = () => {
      draw()
      rafRef.current = window.requestAnimationFrame(loop)
    }
    rafRef.current = window.requestAnimationFrame(loop)

    const onMouseDown = (e: MouseEvent) => {
      draggingRef.current = true
      dragDistanceRef.current = 0
      lastMouseXRef.current = e.clientX
      lastMouseYRef.current = e.clientY
    }
    const onMouseMove = (e: MouseEvent) => {
      if (!draggingRef.current) return
      const dx = e.clientX - lastMouseXRef.current
      const dy = e.clientY - lastMouseYRef.current
      dragDistanceRef.current += Math.abs(dx) + Math.abs(dy)
      offsetXRef.current += dx
      offsetYRef.current += dy
      lastMouseXRef.current = e.clientX
      lastMouseYRef.current = e.clientY
    }
    const onMouseUp = (e: MouseEvent) => {
      draggingRef.current = false
      
      // Handle Click (if drag distance is small)
      if (dragDistanceRef.current < 5) {
         const rect = canvas.getBoundingClientRect()
         const mx = e.clientX - rect.left
         const my = e.clientY - rect.top
         const scale = scaleRef.current
         const ox = offsetXRef.current
         const oy = offsetYRef.current
         
         // Transform to World Coordinates
         const worldX = (mx - ox) / scale
         const worldY = (my - oy) / scale
         
         // Hit Test
         const hitRadius = NODE_RADIUS + 5 // slightly larger hit area
         for (const s of settlementsRef.current) {
           const dist = Math.sqrt(Math.pow(s.position.x - worldX, 2) + Math.pow(s.position.y - worldY, 2))
           if (dist <= hitRadius) {
             if (onSettlementSelect) onSettlementSelect(s.id)
             break
           }
         }
      }
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      const scale = scaleRef.current
      const ox = offsetXRef.current
      const oy = offsetYRef.current
      const worldX = (mx - ox) / scale
      const worldY = (my - oy) / scale
      const delta = -e.deltaY * ZOOM_SENSITIVITY
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * (1 + delta)))
      scaleRef.current = newScale
      offsetXRef.current = mx - worldX * newScale
      offsetYRef.current = my - worldY * newScale
    }

    canvas.addEventListener('mousedown', onMouseDown)
    canvas.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    canvas.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      canvas.removeEventListener('mousedown', onMouseDown)
      canvas.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      canvas.removeEventListener('wheel', onWheel)
      if (ro) {
        ro.disconnect()
      } else {
        window.removeEventListener('resize', resize)
      }
    }
  }, [])

  return (
    <div className="w-full h-full bg-antique-paper overflow-hidden cursor-move">
      <canvas ref={canvasRef} className="w-full h-full block touch-none" />
      {/* Decorative Compass or Map overlay could go here */}
    </div>
  )
}
