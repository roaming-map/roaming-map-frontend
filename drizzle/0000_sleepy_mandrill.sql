CREATE TABLE "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"is_urgent" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"created_by" integer
);
