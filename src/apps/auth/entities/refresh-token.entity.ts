import { User } from "src/apps/users/entities/user.entity";
import { BaseEntity, Column, Entity, JoinColumn, ManyToOne } from "typeorm";

@Entity()
export class RefreshToken extends BaseEntity {
    @Column({unique: true})
    token: string;

    @Column({type: 'timestamp'})
    expiresAt: Date;

    @Column({default: false})
    isRevoked: boolean;

    @Column({nullable: true})
    userAgent?: string;

    @Column({nullable: true})
    ipAddress?: string;

    @ManyToOne(() => User, {onDelete: 'CASCADE'})
    @JoinColumn({name: 'userId'})
    user: User;

    @Column({type: 'uuid'})
    userId: string;

    isExpired(): boolean {
        return new Date() > this.expiresAt;
    }
}