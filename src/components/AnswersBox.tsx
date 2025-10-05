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
}

interface AnswersBoxProps {
  questions: Question[];
  loading: boolean;
}

const AnswersBox = ({ questions, loading }: AnswersBoxProps) => {
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

export default AnswersBox;
