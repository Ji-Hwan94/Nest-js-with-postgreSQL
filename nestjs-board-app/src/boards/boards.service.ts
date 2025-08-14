import { Injectable, Logger } from '@nestjs/common';
import { CreateBoardDto } from './dto/create-board.dto';
import { BoardRepository } from './board.respository';
import { Board } from './board.entity';
import { BoardStatus } from './board-status.enum';
import { User } from 'src/auth/user.entity';
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';

@Injectable()
export class BoardsService {
  private logger = new Logger('BoardsService');
  constructor(private boardRepository: BoardRepository) {}

  // async getAllBoards(): Promise<Board[]> {
  //   return await this.boardRepository.findAll();
  // }

  async getAllBoards(user: User): Promise<Board[]> {
    return await this.boardRepository.findAll(user);
  }

  async getBoardById(id: number): Promise<Board> {
    return await this.boardRepository.getBoardById(id);
  }

  async createBoard(
    createBoardDto: CreateBoardDto,
    user: User,
    file: Express.Multer.File,
  ): Promise<Board> {
    return await this.boardRepository.createBoard(createBoardDto, user, file);
  }

  async updateBoardStatus(id: number, status: BoardStatus): Promise<Board> {
    return await this.boardRepository.updateBoardStatus(id, status);
  }

  /**
   * 게시글과 파일을 함께 수정하는 비즈니스 로직
   * - Service에서 파일 처리 로직 담당 (비즈니스 로직)
   * - Repository는 순수 데이터베이스 업데이트만 담당
   */
  async updateBoard(
    id: number,
    updateBoardDto: CreateBoardDto,
    user: User,
    file?: Express.Multer.File,
  ): Promise<Board> {
    let fileData:
      | { fileName: string; filePath: string; fileSize: number }
      | undefined;

    // 새 파일이 업로드된 경우 기존 파일 삭제 및 새 파일 정보 처리
    if (file) {
      try {
        // 기존 파일 정보 조회 및 삭제
        const existingFileInfo = await this.boardRepository.getFileInfo(id);
        if (existingFileInfo.filePath) {
          const oldFilePath = join(process.cwd(), existingFileInfo.filePath);
          if (existsSync(oldFilePath)) {
            unlinkSync(oldFilePath);
            this.logger.log(`Old file deleted: ${existingFileInfo.fileName}`);
          }
        }
      } catch (error) {
        // 기존 파일이 없는 경우는 정상 (새로 파일 추가하는 케이스)
        if (!error.message.includes('File not found')) {
          throw error;
        }
      }
      // 새 파일 정보 처리
      const decodedFileName = Buffer.from(file.originalname, 'latin1').toString(
        'utf8',
      );
      fileData = {
        fileName: decodedFileName,
        filePath: file.path,
        fileSize: file.size,
      };
    }

    // Repository를 통해 데이터베이스 업데이트
    return await this.boardRepository.updateBoard(
      id,
      updateBoardDto,
      user,
      fileData,
    );
  }

  /**
   * 게시글과 관련 파일을 함께 삭제하는 비즈니스 로직
   * - Service 계층에서 파일 삭제 로직 처리 (Controller에서 분리)
   * - 실무에서 표준적인 아키텍처 패턴
   */
  async deleteBoard(id: number, user: User): Promise<void> {
    // 삭제 전에 파일 정보 조회 (삭제 후에는 조회 불가)
    try {
      const fileInfo = await this.boardRepository.getFileInfo(id);

      // 게시글 삭제 (DB에서)
      await this.boardRepository.deleteBoard(id, user);

      // 파일이 존재하면 물리적 파일 삭제
      if (fileInfo.filePath) {
        const fullPath = join(process.cwd(), fileInfo.filePath);
        if (existsSync(fullPath)) {
          unlinkSync(fullPath);
          this.logger.log(
            `File deleted: ${fileInfo.fileName} at ${fileInfo.filePath}`,
          );
        }
      }
    } catch (error) {
      // 파일이 없는 게시글이거나 이미 삭제된 경우 게시글만 삭제
      if (error.message.includes('File not found')) {
        await this.boardRepository.deleteBoard(id, user);
      } else {
        throw error;
      }
    }
  }

  /**
   * 파일 다운로드를 위한 파일 정보 조회
   * - 실무에서 표준적인 파일 다운로드 서비스 패턴
   * - Repository 계층을 통해 데이터 접근
   */
  async getFileInfo(
    boardId: number,
  ): Promise<{ fileName: string; filePath: string }> {
    return await this.boardRepository.getFileInfo(boardId);
  }

  // private boards: Board[] = [];
  // getAllBoards(): Board[] {
  //   return this.boards;
  // }
  // createBoard(createBoardDto: CreateBoardDto) {
  //   const board: Board = {
  //     ...createBoardDto,
  //     id: randomUUID(),
  //     status: BoardStatus.PUBLIC,
  //   };
  //   this.boards.push(board);
  //   return board;
  // }
  // getBoardById(id: string): Board {
  //   const found = this.boards.find((board) => board.id === id);
  //   if (!found) {
  //     throw new NotFoundException('Board not found');
  //   }
  //   return found;
  // }
  // deleteBoardById(id: string): void {
  //   const found = this.getBoardById(id);
  //   this.boards = this.boards.filter((board) => board.id !== found.id);
  // }
  // updateBoardStatus(id: string, status: BoardStatus): Board {
  //   const board = this.getBoardById(id);
  //   if (!board) {
  //     throw new NotFoundException('Board not found');
  //   }
  //   board.status = status;
  //   return board;
  // }
}
