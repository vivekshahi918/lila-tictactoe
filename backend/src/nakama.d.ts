declare module "nakama-runtime" {
  export interface Context {}
  export interface Logger {
    info(message: string): void;
  }
  export interface Nakama {}

  export type InitModule = (
    ctx: Context,
    logger: Logger,
    nk: Nakama
  ) => void;
}