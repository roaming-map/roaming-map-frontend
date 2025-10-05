CREATE TABLE "answers" (
	"id" serial PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"question_id" integer NOT NULL,
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"is_helpful" boolean DEFAULT false,
	"helpful_count" integer DEFAULT 0,
	"is_verified" boolean DEFAULT false
);
--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;