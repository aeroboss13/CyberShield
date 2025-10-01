CREATE TABLE "cve_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"cve_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"cvss_score" numeric,
	"severity" text NOT NULL,
	"vendor" text,
	"published_date" text,
	"updated_date" text,
	"tags" text[] DEFAULT '{}',
	"actively_exploited" boolean DEFAULT false,
	"edb_id" text,
	"references" text,
	CONSTRAINT "cve_entries_cve_id_unique" UNIQUE("cve_id")
);
--> statement-breakpoint
CREATE TABLE "exploits" (
	"id" serial PRIMARY KEY NOT NULL,
	"cve_id" text NOT NULL,
	"exploit_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"exploit_type" text NOT NULL,
	"platform" text NOT NULL,
	"verified" boolean DEFAULT false,
	"date_published" text NOT NULL,
	"author" text NOT NULL,
	"source_url" text NOT NULL,
	"exploit_code" text,
	"source" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mitre_attack" (
	"id" serial PRIMARY KEY NOT NULL,
	"tactic_id" text NOT NULL,
	"tactic_name" text NOT NULL,
	"tactic_description" text NOT NULL,
	"technique_id" text NOT NULL,
	"technique_name" text NOT NULL,
	"technique_description" text
);
--> statement-breakpoint
CREATE TABLE "news_articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"content" text,
	"source" text NOT NULL,
	"image_url" text,
	"link" text,
	"tags" text[] DEFAULT '{}',
	"published_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "news_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"article_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news_likes" (
	"id" serial PRIMARY KEY NOT NULL,
	"article_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"related_id" integer,
	"related_type" text,
	"from_user_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_likes" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"content" text NOT NULL,
	"tags" text[] DEFAULT '{}',
	"attachments" text[] DEFAULT '{}' NOT NULL,
	"likes" integer DEFAULT 0,
	"comments" integer DEFAULT 0,
	"shares" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"severity" text,
	"category" text NOT NULL,
	"tags" text[] DEFAULT '{}',
	"affected_software" text,
	"versions" text,
	"cvss_score" numeric,
	"platform" text,
	"exploit_type" text,
	"exploit_code" text,
	"target_cve" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"verified" boolean DEFAULT false,
	"review_notes" text,
	"reviewed_by" integer,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"job_title" text,
	"avatar" text,
	"bio" text,
	"location" text,
	"website" text,
	"reputation" integer DEFAULT 0,
	"post_count" integer DEFAULT 0,
	"likes_received" integer DEFAULT 0,
	"comments_count" integer DEFAULT 0,
	"cve_submissions" integer DEFAULT 0,
	"exploit_submissions" integer DEFAULT 0,
	"verified_submissions" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "news_comments" ADD CONSTRAINT "news_comments_article_id_news_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."news_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_comments" ADD CONSTRAINT "news_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_likes" ADD CONSTRAINT "news_likes_article_id_news_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."news_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_likes" ADD CONSTRAINT "news_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_submissions" ADD CONSTRAINT "user_submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_submissions" ADD CONSTRAINT "user_submissions_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;