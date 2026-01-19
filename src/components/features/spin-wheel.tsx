'use client'

import { useState, useRef, useEffect, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'
import { Triangle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { startTask } from '@/actions/tasks'
import type { TaskDTO } from '@/data/dto/task.types'

interface SpinWheelProps {
  tasks: TaskDTO[]
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

export function SpinWheel({ tasks }: SpinWheelProps) {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [rotation, setRotation] = useState(0)
  const [selectedTask, setSelectedTask] = useState<TaskDTO | null>(null)
  const [error, setError] = useState<string | null>(null)

  const segmentAngle = 360 / tasks.length

  // Draw wheel on canvas
  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = canvas.width
    const center = size / 2
    const radius = center - 10

    ctx.clearRect(0, 0, size, size)

    tasks.forEach((task, index) => {
      const startAngle = (index * segmentAngle - 90 + rotation) * (Math.PI / 180)
      const endAngle = ((index + 1) * segmentAngle - 90 + rotation) * (Math.PI / 180)

      ctx.beginPath()
      ctx.moveTo(center, center)
      ctx.arc(center, center, radius, startAngle, endAngle)
      ctx.closePath()
      ctx.fillStyle = task.category?.color || COLORS[index % COLORS.length]
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'
      ctx.lineWidth = 2
      ctx.stroke()

      // Text
      const textAngle = startAngle + (endAngle - startAngle) / 2
      const textRadius = radius * 0.65
      ctx.save()
      ctx.translate(
        center + Math.cos(textAngle) * textRadius,
        center + Math.sin(textAngle) * textRadius
      )
      ctx.rotate(textAngle + Math.PI / 2)
      ctx.fillStyle = 'white'
      ctx.font = 'bold 12px system-ui'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      let text = task.title
      const maxWidth = radius * 0.5
      if (ctx.measureText(text).width > maxWidth) {
        while (ctx.measureText(text + '...').width > maxWidth && text.length > 0) {
          text = text.slice(0, -1)
        }
        text += '...'
      }
      ctx.fillText(text, 0, 0)
      ctx.restore()
    })

    // Center
    ctx.beginPath()
    ctx.arc(center, center, 30, 0, 2 * Math.PI)
    ctx.fillStyle = '#1e293b'
    ctx.fill()
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 3
    ctx.stroke()
    ctx.fillStyle = 'white'
    ctx.font = 'bold 14px system-ui'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('SPIN', center, center)
  }, [tasks, rotation, segmentAngle])

  useEffect(() => {
    drawWheel()
  }, [drawWheel])

  const spin = useCallback(() => {
    if (isSpinning || tasks.length === 0) return

    setIsSpinning(true)
    setSelectedTask(null)
    setError(null)

    const fullRotations = 3 + Math.random() * 2
    const randomSegment = Math.floor(Math.random() * tasks.length)
    const targetRotation = fullRotations * 360 + randomSegment * segmentAngle

    const duration = 4000
    const startTime = Date.now()
    const startRotation = rotation

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const currentRotation = startRotation + targetRotation * eased

      setRotation(currentRotation % 360)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setIsSpinning(false)
        const normalizedRotation = (360 - (currentRotation % 360)) % 360
        const selectedIndex = Math.floor(normalizedRotation / segmentAngle)
        setSelectedTask(tasks[selectedIndex])
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
      }
    }

    requestAnimationFrame(animate)
  }, [isSpinning, tasks, segmentAngle, rotation])

  const handleStartTask = () => {
    if (!selectedTask || isPending) return

    startTransition(async () => {
      const result = await startTask(selectedTask.id)
      if (result.success) {
        router.push('/dashboard')
        router.refresh()
      } else {
        setError(result.error.message)
      }
    })
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <Triangle
          className="absolute -top-6 left-1/2 -translate-x-1/2 h-8 w-8 text-primary fill-primary rotate-180 z-10"
          aria-hidden="true"
        />
        <canvas
          ref={canvasRef}
          width={320}
          height={320}
          className={cn('touch-none cursor-pointer', isSpinning && 'cursor-not-allowed')}
          onClick={spin}
          role="button"
          aria-label="Spin the wheel"
        />
      </div>

      <Button size="lg" onClick={spin} disabled={isSpinning} className="w-full max-w-xs">
        {isSpinning ? 'Spinning...' : 'Spin the Wheel!'}
      </Button>

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

          {error && <p className="text-sm text-destructive mt-2">{error}</p>}

          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setSelectedTask(null)}
              disabled={isPending}
            >
              Spin Again
            </Button>
            <Button className="flex-1" onClick={handleStartTask} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                'Start Task'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
