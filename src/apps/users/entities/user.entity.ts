import * as bcrypt from "bcrypt";
import { Role } from "src/common/enums/roles.enum";
import { BeforeInsert, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import {BaseEntity } from "src/common/entities/base.entity";

@Entity()
export class User extends BaseEntity { 
    @Column({unique: true})
    email: string;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column({ nullable: true })
    avatarUrl?: string;

    @Column()
    password: string;

    @Column({default: false})
    isEmailVerified: boolean;

    @Column({type: 'enum', enum: Role, default: Role.USER})
    role: Role;

    @Column({type: 'json', nullable: true})
    settings: JSON;

    @Column({ nullable: true })
    lastLoginAt?: Date;

    // Account security fields
    @Column({ default: false })
    isLocked: boolean;

    @Column({ nullable: true })
    lockedAt?: Date;

    @Column({ default: 0 })
    failedLoginAttempts: number;

    @Column({ nullable: true })
    lastFailedLoginAt?: Date;

    // MFA fields
    @Column({ default: false })
    isMfaEnabled: boolean;

    @BeforeInsert()
    @BeforeUpdate()
    async hashPassword() {
        if (this.password && !this.password.match(/^\$2[abxy]\$/)) {
            this.password = await bcrypt.hash(this.password, 10);
        }
    }   

    async validatePassword(password: string): Promise<boolean> {
        return bcrypt.compare(password, this.password);
    }

    get FullName(): string{
        return `${this.firstName} ${this.lastName}`;
    }
}