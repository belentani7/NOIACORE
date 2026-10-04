ALTER TABLE `gateways` ADD `gatewayTokenHash` varchar(128);--> statement-breakpoint
ALTER TABLE `gateways` ADD `tokenLastRotatedAt` timestamp;