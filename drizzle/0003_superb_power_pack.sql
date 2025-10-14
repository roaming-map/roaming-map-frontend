CREATE TABLE "questions_to_categories" (
	"question_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	CONSTRAINT "questions_to_categories_question_id_category_id_pk" PRIMARY KEY("question_id","category_id")
);
--> statement-breakpoint
ALTER TABLE "questions_to_categories" ADD CONSTRAINT "questions_to_categories_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions_to_categories" ADD CONSTRAINT "questions_to_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;