import 'server-only';

import { db } from '@/db/db';
import { answers, notifications, questions, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export type NotificationType = 'answer' | 'reply';

function displayName(user: {
  name: string | null;
  firstName: string | null;
  lastName: string | null;
} | null | undefined): string {
  if (!user) return 'Someone';
  if (user.name?.trim()) return user.name.trim();
  const full = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  if (full) return full;
  return 'Someone';
}

function previewText(content: string, max = 120): string {
  const trimmed = content.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

async function insertNotification(input: {
  userId: number;
  type: NotificationType;
  questionId: number;
  answerId: number;
  actorId: number;
  title: string;
  body: string;
}) {
  if (input.userId === input.actorId) return;

  await db.insert(notifications).values({
    userId: input.userId,
    type: input.type,
    questionId: input.questionId,
    answerId: input.answerId,
    actorId: input.actorId,
    title: input.title,
    body: input.body,
  });
}

/**
 * Create in-app notifications after a new answer (or reply) is posted.
 * - Top-level answer → notify question author
 * - Reply → notify parent answer author; also notify question author if different
 */
export async function notifyOnNewAnswer(params: {
  questionId: number;
  answerId: number;
  actorId: number;
  content: string;
  parentId?: number | null;
}) {
  const { questionId, answerId, actorId, content, parentId } = params;
  const body = previewText(content);

  const [question, actor] = await Promise.all([
    db.query.questions.findFirst({
      where: eq(questions.id, questionId),
      columns: { id: true, createdBy: true },
    }),
    db.query.users.findFirst({
      where: eq(users.id, actorId),
      columns: { id: true, name: true, firstName: true, lastName: true },
    }),
  ]);

  if (!question) return;

  const actorName = displayName(actor);
  const notified = new Set<number>();

  if (parentId != null) {
    const parent = await db.query.answers.findFirst({
      where: eq(answers.id, parentId),
      columns: { id: true, createdBy: true },
    });

    if (parent?.createdBy != null) {
      await insertNotification({
        userId: parent.createdBy,
        type: 'reply',
        questionId,
        answerId,
        actorId,
        title: `${actorName} replied to your answer`,
        body,
      });
      notified.add(parent.createdBy);
    }

    if (question.createdBy != null && !notified.has(question.createdBy)) {
      await insertNotification({
        userId: question.createdBy,
        type: 'answer',
        questionId,
        answerId,
        actorId,
        title: `${actorName} replied on your question`,
        body,
      });
    }
    return;
  }

  if (question.createdBy != null) {
    await insertNotification({
      userId: question.createdBy,
      type: 'answer',
      questionId,
      answerId,
      actorId,
      title: `${actorName} answered your question`,
      body,
    });
  }
}
