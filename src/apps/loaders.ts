import type { ComponentType } from "react";
import type { AppId, Variant } from "../registry";

export type AppProps = { variant: Variant };

export const appLoaders: Record<
  AppId,
  () => Promise<{ default: ComponentType<AppProps> }>
> = {
  plano: () => import("./plano/App"),
  pipeline: () => import("./pipeline/App"),
  shopline: () => import("./shopline/App"),
  filebox: () => import("./filebox/App"),
  tripway: () => import("./tripway/App"),
  peoplehub: () => import("./peoplehub/App"),
  metricly: () => import("./metricly/App"),
  mailbird: () => import("./mailbird/App"),
  notely: () => import("./notely/App"),
};
