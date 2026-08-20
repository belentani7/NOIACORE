import * as React from "react";
import { cn } from "@/lib/utils";

export type ChartConfig = Record<string, { label?: React.ReactNode; icon?: React.ComponentType; color?: string; theme?: Record<string, string> }>;
type PayloadItem = { dataKey?: string; name?: React.ReactNode; value?: React.ReactNode; color?: string; type?: string; payload?: Record<string, unknown> };
const ChartContext = React.createContext<{ config: ChartConfig }>({ config: {} });
export function useChart(){ return React.useContext(ChartContext); }
export function ChartContainer({ id, config, className, children, ...props }: React.ComponentProps<"div"> & { config: ChartConfig; children?: React.ReactNode }) { return <ChartContext.Provider value={{ config }}><div data-slot="chart" data-chart={id||"model-guard"} className={cn("flex aspect-video justify-center text-xs",className)} {...props}>{children}</div></ChartContext.Provider>; }
export function ChartTooltip(props: React.HTMLAttributes<HTMLDivElement>){ return <div {...props}/>; }
export function ChartTooltipContent({ active, payload, label, className, hideLabel=false, ...props }: React.HTMLAttributes<HTMLDivElement> & { active?: boolean; payload?: PayloadItem[]; label?: React.ReactNode; hideLabel?: boolean }) { if(!active||!payload?.length)return null; return <div className={cn("grid min-w-[8rem] gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",className)} {...props}>{!hideLabel&&label&&<div className="font-medium">{label}</div>}{payload.map((item,index)=><div key={`${item.dataKey||"value"}-${index}`} className="flex items-center justify-between gap-3"><span>{item.name||item.dataKey}</span><span className="font-mono">{String(item.value??"")}</span></div>)}</div>; }
export function ChartLegend(props: React.HTMLAttributes<HTMLDivElement>){ return <div {...props}/>; }
export function ChartLegendContent({ payload, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { payload?: PayloadItem[] }) { if(!payload?.length)return null; return <div className={cn("flex flex-wrap items-center justify-center gap-4",className)} {...props}>{payload.filter(item=>item.type!=="none").map((item,index)=><span key={`${item.dataKey||"value"}-${index}`} className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{backgroundColor:item.color}} />{item.name||item.dataKey}</span>)}</div>; }
export function ChartStyle(){ return null; }
