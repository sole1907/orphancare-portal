import dynamic from "next/dynamic";
import { ComponentType } from "react";

export function withNoSSR<T>(Component: ComponentType<T>) {
  return dynamic(() => Promise.resolve(Component), { ssr: false });
}
