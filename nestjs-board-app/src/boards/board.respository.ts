import { Board } from './board.entity';
import { CreateBoardDto } from './dto/create-board.dto';
import { BoardStatus } from './board-status.enum';
import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { User } from 'src/auth/user.entity';

@Injectable()
export class BoardRepository extends Repository<Board> {
  constructor(private dataSource: DataSource) {
    super(Board, dataSource.createEntityManager());
  }

  // async findAll(): Promise<Board[]> {
  //   return this.find();
  // }

  async findAll(user: User): Promise<Board[]> {
    const query = this.createQueryBuilder('board');
    // Board 엔터티의 user 관계를 JOIN하여 User 정보(username 포함)를 함께 조회
    query.leftJoinAndSelect('board.user', 'user');
    query.where('board.userId = :userId', { userId: user.id });

    return await query.getMany();
  }

  // async getBoardById(id: number): Promise<Board> {
  //   const found = await this.findOne({ where: { id } });
  //   if (!found) {
  //     throw new NotFoundException(`Board with id ${id} not found`);
  //   }
  //   return found;
  // }

  async getBoardById(id: number): Promise<Board> {
    const query = this.createQueryBuilder('board');
    query.leftJoin('board.user', 'user');
    query.addSelect([
      'user.username',
      'board.fileName',
      'board.filePath',
      'board.fileSize',
      'user.id',
    ]);
    query.where('board.id = :id', { id });

    const found = await query.getOne();
    if (!found) {
      throw new NotFoundException(`Board with id ${id} not found`);
    }
    return found;
  }

  /**
   * 파일과 함께 게시글을 생성하는 메소드
   * - 실무에서 표준적인 파일 업로드 시 DB 저장 패턴
   * - 파일 메타데이터(이름, 경로, 크기)를 DB에 저장
   * - 실제 파일은 로컬 스토리지에 저장하여 성능 최적화
   */
  async createBoard(
    createBoardDto: CreateBoardDto,
    user: User,
    file: Express.Multer.File,
  ): Promise<Board> {
    // 한글 파일명 디코딩: 가장 안전하고 확실한 방법
    // 실무에서 가장 많이 사용되는 패턴: 원본명 복구
    let decodedFileName = '';

    if (file) {
      decodedFileName = Buffer.from(file.originalname, 'latin1').toString(
        'utf8',
      );
    }

    // 게시글 엔터티 생성: 파일 정보를 함께 저장하는 실무 표준 패턴
    const board = this.create({
      ...createBoardDto,
      status: BoardStatus.PUBLIC,
      user,
      ...(file && {
        fileName: decodedFileName, // DB에 원본 파일명 저장 (사용자에게 표시용)
        filePath: file.path, // 서버 파일 경로 저장 (이제 안전한 ASCII 파일명 사용)
        fileSize: file.size, // 파일 크기 저장 (UI 표시 및 제한 검사용)
      }),
    });

    await this.save(board);
    return board;
  }

  /**
   * 게시글 데이터베이스 업데이트 (순수 데이터 처리)
   * - Repository는 데이터베이스 접근만 담당
   * - 파일 처리 로직은 Service에서 분리
   */
  async updateBoard(
    id: number,
    updateBoardDto: CreateBoardDto,
    user: User,
    fileData?: { fileName: string; filePath: string; fileSize: number },
  ): Promise<Board> {
    // 기존 게시글 조회 및 권한 확인
    const existingBoard = await this.getBoardById(id);
    // 권한 확인 (작성자만 수정 가능)
    if (existingBoard.user.id !== user.id) {
      throw new NotFoundException(
        `Board with id ${id} not found or access denied`,
      );
    }

    // 업데이트할 데이터 준비
    const updateData: Partial<Board> = {
      title: updateBoardDto.title,
      description: updateBoardDto.description,
    };

    // 파일 데이터가 있으면 추가
    if (fileData) {
      updateData.fileName = fileData.fileName;
      updateData.filePath = fileData.filePath;
      updateData.fileSize = fileData.fileSize;
    }

    // 게시글 업데이트
    const query = this.createQueryBuilder('board')
      .update()
      .set(updateData)
      .where('id = :id', { id });

    await query.execute();
    return this.getBoardById(id);
  }

  async updateBoardStatus(id: number, status: BoardStatus): Promise<Board> {
    const board = await this.getBoardById(id);
    board.status = status;
    await this.save(board);
    return board;
  }

  async deleteBoard(id: number, user: User): Promise<void> {
    const result = await this.delete({ id, user });
    if (result.affected === 0) {
      throw new NotFoundException(`Board with id ${id} not found`);
    }
  }

  /**
   * 파일 다운로드를 위한 파일 정보 조회 메소드
   * - 실무에서 파일 다운로드 구현 시 표준 패턴
   * - 보안을 위해 실제 파일 경로는 숨기고 필요한 정보만 반환
   */
  async getFileInfo(
    boardId: number,
  ): Promise<{ fileName: string; filePath: string }> {
    const query = this.createQueryBuilder('board');
    // 파일 관련 정보만 선택적으로 조회 (성능 최적화)
    query.select(['board.fileName', 'board.filePath']);
    query.where('board.id = :id', { id: boardId });

    const board = await query.getOne();
    // 파일 존재 여부 검증 (실무에서 필수적인 에러 처리)
    if (!board || !board.fileName || !board.filePath) {
      throw new NotFoundException(`File not found for board ${boardId}`);
    }

    return {
      fileName: board.fileName, // 사용자에게 표시될 원본 파일명
      filePath: board.filePath, // 서버에서 파일을 찾기 위한 실제 경로
    };
  }
}
