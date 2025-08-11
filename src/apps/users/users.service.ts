import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

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

    async findOne(id: string): Promise<User | null> {
        const user = await this.usersRepository.findOne({where: {id}})
        if (!user) {
            return null;
        }
        return user;
    }

    async create(createUserDto: CreateUserDto): Promise<User> {
        const user = await this.usersRepository.create({
            ...createUserDto
        });
        return this.usersRepository.save(user);
    }

    async update(id: string, updateUserDto: UpdateUserDto) {
        const user = await this.findOne(id);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return this.usersRepository.save({
            ...user,
            ...updateUserDto,
        });
    }
}
