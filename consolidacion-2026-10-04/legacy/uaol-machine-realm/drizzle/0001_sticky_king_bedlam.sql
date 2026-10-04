CREATE TABLE `agent_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`intent` text NOT NULL,
	`status` enum('draft','planning','simulating','observing','verifying','closed','blocked') NOT NULL DEFAULT 'draft',
	`riskLevel` enum('low','medium','high','critical') NOT NULL DEFAULT 'low',
	`executionMode` enum('manual','autonomous') NOT NULL DEFAULT 'manual',
	`simulationOnly` boolean NOT NULL DEFAULT true,
	`planJson` json,
	`summary` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`closedAt` timestamp,
	CONSTRAINT `agent_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `protocol_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`machineId` int,
	`taskId` int,
	`protocol` enum('mqtt','opcua','modbus') NOT NULL,
	`direction` enum('publish','subscribe','command','response','event') NOT NULL,
	`channel` varchar(255) NOT NULL,
	`payloadJson` json NOT NULL,
	`status` enum('simulated','blocked','verified') NOT NULL DEFAULT 'simulated',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `protocol_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `realm_machines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`machineKey` varchar(64) NOT NULL,
	`name` varchar(160) NOT NULL,
	`area` varchar(120) NOT NULL,
	`state` enum('idle','calibrating','operating','maintenance','stopped','emergency') NOT NULL DEFAULT 'idle',
	`operationMode` enum('manual','autonomous') NOT NULL DEFAULT 'manual',
	`sensorsJson` json,
	`actuatorsJson` json,
	`setpointsJson` json,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `realm_machines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `simulated_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`machineId` int,
	`severity` enum('info','warning','critical') NOT NULL DEFAULT 'info',
	`status` enum('active','acknowledged','resolved') NOT NULL DEFAULT 'active',
	`title` varchar(180) NOT NULL,
	`description` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `simulated_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `simulator_configurations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`scenarioName` varchar(160) NOT NULL,
	`scenarioJson` json NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `simulator_configurations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `task_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`stage` enum('intent','planning','execution','observation','verification','closure') NOT NULL,
	`outcome` enum('info','success','warning','failure','blocked') NOT NULL DEFAULT 'info',
	`message` text NOT NULL,
	`evidenceJson` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `task_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `telemetry_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`machineId` int NOT NULL,
	`temperature` int NOT NULL,
	`pressure` int NOT NULL,
	`vibration` int NOT NULL,
	`energy` int NOT NULL,
	`quality` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `telemetry_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `validation_ledger` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`taskId` int,
	`machineId` int,
	`category` enum('agent','machine','protocol','security') NOT NULL,
	`action` varchar(180) NOT NULL,
	`riskLevel` enum('low','medium','high','critical') NOT NULL,
	`permissionDecision` enum('allowed','confirmation_required','blocked') NOT NULL,
	`verificationStatus` enum('pending','passed','failed','not_applicable') NOT NULL,
	`reason` text NOT NULL,
	`evidenceJson` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `validation_ledger_id` PRIMARY KEY(`id`)
);
