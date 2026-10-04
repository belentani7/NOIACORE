CREATE TABLE `operational_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`reportKey` varchar(96) NOT NULL,
	`reportType` enum('operational','maintenance','security') NOT NULL DEFAULT 'operational',
	`title` varchar(180) NOT NULL,
	`contentJson` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `operational_reports_id` PRIMARY KEY(`id`),
	CONSTRAINT `operational_reports_reportKey_unique` UNIQUE(`reportKey`)
);
