import { Request, Response, NextFunction } from 'express';

export type Req = Request & { user?: any };
export type Res = Response;
export type Next = NextFunction;
