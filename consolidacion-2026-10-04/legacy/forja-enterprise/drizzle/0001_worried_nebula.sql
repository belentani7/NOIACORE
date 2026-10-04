CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`actorId` varchar(120) NOT NULL,
	`actorType` enum('HUMAN','AI_AGENT') NOT NULL,
	`action` enum('PLAN_GENERATED','TOOL_EXECUTED','WAL_COMMITTED','ROLLBACK_TRIGGERED','SANDBOX_TRAPPED') NOT NULL,
	`targetFiles` json NOT NULL,
	`walHash` varchar(128) NOT NULL,
	`prevHash` varchar(128),
	`signature` varchar(256) NOT NULL,
	`signatureStatus` enum('VERIFIED','PENDING','INVALID') NOT NULL DEFAULT 'VERIFIED',
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `graph_edges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`fromNodeId` int NOT NULL,
	`toNodeId` int NOT NULL,
	`relationType` varchar(70) NOT NULL,
	`weight` float NOT NULL DEFAULT 1,
	CONSTRAINT `graph_edges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `graph_nodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`label` varchar(180) NOT NULL,
	`language` varchar(40) NOT NULL,
	`symbolType` varchar(60) NOT NULL,
	`x` float NOT NULL,
	`y` float NOT NULL,
	`embeddingState` enum('ENCRYPTED','SYNCING','LOCAL_ONLY') NOT NULL DEFAULT 'ENCRYPTED',
	CONSTRAINT `graph_nodes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`slug` varchar(120) NOT NULL,
	`plan` enum('FREE','TEAM','ENTERPRISE','FEDRAMP') NOT NULL DEFAULT 'ENTERPRISE',
	`e2eePublicKey` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organizations_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `plugins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`version` varchar(40) NOT NULL,
	`wasmDigest` varchar(128) NOT NULL,
	`status` enum('VERIFIED','QUARANTINED','REVOKED') NOT NULL DEFAULT 'VERIFIED',
	`enabled` boolean NOT NULL DEFAULT true,
	`capabilities` json NOT NULL,
	`sigstoreBundle` text NOT NULL,
	`signer` varchar(160) NOT NULL,
	`verifiedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `plugins_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rbac_policies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`role` enum('junior_dev','senior_dev','ciso','admin') NOT NULL,
	`resource` varchar(160) NOT NULL,
	`effect` enum('ALLOW','REQUIRE_HUMAN_APPROVAL','DENY') NOT NULL,
	`conditions` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rbac_policies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `refactor_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`sourceLanguage` varchar(30) NOT NULL,
	`targetLanguage` varchar(30) NOT NULL,
	`totalFiles` int NOT NULL,
	`processedFiles` int NOT NULL DEFAULT 0,
	`status` enum('PENDING','RUNNING','COMMITTED','ROLLED_BACK') NOT NULL DEFAULT 'PENDING',
	`progress` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`startedAt` timestamp,
	`finishedAt` timestamp,
	CONSTRAINT `refactor_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `security_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`eventType` enum('PROMPT_INJECTION','SANDBOX_VIOLATION','SECRET_DETECTED') NOT NULL,
	`severity` enum('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL,
	`source` varchar(240) NOT NULL,
	`actionTaken` varchar(240) NOT NULL,
	`resolved` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `security_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `token_usage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`model` varchar(100) NOT NULL,
	`promptTokens` int NOT NULL DEFAULT 0,
	`completionTokens` int NOT NULL DEFAULT 0,
	`totalTokens` int NOT NULL DEFAULT 0,
	`costUsd` decimal(10,4) NOT NULL DEFAULT '0',
	`durationMs` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `token_usage_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tool_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`toolName` varchar(160) NOT NULL,
	`calls` int NOT NULL DEFAULT 0,
	`avgLatencyMs` int NOT NULL DEFAULT 0,
	`rollbackRate` float NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tool_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trusted_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`keyName` varchar(160) NOT NULL,
	`fingerprint` varchar(128) NOT NULL,
	`issuer` varchar(160) NOT NULL,
	`publicKey` text NOT NULL,
	`status` enum('ACTIVE','REVOKED') NOT NULL DEFAULT 'ACTIVE',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`revokedAt` timestamp,
	CONSTRAINT `trusted_keys_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wal_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int NOT NULL,
	`operationType` enum('CREATE','UPDATE','DELETE','RENAME') NOT NULL,
	`filePath` varchar(500) NOT NULL,
	`beforeHash` varchar(128),
	`afterHash` varchar(128),
	`status` enum('PENDING','APPLIED','ROLLED_BACK') NOT NULL DEFAULT 'PENDING',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wal_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workspace_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('junior_dev','senior_dev','ciso','admin') NOT NULL,
	`status` enum('ACTIVE','INVITED','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
	`invitedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workspace_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`repoName` varchar(200) NOT NULL,
	`syncStatus` enum('SYNCED','SYNCING','DEGRADED','OFFLINE') NOT NULL DEFAULT 'SYNCED',
	`vectorClock` json NOT NULL,
	`crdtPeers` int NOT NULL DEFAULT 0,
	`lastSyncAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workspaces_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `audit_logs_org_time_idx` ON `audit_logs` (`orgId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `audit_logs_hash_idx` ON `audit_logs` (`walHash`);--> statement-breakpoint
CREATE INDEX `organizations_slug_idx` ON `organizations` (`slug`);--> statement-breakpoint
CREATE INDEX `plugins_org_idx` ON `plugins` (`orgId`);--> statement-breakpoint
CREATE INDEX `rbac_policies_org_role_idx` ON `rbac_policies` (`orgId`,`role`);--> statement-breakpoint
CREATE INDEX `security_events_org_time_idx` ON `security_events` (`orgId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `trusted_keys_org_idx` ON `trusted_keys` (`orgId`);--> statement-breakpoint
CREATE INDEX `wal_entries_job_idx` ON `wal_entries` (`jobId`);--> statement-breakpoint
CREATE INDEX `workspace_members_workspace_idx` ON `workspace_members` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `workspaces_org_idx` ON `workspaces` (`orgId`);