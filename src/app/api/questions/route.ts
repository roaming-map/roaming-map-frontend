import { NextResponse } from 'next/server';
import { db } from '@/db/db';
import { answers, categories, questions, questionsToCategories, users } from '@/db/schema';
import {
  CurrentUserAuthError,
  getOrCreateCurrentUser,
  handleCurrentUserError,
  type CurrentDbUser,
} from '@/lib/server/current-user';
import { validateRequest, handleDatabaseError } from '@/utils/validation-helpers';
import { createQuestionSchema } from '@/validations';
import { and, count, desc, eq, ilike, inArray, lt, or, sql, type SQL } from 'drizzle-orm';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const LATEST_ANSWER_PREVIEW_LENGTH = 140;

type CursorPayload = {
  createdAt: string;
  id: number;
};

type LatestAnswerRow = {
  answerId: number;
  questionId: number;
  content: string;
  createdAt: Date | null;
  createdBy: number | null;
  authorId: number | null;
  authorName: string | null;
  authorFirstName: string | null;
  authorLastName: string | null;
  rowNumber: number;
};

function parseLimit(value: string | null): number {
  const parsed = value ? Number.parseInt(value, 10) : DEFAULT_LIMIT;
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(parsed, MAX_LIMIT);
}

function parseBoolean(value: string | null): boolean {
  return value === 'true';
}

function cleanParam(value: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

function decodeCursor(value: string | null): CursorPayload | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as Partial<CursorPayload>;
    if (typeof parsed.createdAt !== 'string' || typeof parsed.id !== 'number') {
      return null;
    }

    const createdAt = new Date(parsed.createdAt);
    if (Number.isNaN(createdAt.getTime()) || parsed.id <= 0) {
      return null;
    }

    return { createdAt: parsed.createdAt, id: parsed.id };
  } catch {
    return null;
  }
}

function createNextCursor(item: { id: number; createdAt: Date | null }): string | null {
  if (!item.createdAt) return null;
  return encodeCursor({ id: item.id, createdAt: item.createdAt.toISOString() });
}

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}


function truncatePreview(content: string): string {
  const normalized = content.replace(/\s+/g, ' ').trim();
  if (normalized.length <= LATEST_ANSWER_PREVIEW_LENGTH) return normalized;
  return `${normalized.slice(0, LATEST_ANSWER_PREVIEW_LENGTH - 1).trimEnd()}…`;
}

