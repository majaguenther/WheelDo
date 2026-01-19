import { BottomNavLinks } from './bottom-nav-links'

export function ServerBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden pb-safe">
      <BottomNavLinks />
    </nav>
  )
}
