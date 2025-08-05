import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import * as crypto from "crypto";
import { RedisService } from "../../../redis/redis.service";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/apps/users/entities/user.entity";
import { Repository } from "typeorm";

@Injectable()
export class EmailVerificationService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly redisService: RedisService) {}

    async generateToken(email: string): Promise<string> {
        const token = crypto.randomBytes(32).toString('hex');
        await this.redisService.set(`email-verification:${token}`, email, { ttl: 3600 }); 
        return token;
    }

    async verifyToken(token: string): Promise< User | null> {
        const record = await this.redisService.get(`email-verification:${token}`);
        if (!record) {
            throw new BadRequestException('Invalid or expired token');
        } 
        const email = record;
        await this.redisService.del(`email-verification:${token}`);

        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return user;
    }
}

