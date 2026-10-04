CREATE TABLE `alert_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rejectionThreshold` int NOT NULL DEFAULT 25,
	`ownerEmail` varchar(320) NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`updatedBy` int NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alert_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('critical_policy','rejection_rate','ledger_anomaly','system_health') NOT NULL,
	`severity` enum('info','warning','critical') NOT NULL,
	`title` varchar(220) NOT NULL,
	`message` text NOT NULL,
	`ledgerEntryId` int,
	`acknowledgedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evidence_files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ledgerEntryId` int NOT NULL,
	`filename` varchar(255) NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`sizeBytes` int NOT NULL,
	`storageKey` varchar(500) NOT NULL,
	`storageUrl` text NOT NULL,
	`uploadedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evidence_files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ledger_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` varchar(64) NOT NULL,
	`policyId` int NOT NULL,
	`policyVersion` int NOT NULL,
	`userId` int,
	`inputJson` text NOT NULL,
	`outputJson` text NOT NULL,
	`result` enum('pass','fail') NOT NULL,
	`riskLevel` enum('low','medium','high','critical') NOT NULL DEFAULT 'low',
	`triggeredRulesJson` text NOT NULL,
	`aiAnalysisJson` text,
	`previousHash` varchar(128),
	`entryHash` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ledger_entries_id` PRIMARY KEY(`id`),
	CONSTRAINT `ledger_entries_eventId_unique` UNIQUE(`eventId`)
);
--> statement-breakpoint
CREATE TABLE `policies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`slug` varchar(180) NOT NULL,
	`description` text,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`critical` boolean NOT NULL DEFAULT false,
	`currentVersion` int NOT NULL DEFAULT 1,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `policies_id` PRIMARY KEY(`id`),
	CONSTRAINT `policies_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `policy_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`policyId` int NOT NULL,
	`version` int NOT NULL,
	`rulesJson` text NOT NULL,
	`changeNote` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `policy_versions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scheduled_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`schedule_cron_task_uid` varchar(65),
	`lastRunAt` timestamp,
	`lastStatus` varchar(40),
	`lastSummary` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scheduled_jobs_id` PRIMARY KEY(`id`),
	CONSTRAINT `scheduled_jobs_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE INDEX `alerts_created_idx` ON `alerts` (`createdAt`);--> statement-breakpoint
CREATE INDEX `evidence_ledger_idx` ON `evidence_files` (`ledgerEntryId`);--> statement-breakpoint
CREATE INDEX `ledger_created_idx` ON `ledger_entries` (`createdAt`);--> statement-breakpoint
CREATE INDEX `ledger_policy_idx` ON `ledger_entries` (`policyId`);--> statement-breakpoint
CREATE INDEX `ledger_result_idx` ON `ledger_entries` (`result`);--> statement-breakpoint
CREATE INDEX `policies_status_idx` ON `policies` (`status`);--> statement-breakpoint
CREATE INDEX `policy_versions_policy_idx` ON `policy_versions` (`policyId`);