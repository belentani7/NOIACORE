CREATE TABLE `auditLog` (
	`sequence` int AUTO_INCREMENT NOT NULL,
	`eventHash` varchar(64) NOT NULL,
	`previousHash` varchar(64),
	`actorUserId` int,
	`actorRole` varchar(32) NOT NULL,
	`commandId` varchar(64),
	`node` enum('policy','risk','human','system') NOT NULL,
	`decision` varchar(32) NOT NULL,
	`reason` text NOT NULL,
	`metadata` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLog_sequence` PRIMARY KEY(`sequence`),
	CONSTRAINT `auditLog_eventHash_unique` UNIQUE(`eventHash`)
);
--> statement-breakpoint
CREATE TABLE `commandValidations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`commandId` varchar(64) NOT NULL,
	`node` enum('policy','risk','human') NOT NULL,
	`decision` enum('allow','block','approved','rejected','expired') NOT NULL,
	`reason` text NOT NULL,
	`evidence` json NOT NULL,
	`validatedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `commandValidations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `machineAlarms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`machineId` int NOT NULL,
	`code` varchar(64) NOT NULL,
	`severity` enum('info','warning','critical') NOT NULL,
	`status` enum('active','acknowledged','cleared') NOT NULL DEFAULT 'active',
	`message` text NOT NULL,
	`raisedAt` timestamp NOT NULL DEFAULT (now()),
	`clearedAt` timestamp,
	CONSTRAINT `machineAlarms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `machineCommands` (
	`id` int AUTO_INCREMENT NOT NULL,
	`commandId` varchar(64) NOT NULL,
	`machineId` int NOT NULL,
	`requestedByUserId` int NOT NULL,
	`type` enum('start','stop','pause','resume','reset','enter_maintenance','exit_maintenance','acknowledge_alarm','emergency_stop_simulation') NOT NULL,
	`status` enum('requested','policy_rejected','risk_rejected','awaiting_human','human_rejected','expired','authorized','executing','executed','failed') NOT NULL DEFAULT 'requested',
	`idempotencyKey` varchar(128) NOT NULL,
	`isTestMode` int NOT NULL DEFAULT 1,
	`policyVersion` varchar(32) NOT NULL,
	`riskSnapshot` json NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `machineCommands_id` PRIMARY KEY(`id`),
	CONSTRAINT `machineCommands_commandId_unique` UNIQUE(`commandId`),
	CONSTRAINT `machine_commands_idempotency_unique` UNIQUE(`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `machineEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`machineId` int NOT NULL,
	`commandId` varchar(64),
	`eventType` varchar(96) NOT NULL,
	`payload` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `machineEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `machineTelemetry` (
	`id` int AUTO_INCREMENT NOT NULL,
	`machineId` int NOT NULL,
	`state` enum('stopped','calibrating','operating','maintenance','emergency') NOT NULL,
	`temperature` decimal(7,2) NOT NULL,
	`pressure` decimal(7,2) NOT NULL,
	`load` decimal(6,2) NOT NULL,
	`speed` decimal(7,2) NOT NULL,
	`power` decimal(7,2) NOT NULL,
	`latencyMs` int NOT NULL,
	`capturedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `machineTelemetry_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `simulatedMachines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`machineKey` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`mode` enum('simulation') NOT NULL DEFAULT 'simulation',
	`state` enum('stopped','calibrating','operating','maintenance','emergency') NOT NULL DEFAULT 'stopped',
	`cycleCount` int NOT NULL DEFAULT 0,
	`operationStartedAt` timestamp,
	`lastHeartbeatAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `simulatedMachines_id` PRIMARY KEY(`id`),
	CONSTRAINT `simulatedMachines_machineKey_unique` UNIQUE(`machineKey`),
	CONSTRAINT `simulated_machines_key_unique` UNIQUE(`machineKey`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `operationRole` enum('observer','operator','approver','policy_admin') DEFAULT 'observer' NOT NULL;--> statement-breakpoint
CREATE INDEX `audit_log_command_created_idx` ON `auditLog` (`commandId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `command_validations_command_idx` ON `commandValidations` (`commandId`);--> statement-breakpoint
CREATE INDEX `machine_alarms_machine_status_idx` ON `machineAlarms` (`machineId`,`status`);--> statement-breakpoint
CREATE INDEX `machine_commands_machine_status_idx` ON `machineCommands` (`machineId`,`status`);--> statement-breakpoint
CREATE INDEX `machine_events_machine_created_idx` ON `machineEvents` (`machineId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `machine_telemetry_machine_captured_idx` ON `machineTelemetry` (`machineId`,`capturedAt`);
