import { Suspense } from 'react'
import Image from 'next/image'
import { User, Palette, FolderOpen, Shield } from 'lucide-react'
import { getCurrentUser } from '@/data/auth'
import { getCategories } from '@/data/categories'
import { LoadingPage } from '@/components/ui/loading'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { CategoryManager } from '@/components/features/category-manager'
import { SignOutButton } from '@/components/features/sign-out-button'
import { SessionManager } from '@/components/features/session-manager'
import { ThemeSelector } from '@/components/features/theme-selector'

export const metadata = {
  title: 'Settings',
}

async function SettingsContent() {
  const [user, categories] = await Promise.all([getCurrentUser(), getCategories()])

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

            <div className="mt-6">
              <SignOutButton />
            </div>
          </CardContent>
        </Card>

        {/* Sessions section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Active Sessions</CardTitle>
            </div>
            <CardDescription>Manage your active sessions across devices</CardDescription>
          </CardHeader>
          <CardContent>
            <SessionManager />
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
            <ThemeSelector />
          </CardContent>
        </Card>

        {/* App info */}
        <div className="text-center text-sm text-muted-foreground pt-4">
          <p>WheelDo v0.1.0</p>
          <p className="mt-1">Made with love for focused productivity</p>
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
