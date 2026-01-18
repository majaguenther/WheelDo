'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { Task, Category } from '@/generated/prisma/client'

interface SpinWheelProps {
  tasks: (Task & { category: Category | null })[]
  onTaskSelected?: (task: Task & { category: Category | null }) => void
}

const COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f43f5e', // rose
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#3b82f6', // blue
]

export function SpinWheel({ tasks, onTaskSelected }: SpinWheelProps) {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [selectedTask, setSelectedTask] = useState<(Task & { category: Category | null }) | null>(null)
  const spinTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const segmentAngle = 360 / tasks.length

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = canvas.width
    const center = size / 2
    const radius = center - 10

    // Clear canvas
    ctx.clearRect(0, 0, size, size)

    // Draw segments
    tasks.forEach((task, index) => {
      const startAngle = (index * segmentAngle - 90 + rotation) * (Math.PI / 180)
      const endAngle = ((index + 1) * segmentAngle - 90 + rotation) * (Math.PI / 180)

      // Draw segment
      ctx.beginPath()
      ctx.moveTo(center, center)
      ctx.arc(center, center, radius, startAngle, endAngle)
      ctx.closePath()
      ctx.fillStyle = task.category?.color || COLORS[index % COLORS.length]
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw text
      const textAngle = startAngle + (endAngle - startAngle) / 2
      const textRadius = radius * 0.65
      const textX = center + Math.cos(textAngle) * textRadius
      const textY = center + Math.sin(textAngle) * textRadius

      ctx.save()
      ctx.translate(textX, textY)
      ctx.rotate(textAngle + Math.PI / 2)
      ctx.fillStyle = 'white'
      ctx.font = 'bold 12px system-ui'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      // Truncate text if too long
      const maxWidth = radius * 0.5
      let text = task.title
      if (ctx.measureText(text).width > maxWidth) {
        while (ctx.measureText(text + '...').width > maxWidth && text.length > 0) {
          text = text.slice(0, -1)
        }
        text += '...'
      }
      ctx.fillText(text, 0, 0)
      ctx.restore()
    })

    // Draw center circle
    ctx.beginPath()
    ctx.arc(center, center, 30, 0, 2 * Math.PI)
    ctx.fillStyle = '#1e293b'
    ctx.fill()
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 3
    ctx.stroke()

    // Draw center text
    ctx.fillStyle = 'white'
    ctx.font = 'bold 14px system-ui'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('SPIN', center, center)

  }, [tasks, rotation, segmentAngle])

  const spin = () => {
    if (isSpinning || tasks.length === 0) return

    setIsSpinning(true)
    setSelectedTask(null)

    // Random number of full rotations (3-5) plus random segment
    const fullRotations = 3 + Math.random() * 2
    const randomSegment = Math.floor(Math.random() * tasks.length)
    const targetRotation = fullRotations * 360 + randomSegment * segmentAngle

    // Animate the spin
    const duration = 4000 // 4 seconds
    const startTime = Date.now()
    const startRotation = rotation

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function (ease-out cubic)
      const eased = 1 - Math.pow(1 - progress, 3)
      const currentRotation = startRotation + targetRotation * eased

      setRotation(currentRotation % 360)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        // Spin complete
        setIsSpinning(false)

        // Calculate which segment is at the top (pointer position)
        const normalizedRotation = (360 - (currentRotation % 360)) % 360
        const selectedIndex = Math.floor(normalizedRotation / segmentAngle)
        const selected = tasks[selectedIndex]

        setSelectedTask(selected)

        // Trigger confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        })

        onTaskSelected?.(selected)
      }
    }

    requestAnimationFrame(animate)
  }

  const startSelectedTask = async () => {
    if (!selectedTask) return

    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'IN_PROGRESS' }),
      })

      if (!res.ok) throw new Error('Failed to start task')

      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      console.error('Failed to start task:', error)
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Pointer */}
      <div className="relative">
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[25px] border-t-primary z-10" />

        {/* Wheel */}
        <div className={cn('relative', isSpinning && 'cursor-not-allowed')}>
          <canvas
            ref={canvasRef}
            width={320}
            height={320}
            className="touch-none"
            onClick={spin}
          />
        </div>
      </div>

      {/* Spin button */}
      <Button
        size="lg"
        onClick={spin}
        disabled={isSpinning || tasks.length === 0}
        className="w-full max-w-xs"
      >
        {isSpinning ? 'Spinning...' : 'Spin the Wheel!'}
      </Button>

      {/* Selected task */}
      {selectedTask && (
        <div className="w-full max-w-md p-4 rounded-lg border bg-card animate-in fade-in slide-in-from-bottom-4">
          <h3 className="font-semibold mb-2">Your next task:</h3>
          <div
            className="p-3 rounded-lg border-l-4 bg-secondary/50"
            style={{ borderColor: selectedTask.category?.color || '#6366f1' }}
          >
            <p className="font-medium">{selectedTask.title}</p>
            {selectedTask.body && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {selectedTask.body}
              </p>
            )}
          </div>
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setSelectedTask(null)}
            >
              Spin Again
            </Button>
            <Button className="flex-1" onClick={startSelectedTask}>
              Start Task
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
