import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
export class MfaSecret extends BaseEntity {
  @Column()
  secret: string;

  @Column({ default: false })
  isEnabled: boolean;

  @Column({ type: 'json', nullable: true })
  backupCodes: string[];

  @Column({ default: 0 })
  backupCodesUsed: number;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ nullable: true })
  lastUsedAt: Date;
}