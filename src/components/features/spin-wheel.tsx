'use client'

import {useState, useCallback, useRef, useEffect, useActionState} from 'react'
import {useRouter} from 'next/navigation'
import confetti from 'canvas-confetti'
import {Triangle} from 'lucide-react'
import {cn} from '@/lib/utils'
import {Button} from '@/components/ui/button'
import {SubmitButton} from '@/components/ui/submit-button'
import {startTaskFormAction} from '@/actions/tasks'
import type {TaskDTO} from '@/data/dto/task.types'

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

// SVG coordinate helpers
const SIZE = 320
const CENTER = SIZE / 2
const RADIUS = CENTER - 10

function polarToCartesian(cx: number, cy: number, radius: number, angleInDegrees: number) {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180
    return {
        x: cx + radius * Math.cos(angleInRadians),
        y: cy + radius * Math.sin(angleInRadians),
    }
}

function describeArc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
    const start = polarToCartesian(cx, cy, radius, endAngle)
    const end = polarToCartesian(cx, cy, radius, startAngle)
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`
}

function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength - 3) + '...'
}

export function SpinWheel({tasks}: SpinWheelProps) {
    const router = useRouter()
    const [isSpinning, setIsSpinning] = useState(false)
    const [rotation, setRotation] = useState(0)
    const [selectedTask, setSelectedTask] = useState<TaskDTO | null>(null)
    const animationRef = useRef<number | null>(null)

    // Action state for starting task
    const [startState, startAction, isPending] = useActionState(startTaskFormAction, null)

    // Handle successful start - redirect to dashboard
    useEffect(() => {
        if (startState?.success) {
            router.push('/dashboard')
            router.refresh()
        }
    }, [startState?.success, router])

    const segmentAngle = 360 / tasks.length

    const spin = useCallback(() => {
        if (isSpinning || tasks.length === 0) return

        setIsSpinning(true)
        setSelectedTask(null)

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
                animationRef.current = requestAnimationFrame(animate)
            } else {
                setIsSpinning(false)
                animationRef.current = null
                const normalizedRotation = (360 - (currentRotation % 360)) % 360
                const selectedIndex = Math.floor(normalizedRotation / segmentAngle)
                setSelectedTask(tasks[selectedIndex])
                confetti({particleCount: 100, spread: 70, origin: {y: 0.6}})
            }
        }

        animationRef.current = requestAnimationFrame(animate)
    }, [isSpinning, tasks, segmentAngle, rotation])

    // Calculate max characters for text based on segment count
    const maxChars = tasks.length <= 4 ? 15 : tasks.length <= 8 ? 10 : 8

    return (
        <div className="flex flex-col items-center gap-6">
            <div className="relative">
                <Triangle
                    className="absolute -top-6 left-1/2 -translate-x-1/2 h-8 w-8 text-primary fill-primary rotate-180 z-10"
                    aria-hidden="true"
                />
                <svg
                    viewBox={`0 0 ${SIZE} ${SIZE}`}
                    className={cn(
                        'w-80 h-80 touch-none cursor-pointer',
                        isSpinning && 'cursor-not-allowed'
                    )}
                    onClick={spin}
                    role="button"
                    aria-label="Spin the wheel"
                >
                    {/* Wheel segments */}
                    <g
                        style={{
                            transform: `rotate(${rotation}deg)`,
                            transformOrigin: 'center',
                        }}
                    >
                        {tasks.map((task, index) => {
                            const startAngle = index * segmentAngle
                            const endAngle = (index + 1) * segmentAngle
                            const midAngle = startAngle + segmentAngle / 2
                            const textRadius = RADIUS * 0.65
                            const textPosition = polarToCartesian(CENTER, CENTER, textRadius, midAngle)
                            const color = task.category?.color || COLORS[index % COLORS.length]

                            return (
                                <g key={task.id}>
                                    {/* Pie slice */}
                                    <path
                                        d={describeArc(CENTER, CENTER, RADIUS, startAngle, endAngle)}
                                        fill={color}
                                        stroke="rgba(255,255,255,0.3)"
                                        strokeWidth={2}
                                    />
                                    {/* Text label */}
                                    <text
                                        x={textPosition.x}
                                        y={textPosition.y}
                                        fill="white"
                                        fontSize={12}
                                        fontWeight="bold"
                                        fontFamily="system-ui, sans-serif"
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        transform={`rotate(${midAngle}, ${textPosition.x}, ${textPosition.y})`}
                                    >
                                        {truncateText(task.title, maxChars)}
                                    </text>
                                </g>
                            )
                        })}
                    </g>

                    {/* Center button */}
                    <circle
                        cx={CENTER}
                        cy={CENTER}
                        r={30}
                        fill="#1e293b"
                        stroke="white"
                        strokeWidth={3}
                    />
                    <text
                        x={CENTER}
                        y={CENTER}
                        fill="white"
                        fontSize={14}
                        fontWeight="bold"
                        fontFamily="system-ui, sans-serif"
                        textAnchor="middle"
                        dominantBaseline="middle"
                    >
                        SPIN
                    </text>
                </svg>
            </div>

            <Button size="lg" onClick={spin} disabled={isSpinning} className="w-full max-w-xs">
                {isSpinning ? 'Spinning...' : 'Spin the Wheel!'}
            </Button>

            {selectedTask && (
                <div
                    className="w-full max-w-md p-4 rounded-lg border bg-card animate-in fade-in slide-in-from-bottom-4">
                    <h3 className="font-semibold mb-2">Your next task:</h3>
                    <div
                        className="p-3 rounded-lg border-l-4 bg-secondary/50"
                        style={{borderColor: selectedTask.category?.color || '#6366f1'}}
                    >
                        <p className="font-medium">{selectedTask.title}</p>
                        {selectedTask.body && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {selectedTask.body}
                            </p>
                        )}
                    </div>

                    {startState?.error && (
                        <p className="text-sm text-destructive mt-2">{startState.error.message}</p>
                    )}

                    <div className="flex gap-3 mt-4">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => setSelectedTask(null)}
                            disabled={isPending}
                        >
                            Spin Again
                        </Button>
                        <form action={startAction} className="flex-1">
                            <input type="hidden" name="taskId" value={selectedTask.id}/>
                            <SubmitButton className="w-full" pendingText="Starting...">
                                Start Task
                            </SubmitButton>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
