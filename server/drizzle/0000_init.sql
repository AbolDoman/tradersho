CREATE TABLE `expenses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`paid_by_id` integer NOT NULL,
	`paid_for_id` integer NOT NULL,
	`amount_cents` integer NOT NULL,
	`description` text NOT NULL,
	`spent_on` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`paid_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`paid_for_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "expenses_amount_positive" CHECK("expenses"."amount_cents" > 0),
	CONSTRAINT "expenses_distinct_parties" CHECK("expenses"."paid_by_id" <> "expenses"."paid_for_id")
);
--> statement-breakpoint
CREATE INDEX `expenses_spent_on_idx` ON `expenses` (`spent_on`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_name_unique` ON `users` (`name`);