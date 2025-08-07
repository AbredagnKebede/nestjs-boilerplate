import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { NotFoundError } from 'rxjs';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
    ) {}

    async updateLastLogin(id: string) {
        await this.usersRepository.update(id, {lastLoginAt: new Date()})
    }

    async findByEmail(email: string): Promise<User | null> {
        const user = await this.usersRepository.findOne({where: {email}})
        if(!user) {
            return null;
        }
        return user;
    }
}
