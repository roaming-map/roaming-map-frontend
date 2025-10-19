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
    <form onSubmit={handleSubmit}>
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="What would you like to know about traveling? Share your question with the community..."
        className="w-full h-32 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#046cb8] focus:border-transparent resize-none text-gray-900 placeholder-gray-500"
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
      
      <div className="flex items-center justify-between mt-6">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isUrgent}
            onChange={(e) => setIsUrgent(e.target.checked)}
            className="w-4 h-4 text-[#046cb8] border-gray-300 rounded focus:ring-[#046cb8]"
          />
          <span className="ml-2 text-sm text-gray-600">This is urgent</span>
        </label>
        
        <Button
          type="submit"
          disabled={submitting || !question.trim()}
          className="bg-[#046cb8] hover:bg-[#046cb8]/90 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          {submitting ? 'Posting...' : 'Post Question'}
        </Button>
      </div>

      {message && (
        <div className={`mt-4 p-4 rounded-lg ${
          message.includes('Error') 
            ? 'bg-red-50 text-red-700 border border-red-200' 
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {message}
        </div>
      )}
    </form>
  );
};

export default QuestionForm;
