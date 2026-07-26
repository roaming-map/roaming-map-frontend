'use client';

import { SignInButton, SignUpButton } from '@clerk/nextjs';

interface SignInPromptProps {
  title?: string;
  description?: string;
  className?: string;
}

export function SignInPrompt({
  title = 'Log in to continue',
  description = 'Sign in to post and join the conversation.',
  className = '',
}: SignInPromptProps) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-gray-50 px-4 py-5 text-center ${className}`}>
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#046cb8]/10">
        <svg className="h-5 w-5 text-[#046cb8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      <p className="mt-1 text-xs text-gray-500 leading-relaxed">{description}</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <SignInButton mode="modal">
          <button
            type="button"
            className="w-full sm:w-auto px-5 py-2.5 bg-[#046cb8] text-white text-sm font-medium rounded-lg hover:bg-[#035a9e] transition-colors min-h-[44px]"
          >
            Log in
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button
            type="button"
            className="w-full sm:w-auto px-5 py-2.5 bg-white text-[#046cb8] text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors min-h-[44px]"
          >
            Sign up
          </button>
        </SignUpButton>
      </div>
    </div>
  );
}
