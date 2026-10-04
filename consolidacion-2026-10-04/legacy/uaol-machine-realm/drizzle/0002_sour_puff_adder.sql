CREATE TABLE `simulation_permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`actionPattern` varchar(180) NOT NULL,
	`scope` varchar(180) NOT NULL,
	`riskLevel` enum('low','medium','high','critical') NOT NULL,
	`decision` enum('allowed','confirmation_required','blocked') NOT NULL,
	`description` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `simulation_permissions_id` PRIMARY KEY(`id`)
);
