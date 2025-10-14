interface Question {
  id: number;
  question: string;
  isUrgent: boolean;
  createdAt: string;
  createdBy: number | null;
  user?: {
    id: number;
    name: string | null;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  answers?: Array<{
    id: number;
    content: string;
    questionId: number;
    createdBy: number | null;
    createdAt: string;
  }>;
}

interface QuestionsListProps {
  questions: Question[];
  loading: boolean;
}

const QuestionsList = ({ questions, loading }: QuestionsListProps) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Questions</h2>
      
      {questions.length === 0 ? (
        <div className="text-gray-500">No questions yet. Be the first to ask!</div>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <div key={q.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <a 
                    href={`/questions/${q.id}`}
                    className="text-gray-800 mb-2 block hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    {q.question}
                  </a>
                  <div className="flex items-center text-sm text-gray-500">
                    <span>ID: {q.id}</span>
                    <span className="mx-2">•</span>
                    <span>{new Date(q.createdAt).toLocaleDateString()} at {new Date(q.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                    <span className="mx-2">•</span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                      </svg>
                      {q.answers?.length || 0} answers
                    </span>
                    {q.isUrgent && (
                      <>
                        <span className="mx-2">•</span>
                        <span className="text-red-600 font-medium">🚨 Urgent</span>
                      </>
                    )}
                    {q.user && (
                      <>
                        <span className="mx-2">•</span>
                        <span>By: {q.user.name || `${q.user.firstName} ${q.user.lastName}`}</span>
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
  );
};

export default QuestionsList;
