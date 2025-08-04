import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../apps/users/entities/user.entity';
import { Role } from '../../common/enums/roles.enum';

@Injectable()
export class UserSeeder {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async seed(): Promise<void> {
    const adminExists = await this.userRepository.findOne({
      where: { email: 'admin@example.com' },
    });

    if (!adminExists) {
      const admin = this.userRepository.create({
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        password: 'Admin123!',
        role: Role.ADMIN,
        isEmailVerified: true,
      });

      await this.userRepository.save(admin);
      console.log('Admin user created');
    }

    const userExists = await this.userRepository.findOne({
      where: { email: 'user@example.com' },
    });

    if (!userExists) {
      const user = this.userRepository.create({
        email: 'user@example.com',
        firstName: 'Regular',
        lastName: 'User',
        password: 'User123!',
        role: Role.USER,
        isEmailVerified: true,
      });

      await this.userRepository.save(user);
      console.log('Regular user created');
    }
  }
}