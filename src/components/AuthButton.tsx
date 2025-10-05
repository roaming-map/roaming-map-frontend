import { SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';

export function AuthButton() {
  return (
    <div className="flex items-center gap-4">
      <SignInButton mode="modal">
        <button className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors">
          Sign In
        </button>
      </SignInButton>
      <SignUpButton mode="modal">
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Sign Up
        </button>
      </SignUpButton>
      <UserButton />
    </div>
  );
}

export function SignedInButton() {
  return (
    <div className="flex items-center gap-4">
      <UserButton />
    </div>
  );
}
