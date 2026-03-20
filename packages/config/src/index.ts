export const VERSION = "0.0.1";

export interface EikonConfig {
  name: string;
  version: string;
  debug?: boolean;
}

export function defineConfig(config: EikonConfig): EikonConfig {
  return {
    debug: false,
    ...config,
  };
}
