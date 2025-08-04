import { BadRequestException, Injectable } from "@nestjs/common";
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
        const token = Math.random().toString(36).substring(2, 15);
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
        return user;
    }
}

