CREATE TABLE IF NOT EXISTS "question_useful" (
	"question_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	CONSTRAINT "question_useful_question_id_user_id_pk" PRIMARY KEY("question_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "title" text;
--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "useful_count" integer DEFAULT 0;
--> statement-breakpoint
UPDATE "questions" SET "useful_count" = 0 WHERE "useful_count" IS NULL;
--> statement-breakpoint
ALTER TABLE "answers" ADD COLUMN IF NOT EXISTS "parent_id" integer;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'question_useful_question_id_user_id_pk'
	) THEN
		ALTER TABLE "question_useful" ADD CONSTRAINT "question_useful_question_id_user_id_pk" PRIMARY KEY("question_id","user_id");
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'question_useful_question_id_questions_id_fk'
	) THEN
		ALTER TABLE "question_useful" ADD CONSTRAINT "question_useful_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'question_useful_user_id_users_id_fk'
	) THEN
		ALTER TABLE "question_useful" ADD CONSTRAINT "question_useful_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'answers_parent_id_answers_id_fk'
	) THEN
		ALTER TABLE "answers" ADD CONSTRAINT "answers_parent_id_answers_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."answers"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "questions_created_at_idx" ON "questions" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "questions_created_by_idx" ON "questions" USING btree ("created_by");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "questions_destination_idx" ON "questions" USING btree ("destination");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "answers_question_id_idx" ON "answers" USING btree ("question_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "answers_parent_id_idx" ON "answers" USING btree ("parent_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "answers_created_by_idx" ON "answers" USING btree ("created_by");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "question_useful_question_id_idx" ON "question_useful" USING btree ("question_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "question_useful_user_id_idx" ON "question_useful" USING btree ("user_id");
