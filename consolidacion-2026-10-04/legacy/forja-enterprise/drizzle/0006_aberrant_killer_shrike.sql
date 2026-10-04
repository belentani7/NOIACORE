CREATE INDEX `graph_edges_workspace_from_idx` ON `graph_edges` (`workspaceId`,`fromNodeId`);--> statement-breakpoint
CREATE INDEX `graph_edges_workspace_to_idx` ON `graph_edges` (`workspaceId`,`toNodeId`);--> statement-breakpoint
CREATE INDEX `graph_nodes_workspace_idx` ON `graph_nodes` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `refactor_jobs_org_workspace_status_idx` ON `refactor_jobs` (`orgId`,`workspaceId`,`status`);--> statement-breakpoint
CREATE INDEX `token_usage_org_time_idx` ON `token_usage` (`orgId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `tool_metrics_org_tool_idx` ON `tool_metrics` (`orgId`,`toolName`);