'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { SignedIn, SignedOut, useUser, useClerk } from '@clerk/nextjs';

interface ReplyTo {
  answerId: number;
  name: string;
}

interface AnswerFormProps {
  onSubmit: (content: string, parentId?: number) => Promise<void>;
  submitting: boolean;
  message: string;
  replyTo?: ReplyTo | null;
  onClearReply?: () => void;
}

const AnswerForm = ({ onSubmit, submitting, message, replyTo, onClearReply }: AnswerFormProps) => {
  const [answerContent, setAnswerContent] = useState('');
  const { user } = useUser();
  const { openSignIn } = useClerk();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (replyTo) {
      const form = document.getElementById('answer-form');
      if (form) {
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setTimeout(() => {
        setAnswerContent(`@${replyTo.name} `);
        textareaRef.current?.focus();
      }, 350);
    }
  }, [replyTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerContent.trim()) return;

    await onSubmit(answerContent, replyTo?.answerId);
    setAnswerContent('');
    onClearReply?.();
  };

  const isError = message.includes('Error') || message.includes('must be');

  return (
    <div className="mb-6" id="answer-form">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Post Your Answer</h3>
      <SignedOut>
        <button
          type="button"
          onClick={() => openSignIn()}
          className="w-full rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 text-left shadow-md transition-colors hover:bg-gray-50"
        >
          <p className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-400">
            Log in to share your local knowledge...
          </p>
          <p className="mt-2 text-center text-xs text-gray-400">
            <span className="font-medium text-[#046cb8]">Log in</span> to join the conversation
          </p>
        </button>
      </SignedOut>
      <SignedIn>
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 sm:p-5">
        <form onSubmit={handleSubmit}>
          {replyTo && (
            <div className="flex items-center gap-2 mb-3 text-xs text-[#046cb8]">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <span>Replying to <span className="font-semibold">{replyTo.name}</span></span>
              <button
                type="button"
                onClick={() => {
                  onClearReply?.();
                  setAnswerContent('');
                }}
                className="ml-auto text-gray-400 hover:text-gray-600"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          <div className="flex items-start gap-3">
            {user?.imageUrl ? (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden flex-shrink-0 border border-gray-200 mt-0.5">
                <Image
                  src={user.imageUrl}
                  alt="Profile"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#046cb8] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm font-medium">
                  {user?.firstName?.charAt(0) || user?.lastName?.charAt(0) || '?'}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0 flex items-start gap-2">
              <textarea
                ref={textareaRef}
                id="answer-textarea"
                value={answerContent}
                onChange={(e) => setAnswerContent(e.target.value)}
                placeholder={`Share your local knowledge with ${user?.firstName || 'others'}...`}
                className="flex-1 min-h-[60px] max-h-[160px] border border-gray-200 focus:border-[#046cb8] focus:ring-1 focus:ring-[#046cb8] focus:outline-none text-gray-900 placeholder-gray-400 resize-none text-sm rounded-xl px-3 py-2.5"
                rows={2}
                required
              />
              <button
                type="submit"
                disabled={submitting || !answerContent.trim()}
                className="bg-[#046cb8] text-white p-2.5 rounded-xl hover:bg-[#035a9e] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                aria-label="Post answer"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-3 ml-12 sm:ml-[52px] text-gray-400">
            <span className="text-xs">{answerContent.length}/2000</span>
          </div>
        </form>

        {message && (
          <div className={`mt-3 p-3 rounded-lg text-sm ${
            isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {message}
          </div>
        )}
      </div>
      </SignedIn>
    </div>
  );
};

export default AnswerForm;
