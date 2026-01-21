import { CircleDot } from 'lucide-react'
import { LoginButton } from '@/components/features/login-button'

export const metadata = {
  title: 'Login',
}

// Note: Auth redirect is handled by proxy.ts to ensure proper Cache-Control headers
export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="p-3 rounded-2xl bg-primary/10">
            <CircleDot className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">WheelDo</h1>
          <p className="text-muted-foreground text-center">
            Focus on one task at a time.
            <br />
            Spin the wheel when indecisive.
          </p>
        </div>

        {/* Login form */}
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <LoginButton />
        </div>

        {/* Features preview */}
        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold">1</span>
            </div>
            <span>Only one task in progress at a time</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold">2</span>
            </div>
            <span>Spin the wheel to pick your next task</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold">3</span>
            </div>
            <span>Track dependencies and categories</span>
          </div>
        </div>
      </div>
    </div>
  )
}
