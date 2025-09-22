'use client';

import { Button } from "@/components/ui/button"
import { useState } from "react";
import Image from "next/image";

export default function Home() {
  const [question, setQuestion] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

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
    <div className="font-sans min-h-screen p-8 pb-20 gap-16 sm:p-20">
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

        {message && (
          <div className={`p-4 rounded-md ${
            message.includes('✅') 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {message}
          </div>
        )}
      </main>
    </div>
  );
}
