import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import type { Response } from 'express';
import { createReadStream } from 'fs';
import { join } from 'path';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { BoardStatusValidationPipe } from './pipes/board-status-validation.pipe';
import { Board } from './board.entity';
import { BoardStatus } from './board-status.enum';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/get-user.decorator';
import { User } from 'src/auth/user.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import multer from 'multer';

@Controller('boards')
@UseGuards(AuthGuard())
export class BoardsController {
  private logger = new Logger('BoardsController');
  constructor(private boardsService: BoardsService) {}

  // @Get()
  // getAllBoards(): Promise<Board[]> {
  //   return this.boardsService.getAllBoards();
  // }

  @Get()
  getAllBoards(@GetUser() user: User): Promise<Board[]> {
    this.logger.verbose(`User ${user.username} trying to get all boards`);
    return this.boardsService.getAllBoards(user);
  }

  @Get('/:id')
  getBoardById(@Param('id') id: number): Promise<Board> {
    return this.boardsService.getBoardById(id);
  }

  /**
   * 게시글과 파일을 함께 생성하는 API
   * - 실무에서 가장 일반적인 파일 업로드 패턴
   * - Multer의 diskStorage를 사용하여 로컬 파일 시스템에 저장
   * - 파일명 중복 방지를 위한 고유 접미사 추가
   * - 한글 파일명 지원을 위한 인코딩 처리
   */
  @Post()
  @UsePipes(ValidationPipe)
  @UseInterceptors(
    FileInterceptor('file', {
      // Multer의 diskStorage: 실무에서 표준으로 사용되는 로컬 파일 저장 방식
      storage: multer.diskStorage({
        // 파일 저장 경로 설정 (실무에서는 보통 환경변수로 관리)
        destination: './uploads',
        filename: (req, file, cb) => {
          // 파일명 중복 방지: 타임스탬프 + 랜덤값 조합 (실무 표준 패턴)
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1000);

          // 한글 파일명 처리: 가장 안전한 방식으로 처리
          // 파일 시스템에서 안전한 ASCII 파일명으로 저장하고, 원본명은 DB에 따로 저장
          const uploadFileName = `${uniqueSuffix}.${file.originalname.split('.').pop()}`;
          cb(null, uploadFileName);
        },
      }),
    }),
  )
  createBoard(
    @Body() createBoardDto: CreateBoardDto,
    @UploadedFile() file: Express.Multer.File, // Multer가 처리한 파일 정보
    @GetUser() user: User,
  ): Promise<Board> {
    this.logger.verbose(
      `User ${user.username} creating a new board. Data: ${JSON.stringify(
        createBoardDto,
      )}`,
    );

    // 파일 업로드 성공 로그 (실무에서 디버깅/모니터링용으로 필수)
    file && this.logger.log(`file ${file.originalname} saved to ${file.path}`);
    return this.boardsService.createBoard(createBoardDto, user, file);
  }

  @Patch('/:id/status')
  updateBoardStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status', BoardStatusValidationPipe) status: BoardStatus,
  ): Promise<Board> {
    return this.boardsService.updateBoardStatus(id, status);
  }

  /**
   * 게시글과 파일을 함께 수정하는 API
   * - createBoard와 동일한 파일 업로드 패턴 적용
   * - 기존 파일이 있으면 삭제하고 새 파일로 교체
   * - 파일이 없으면 텍스트만 수정
   */
  @Patch('/:id')
  @UsePipes(ValidationPipe)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1000);
          const uploadFileName = `${uniqueSuffix}.${file.originalname.split('.').pop()}`;
          cb(null, uploadFileName);
        },
      }),
    }),
  )
  updateBoard(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBoardDto: CreateBoardDto,
    @GetUser() user: User,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<Board> {
    this.logger.verbose(
      `User ${user.username} updating board ${id}. Data: ${JSON.stringify(
        updateBoardDto,
      )}`,
    );

    if (file) {
      this.logger.log(`New file ${file.originalname} uploaded for board ${id}`);
    }

    return this.boardsService.updateBoard(id, updateBoardDto, user, file);
  }

  /**
   * 게시글 삭제 엔드포인트
   * - Controller는 HTTP 요청/응답만 처리
   * - 비즈니스 로직은 Service에서 처리
   */
  @Delete('/:id')
  deleteBoardById(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
  ): Promise<void> {
    return this.boardsService.deleteBoard(id, user);
  }

  /**
   * 파일 다운로드 엔드포인트
   * - 실무에서 표준적인 파일 다운로드 구현 패턴
   * - 보안을 위해 직접 파일 경로 노출하지 않고 boardId를 통해 접근
   * - 원본 파일명으로 다운로드되도록 Content-Disposition 헤더 설정
   */
  @Get('/files/:boardId')
  async downloadFile(
    @Param('boardId', ParseIntPipe) boardId: number,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    // Repository에서 파일 정보 조회
    const fileInfo = await this.boardsService.getFileInfo(boardId);

    // 파일 스트림 생성
    const file = createReadStream(join(process.cwd(), fileInfo.filePath));

    // 한글 파일명을 위한 Content-Disposition 헤더 설정 (실무 필수)
    const encodedFileName = encodeURIComponent(fileInfo.fileName);
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodedFileName}`,
    });

    return new StreamableFile(file);
  }

  // @Get()
  // getAllBoard(): Board[] {
  //   return this.boardsService.getAllBoards();
  // }

  // @Post()
  // @UsePipes(ValidationPipe)
  // createBoard(@Body() createBoardDto: CreateBoardDto): Board {
  //   return this.boardsService.createBoard(createBoardDto);
  // }

  // @Get('/:id')
  // getBoardById(@Param('id') id: string): Board {
  //   return this.boardsService.getBoardById(id);
  // }

  // @Delete('/:id')
  // deleteBoardById(@Param('id') id: string): void {
  //   this.boardsService.deleteBoardById(id);
  // }

  // @Patch('/:id/status')
  // updateBoardStatus(
  //   @Param('id') id: string,
  //   @Body('status', BoardStatusValidationPipe) status: BoardStatus,
  // ): Board {
  //   return this.boardsService.updateBoardStatus(id, status);
  // }
}
