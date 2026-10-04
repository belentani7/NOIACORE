CREATE TABLE `command_executions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`commandId` int NOT NULL,
	`gatewayId` int,
	`attempt` int NOT NULL DEFAULT 1,
	`status` enum('queued','executing','succeeded','failed','timeout','cancelled') NOT NULL DEFAULT 'queued',
	`startedAt` timestamp,
	`finishedAt` timestamp,
	`errorMessage` text,
	`resultJson` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `command_executions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gateway_heartbeats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gatewayId` int NOT NULL,
	`status` enum('online','offline','degraded') NOT NULL,
	`latencyMs` int NOT NULL DEFAULT 0,
	`metadataJson` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gateway_heartbeats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gateways` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`gatewayKey` varchar(96) NOT NULL,
	`name` varchar(160) NOT NULL,
	`status` enum('provisioning','online','offline','degraded','blocked') NOT NULL DEFAULT 'provisioning',
	`operatingMode` enum('simulator','hardware_unconfigured','hardware_authorized') NOT NULL DEFAULT 'simulator',
	`version` varchar(64) NOT NULL DEFAULT 'local-simulator/1.0',
	`lastHeartbeatAt` timestamp,
	`metadataJson` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gateways_id` PRIMARY KEY(`id`),
	CONSTRAINT `gateways_gatewayKey_unique` UNIQUE(`gatewayKey`)
);
--> statement-breakpoint
CREATE TABLE `health_checks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`component` enum('backend','database','gateway','machine','simulator','realtime') NOT NULL,
	`componentKey` varchar(96),
	`status` enum('healthy','degraded','unhealthy') NOT NULL,
	`latencyMs` int NOT NULL DEFAULT 0,
	`detailJson` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `health_checks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `machine_adapter_configurations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`machineId` int NOT NULL,
	`gatewayId` int,
	`adapterKind` enum('simulator','unconfigured','opcua','modbus','mqtt','rest','serial','tcp') NOT NULL DEFAULT 'simulator',
	`lifecycleStatus` enum('active','disabled','awaiting_hardware_approval') NOT NULL DEFAULT 'active',
	`configurationJson` json NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `machine_adapter_configurations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `maintenance_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`machineId` int NOT NULL,
	`status` enum('scheduled','in_progress','completed','cancelled') NOT NULL DEFAULT 'scheduled',
	`title` varchar(180) NOT NULL,
	`notes` text,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `maintenance_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`kind` enum('alert','command','gateway','system') NOT NULL,
	`title` varchar(180) NOT NULL,
	`body` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`metadataJson` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `operation_commands` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`machineId` int NOT NULL,
	`gatewayId` int,
	`commandId` varchar(64) NOT NULL,
	`idempotencyKey` varchar(96) NOT NULL,
	`correlationId` varchar(96) NOT NULL,
	`commandType` enum('start','stop','pause','resume','reset','maintenance','acknowledge_alarm','test','emergency_stop_simulation') NOT NULL,
	`status` enum('requested','validating','approved','queued','executing','succeeded','failed','cancelled','timeout','rejected') NOT NULL DEFAULT 'requested',
	`riskLevel` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`requiresConfirmation` boolean NOT NULL DEFAULT false,
	`confirmedAt` timestamp,
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`payloadJson` json NOT NULL,
	`resultJson` json,
	`errorMessage` text,
	CONSTRAINT `operation_commands_id` PRIMARY KEY(`id`),
	CONSTRAINT `operation_commands_commandId_unique` UNIQUE(`commandId`)
);
--> statement-breakpoint
CREATE TABLE `operational_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`machineId` int,
	`gatewayId` int,
	`commandId` int,
	`eventType` varchar(96) NOT NULL,
	`severity` enum('info','warning','critical') NOT NULL DEFAULT 'info',
	`correlationId` varchar(96),
	`payloadJson` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `operational_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `system_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`settingKey` varchar(120) NOT NULL,
	`valueJson` json NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `system_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `realm_machines` ADD `connectionStatus` enum('connected','disconnected','fault') DEFAULT 'connected' NOT NULL;--> statement-breakpoint
ALTER TABLE `realm_machines` ADD `runtimeSeconds` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `realm_machines` ADD `cycleCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `realm_machines` ADD `currentLoad` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `realm_machines` ADD `currentSpeed` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `telemetry_snapshots` ADD `load` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `telemetry_snapshots` ADD `speed` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `telemetry_snapshots` ADD `cycleCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `telemetry_snapshots` ADD `runtimeSeconds` int DEFAULT 0 NOT NULL;