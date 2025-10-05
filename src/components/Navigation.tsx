import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs';
import { AuthButton, SignedInButton } from './AuthButton';

export function Navigation() {
  const { user } = useUser();

  return (
    <nav className="flex items-center justify-between p-4 bg-white shadow-sm border-b">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold text-gray-900">Roaming Map</h1>
      </div>

      <div className="flex items-center gap-4">
        <SignedIn>
          {/* Show greeting and user button when signed in */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
       
              <span className="text-gray-700">
                Hello {user?.firstName || 'there'}! 👋
              </span>
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8"
                  }
                }}
              />
            </div>
          </div>
        </SignedIn>
        <SignedOut>
          {/* Show sign in/up buttons when signed out */}
          <AuthButton />
        </SignedOut>
      </div>
    </nav>
  );
}
