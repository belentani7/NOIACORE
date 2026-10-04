CREATE TABLE `access_audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`role` varchar(32) NOT NULL,
	`action` varchar(180) NOT NULL,
	`origin` varchar(180),
	`metadataJson` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `access_audit_logs_id` PRIMARY KEY(`id`)
);
