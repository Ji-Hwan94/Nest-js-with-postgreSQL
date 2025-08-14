import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateBoardDto {
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  description: string;

  @IsOptional()
  fileName?: string;

  @IsOptional()
  filePath?: string;

  @IsOptional()
  fileSize?: number;
}
