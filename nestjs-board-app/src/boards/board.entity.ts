import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  ManyToOne,
} from 'typeorm';
import { BoardStatus } from './board-status.enum';
import { User } from 'src/auth/user.entity';

@Entity()
export class Board extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  status: BoardStatus;

  // 파일 업로드 관련 필드들
  // 실무에서 표준적인 파일 메타데이터 저장 패턴
  
  @Column({ nullable: true })
  fileName?: string;    // 원본 파일명 (사용자에게 표시, 다운로드 시 사용)

  @Column({ nullable: true })  
  filePath?: string;    // 서버에 저장된 실제 파일 경로 (보안상 외부 노출 금지)

  @Column({ nullable: true })
  fileSize?: number;    // 파일 크기 (바이트 단위, UI 표시 및 업로드 제한 검사용)

  @ManyToOne((type) => User, (user) => user.boards, { eager: false })
  user: User;
}
