import { useQuery } from '@tanstack/react-query';

interface Stats {
    questions: number;
    answers: number;
    activeLocals: number;
}

export const useStats = () => {
    return useQuery<Stats>({
        queryKey: ['stats'],
        queryFn: async () => {
            const response = await fetch('/api/stats');
            if (!response.ok) {
                throw new Error('Failed to fetch stats');
            }
            return response.json();
        },
    });
};
