import { Suspense } from 'react'
import Image from 'next/image'
import { User, Palette, FolderOpen, LogOut } from 'lucide-react'
import { auth, signOut } from '@/lib/auth'
import { getCategories } from '@/lib/tasks'
import { LoadingPage } from '@/components/ui/loading'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CategoryManager } from '@/components/features/category-manager'

export const metadata = {
  title: 'Settings',
}

async function SettingsContent() {
  const [session, categories] = await Promise.all([
    auth(),
    getCategories(),
  ])

  const user = session?.user

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="space-y-6">
        {/* Profile section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Profile</CardTitle>
            </div>
            <CardDescription>Your account information from GitHub</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {user?.image ? (
                <Image
                  src={user.image}
                  alt={user.name || 'User'}
                  width={64}
                  height={64}
                  className="rounded-full"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              )}
              <div>
                <p className="font-semibold text-lg">{user?.name}</p>
                <p className="text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <form
              action={async () => {
                'use server'
                await signOut({ redirectTo: '/' })
              }}
              className="mt-6"
            >
              <Button type="submit" variant="outline" className="gap-2">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Categories section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Categories</CardTitle>
            </div>
            <CardDescription>Manage your task categories</CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryManager categories={categories} />
          </CardContent>
        </Card>

        {/* Theme section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Appearance</CardTitle>
            </div>
            <CardDescription>Customize the look and feel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Theme</p>
                <p className="text-sm text-muted-foreground">
                  WheelDo automatically matches your system preference for light or dark mode.
                </p>
              </div>

              <div>
                <p className="text-sm font-medium mb-3">Accent Color</p>
                <div className="flex gap-2">
                  {[
                    { color: '#6366f1', name: 'Indigo' },
                    { color: '#8b5cf6', name: 'Violet' },
                    { color: '#ec4899', name: 'Pink' },
                    { color: '#f43f5e', name: 'Rose' },
                    { color: '#f97316', name: 'Orange' },
                    { color: '#22c55e', name: 'Green' },
                    { color: '#06b6d4', name: 'Cyan' },
                    { color: '#3b82f6', name: 'Blue' },
                  ].map((theme) => (
                    <button
                      key={theme.color}
                      className="w-8 h-8 rounded-full border-2 border-transparent hover:border-foreground/50 transition-colors"
                      style={{ backgroundColor: theme.color }}
                      title={theme.name}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Theme customization coming soon!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* App info */}
        <div className="text-center text-sm text-muted-foreground pt-4">
          <p>WheelDo v0.1.0</p>
          <p className="mt-1">
            Made with love for focused productivity
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <SettingsContent />
    </Suspense>
  )
}
