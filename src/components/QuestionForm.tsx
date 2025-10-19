import { Button } from '@/components/ui/button';
import CategorySelector from './CategorySelector';

interface QuestionFormProps {
  question: string;
  isUrgent: boolean;
  selectedCategoryIds: number[];
  setQuestion: (value: string) => void;
  setIsUrgent: (value: boolean) => void;
  setSelectedCategoryIds: (value: number[]) => void;
  handleSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  message: string;
}

const QuestionForm = ({ 
  question, 
  isUrgent, 
  selectedCategoryIds,
  setQuestion, 
  setIsUrgent, 
  setSelectedCategoryIds,
  handleSubmit, 
  submitting, 
  message 
}: QuestionFormProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Ask a Question</h2>
      
      <form onSubmit={handleSubmit}>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What would you like to know about traveling?"
          className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          required
        />
        
        {/* Category Selection */}
        <div className="mt-4">
          <CategorySelector
            selectedCategoryIds={selectedCategoryIds}
            onSelectionChange={setSelectedCategoryIds}
            disabled={submitting}
          />
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={isUrgent}
              onChange={(e) => setIsUrgent(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">This is urgent</span>
          </label>
          
          <Button
            type="submit"
            disabled={submitting || !question.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {submitting ? 'Posting...' : 'Post Question'}
          </Button>
        </div>
      </form>

      {message && (
        <div className={`mt-4 p-3 rounded-lg ${
          message.includes('Error') 
            ? 'bg-red-100 text-red-700' 
            : 'bg-green-100 text-green-700'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default QuestionForm;
