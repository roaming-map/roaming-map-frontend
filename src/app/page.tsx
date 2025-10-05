'use client';

import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { SignedIn, SignedOut } from '@clerk/nextjs';
import { useState, useEffect } from "react";
import Image from "next/image";

export default function Home() {
  const [question, setQuestion] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuestions = async () => {
    try {
      const response = await fetch('/api/questions');
      const data = await response.json();
      setQuestions(data);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          isUrgent,
          createdBy: 1, // Temporary user ID
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('✅ Question submitted successfully!');
        setQuestion('');
        setIsUrgent(false);
        // Refresh the questions list
        fetchQuestions();
      } else {
        setMessage('❌ Error: ' + data.error);
      }
    } catch (error) {
      setMessage('❌ Network error: ' + error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="font-sans min-h-screen">
      <Navigation />
      <div className="p-8 pb-20 gap-16 sm:p-20">
        <main className="max-w-2xl mx-auto">
          <div className="flex items-center mb-8">
            <Image
              src="/short-logo.png"
              alt="Roaming Map Logo"
              width={60}
              height={30}
              className="mr-4"
              priority
            />
            <h1 className="text-3xl font-bold">Roaming Map</h1>
          </div>
        
        <form onSubmit={handleSubmit} className="space-y-4 mb-8">
          <div>
            <label htmlFor="question" className="block text-sm font-medium mb-2">
              Ask a travel question:
            </label>
            <textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., What's the average tuk-tuk fare from Colombo to Galle?"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              required
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="urgent"
              checked={isUrgent}
              onChange={(e) => setIsUrgent(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="urgent" className="text-sm">
              This is urgent
            </label>
          </div>
          
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Question'}
          </Button>
        </form>

        {/* Show sign-in prompt for anonymous users */}
        <SignedOut>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <p className="text-blue-800 mb-2">Sign in to track your questions and get personalized recommendations!</p>
            <div className="text-blue-600 text-sm">Authentication powered by Clerk</div>
          </div>
        </SignedOut>

        {message && (
          <div className={`p-4 rounded-md ${
            message.includes('✅') 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {message}
          </div>
        )}

        {/* Questions List */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Recent Questions</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Loading questions...</div>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">No questions yet. Be the first to ask!</div>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q: any) => (
                <div key={q.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-gray-800 mb-2">{q.question}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <span>ID: {q.id}</span>
                        <span className="mx-2">•</span>
                        <span>{new Date(q.createdAt).toLocaleDateString()} at {new Date(q.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                        {q.is_urgent && (
                          <>
                            <span className="mx-2">•</span>
                            <span className="text-red-600 font-medium">🚨 Urgent</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </main>
      </div>
    </div>
  );
}
