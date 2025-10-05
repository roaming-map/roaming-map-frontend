import { SignedIn, SignedOut } from '@clerk/nextjs';
import { AuthButton, SignedInButton } from './AuthButton';

export function Navigation() {
  return (
    <nav className="flex items-center justify-between p-4 bg-white shadow-sm border-b">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold text-gray-900">Roaming Map</h1>
      </div>


      <div className="flex items-center gap-4">
        <SignedIn>
          {/* Show user button when signed in */}
          <SignedInButton />
        </SignedIn>
        <SignedOut>
          {/* Show sign in/up buttons when signed out */}
          <AuthButton />
        </SignedOut>
      </div>
    </nav>
  );
}
