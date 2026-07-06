CREATE TABLE "answer_votes" (
	"answer_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	CONSTRAINT "answer_votes_answer_id_user_id_pk" PRIMARY KEY("answer_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "answer_votes" ADD CONSTRAINT "answer_votes_answer_id_answers_id_fk" FOREIGN KEY ("answer_id") REFERENCES "public"."answers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answer_votes" ADD CONSTRAINT "answer_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "answer_votes_answer_id_idx" ON "answer_votes" USING btree ("answer_id");--> statement-breakpoint
CREATE INDEX "answer_votes_user_id_idx" ON "answer_votes" USING btree ("user_id");