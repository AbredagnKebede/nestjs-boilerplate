import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt } from "passport-jwt";
import { Strategy } from "passport-jwt";
import { UsersService } from "src/apps/users/users.service";
import { JwtBlacklistService } from "../services/jwt-blacklist.service";
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
        private usersService: UsersService,
        private jwtBlacklistService: JwtBlacklistService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('JWT_SECRET')!,
            passReqToCallback: true, // Enable to get request object
        });
    }

    async validate(req: Request, payload: any) {
        try {
            const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
            
            // Check if token is blacklisted
            if (await this.jwtBlacklistService.isTokenBlacklisted(token)) {
                throw new UnauthorizedException('Token has been revoked');
            }

            // Check if user tokens were globally blacklisted after this token was issued
            const tokenIssuedAt = payload.iat * 1000; // Convert to milliseconds
            if (await this.jwtBlacklistService.isUserBlacklisted(payload.sub, tokenIssuedAt)) {
                throw new UnauthorizedException('Token has been revoked');
            }

            const user = await this.usersService.findOne(payload.sub);
            if (!user) {
                throw new UnauthorizedException('User not found');
            }

            return user;    
        } catch(error) {
            throw new UnauthorizedException(error.message || 'Invalid token')
        }
    }
}