async function getCurrentUserForMyFilter(): Promise<CurrentDbUser | null | NextResponse> {
  try {
    return await getOrCreateCurrentUser();
  } catch (error) {
    if (error instanceof CurrentUserAuthError) {
      return null;
    }
    return handleCurrentUserError(error);
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = parseLimit(url.searchParams.get('limit'));
    const cursorParam = url.searchParams.get('cursor');
    const cursor = decodeCursor(cursorParam);
    const category = cleanParam(url.searchParams.get('category'));
    const destination = cleanParam(url.searchParams.get('destination'));
    const search = cleanParam(url.searchParams.get('search'));
    const my = parseBoolean(url.searchParams.get('my'));
    const urgent = parseBoolean(url.searchParams.get('urgent'));

    if (cursorParam && !cursor) {
      return NextResponse.json({ error: 'Invalid cursor' }, { status: 400 });
    }

    const whereConditions: SQL[] = [];

    if (my) {
      const currentUser = await getCurrentUserForMyFilter();
      if (currentUser instanceof NextResponse) return currentUser;
      if (!currentUser) {
        return NextResponse.json({ items: [], nextCursor: null });
      }
      whereConditions.push(eq(questions.createdBy, currentUser.id));
    }

    if (urgent) {
      whereConditions.push(eq(questions.isUrgent, true));
    }

    if (destination) {
      whereConditions.push(sql`lower(${questions.destination}) = ${destination.toLowerCase()}`);
    }

    if (category) {
      const categoryId = Number.parseInt(category, 10);
      const categoryFilter = Number.isFinite(categoryId) && String(categoryId) === category
        ? eq(categories.id, categoryId)
        : sql`lower(${categories.category}) = ${category.toLowerCase()}`;

      whereConditions.push(
        inArray(
          questions.id,
          db
            .select({ questionId: questionsToCategories.questionId })
            .from(questionsToCategories)
            .innerJoin(categories, eq(questionsToCategories.categoryId, categories.id))
            .where(categoryFilter)
        )
      );
    }

    if (search) {
      const pattern = `%${escapeLikePattern(search)}%`;
      whereConditions.push(
        or(
          ilike(questions.title, pattern),
          ilike(questions.question, pattern),
          ilike(questions.destination, pattern),
          inArray(
            questions.id,
            db
              .select({ questionId: questionsToCategories.questionId })
              .from(questionsToCategories)
              .innerJoin(categories, eq(questionsToCategories.categoryId, categories.id))
              .where(ilike(categories.category, pattern))
          ),
          inArray(
            questions.createdBy,
            db
              .select({ id: users.id })
              .from(users)
              .where(
                or(
                  ilike(users.name, pattern),
                  ilike(users.firstName, pattern),
                  ilike(users.lastName, pattern)
                )
              )
          )
        )!
      );
    }

    if (cursor) {
      const cursorDate = new Date(cursor.createdAt);
      whereConditions.push(
        or(
          lt(questions.createdAt, cursorDate),
          and(eq(questions.createdAt, cursorDate), lt(questions.id, cursor.id))
        )!
      );
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const questionRows = await db.query.questions.findMany({
      ...(whereClause ? { where: whereClause } : {}),
      with: {
        user: true,
        questionsToCategories: {
          with: {
            category: true,
          },
        },
      },
      orderBy: [desc(questions.createdAt), desc(questions.id)],
      limit: limit + 1,
    });

    const pageItems = questionRows.slice(0, limit);
    const hasMore = questionRows.length > limit;
    const questionIds = pageItems.map((question) => question.id);

    const answerCountByQuestionId = new Map<number, number>();
    const latestAnswerByQuestionId = new Map<number, LatestAnswerRow>();

    if (questionIds.length > 0) {
      const answerCounts = await db
        .select({ questionId: answers.questionId, value: count() })
        .from(answers)
        .where(inArray(answers.questionId, questionIds))
        .groupBy(answers.questionId);

      answerCounts.forEach((row) => {
        answerCountByQuestionId.set(row.questionId, Number(row.value));
      });

      const rankedAnswers = db
        .select({
          answerId: sql<number>`${answers.id}`.as('answer_id'),
          questionId: sql<number>`${answers.questionId}`.as('question_id'),
          content: sql<string>`${answers.content}`.as('content'),
          createdAt: sql<Date | null>`${answers.createdAt}`.as('created_at'),
          createdBy: sql<number | null>`${answers.createdBy}`.as('created_by'),
          authorId: sql<number | null>`${users.id}`.as('author_id'),
          authorName: sql<string | null>`${users.name}`.as('author_name'),
          authorFirstName: sql<string | null>`${users.firstName}`.as('author_first_name'),
          authorLastName: sql<string | null>`${users.lastName}`.as('author_last_name'),
          rowNumber: sql<number>`row_number() over (partition by ${answers.questionId} order by ${answers.createdAt} desc, ${answers.id} desc)`.as('row_number'),
        })
        .from(answers)
        .leftJoin(users, eq(answers.createdBy, users.id))
        .where(inArray(answers.questionId, questionIds))
        .as('ranked_answers');

      const latestAnswers = await db
        .select({
          answerId: rankedAnswers.answerId,
          questionId: rankedAnswers.questionId,
          content: rankedAnswers.content,
          createdAt: rankedAnswers.createdAt,
          createdBy: rankedAnswers.createdBy,
          authorId: rankedAnswers.authorId,
          authorName: rankedAnswers.authorName,
          authorFirstName: rankedAnswers.authorFirstName,
          authorLastName: rankedAnswers.authorLastName,
          rowNumber: rankedAnswers.rowNumber,
        })
        .from(rankedAnswers)
        .where(eq(rankedAnswers.rowNumber, 1));

      latestAnswers.forEach((row) => {
        latestAnswerByQuestionId.set(row.questionId, row);
      });
    }

    const items = pageItems.map((question) => {
      const categorySummaries = question.questionsToCategories.map((relation) => ({
        id: relation.category.id,
        category: relation.category.category,
      }));
      const author = question.user
        ? {
            id: question.user.id,
            name: question.user.name,
            firstName: question.user.firstName,
            lastName: question.user.lastName,
          }
        : null;
      const latestAnswer = latestAnswerByQuestionId.get(question.id);

      return {
        id: question.id,
        title: question.title,
        question: question.question,
        destination: question.destination,
        isUrgent: question.isUrgent ?? false,
        usefulCount: question.usefulCount ?? 0,
        createdAt: question.createdAt,
        createdBy: question.createdBy,
        author,
        user: author,
        categories: categorySummaries,
        questionsToCategories: question.questionsToCategories.map((relation) => ({
          questionId: relation.questionId,
          categoryId: relation.categoryId,
          category: {
            id: relation.category.id,
            category: relation.category.category,
          },
        })),
        answerCount: answerCountByQuestionId.get(question.id) ?? 0,
        latestAnswer: latestAnswer
          ? {
              id: latestAnswer.answerId,
              contentPreview: truncatePreview(latestAnswer.content),
              createdAt: latestAnswer.createdAt,
              createdBy: latestAnswer.createdBy,
              user: latestAnswer.authorId
                ? {
                    id: latestAnswer.authorId,
                    name: latestAnswer.authorName,
                    firstName: latestAnswer.authorFirstName,
                    lastName: latestAnswer.authorLastName,
                  }
                : null,
            }
          : null,
      };
    });

    return NextResponse.json({
      items,
      nextCursor: hasMore && pageItems.length > 0 ? createNextCursor(pageItems[pageItems.length - 1]) : null,
    });
  } catch (error) {
    return handleDatabaseError(error, 'fetch questions');
  }
}

export async function POST(req: Request) {
  try {
    let user: CurrentDbUser;
    try {
      user = await getOrCreateCurrentUser();
    } catch (error) {
      return handleCurrentUserError(error);
    }

    // Validate the request body using Zod
    const validation = await validateRequest(req, createQuestionSchema);

    if (!validation.success) {
      console.error('Validation failed:', validation.error);
      return validation.error;
    }

    const validatedData = validation.data;

    // Create the question with validated data
    try {
      const newQuestion = await db.insert(questions).values({
        title: validatedData.title,
        question: validatedData.question,
        destination: validatedData.destination,
        isUrgent: validatedData.isUrgent,
        createdBy: user.id,
      }).returning();

      // Handle category relationships if categoryIds are provided
      if (validatedData.categoryIds && validatedData.categoryIds.length > 0) {
        try {
          const categoryRelations = validatedData.categoryIds.map((categoryId) => ({
            questionId: newQuestion[0].id,
            categoryId,
          }));
          await db.insert(questionsToCategories).values(categoryRelations);
        } catch (categoryError) {
          console.error('Error inserting categories:', categoryError);
        }
      }

      // Return the newly created question data in the response
      return NextResponse.json({
        message: 'Question posted successfully!',
        question: newQuestion[0],
        categoryIds: validatedData.categoryIds || [],
      }, { status: 201 });
    } catch (error) {
      console.error('Error creating question:', error);
      return NextResponse.json(
        { error: 'Failed to create question in database' },
        { status: 500 }
      );
    }

  } catch (error) {
    return handleDatabaseError(error, 'post question');
  }
}
