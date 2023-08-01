import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { Response } from 'express';
import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';
import { IncomingMessage } from 'http';
const publicKey = fs.readFileSync('./src/config/jwtRS256.key.pub', 'utf8');
@Injectable()
export class AppMiddleware implements NestMiddleware {
  use(req: IncomingMessage, res: Response, next: any) {
    try {
      if (
        !req.url.includes('/login') &&
        !req.url.includes('/refresh-token') &&
        !req.url.includes('/public')
      ) {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, publicKey, {
          algorithms: ['RS256'],
        });
        const { userRole } = decoded;
        if (userRole == 'NORMAL' && req.method != 'GET') {
          res
            .status(HttpStatus.UNAUTHORIZED)
            .send({ message: 'You have not permission' });
        } else if (req.url.includes('/admin') && userRole == 'ADMIN') {
          res
            .status(HttpStatus.UNAUTHORIZED)
            .send({ message: 'You have not permission' });
        } else if (
          userRole == 'CLINIC' &&
          !req.url.includes('/clinic') &&
          !req.url.includes('/profile') &&
          !req.url.includes('/client/get')
        ) {
          res
            .status(HttpStatus.UNAUTHORIZED)
            .send({ message: 'You have not permission' });
        } else {
          next();
        }
      } else {
        next();
      }
    } catch (error) {
      res.status(HttpStatus.FORBIDDEN).send({ message: 'Token Expired' });
    }
  }
}
