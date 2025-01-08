CREATE TABLE "group" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"ownerId" text NOT NULL,
	"invitationId" text
);
--> statement-breakpoint
CREATE TABLE "member" (
	"groupId" text NOT NULL,
	"userId" text NOT NULL,
	"nickname" text NOT NULL,
	CONSTRAINT "member_groupId_userId_pk" PRIMARY KEY("groupId","userId")
);
--> statement-breakpoint
CREATE TABLE "preference" (
	"userId" text NOT NULL,
	"defaultGroupId" text NOT NULL,
	CONSTRAINT "preference_userId_defaultGroupId_pk" PRIMARY KEY("userId","defaultGroupId")
);
--> statement-breakpoint
CREATE TABLE "transactionMember" (
	"transactionId" text NOT NULL,
	"groupId" text NOT NULL,
	"userId" text NOT NULL,
	CONSTRAINT "transactionMember_transactionId_groupId_userId_pk" PRIMARY KEY("transactionId","groupId","userId")
);
--> statement-breakpoint
CREATE TABLE "transaction" (
	"id" text PRIMARY KEY NOT NULL,
	"groupId" text NOT NULL,
	"payerId" text NOT NULL,
	"amount" integer NOT NULL,
	"date" text DEFAULT (CURRENT_TIMESTAMP),
	"description" text NOT NULL
);
