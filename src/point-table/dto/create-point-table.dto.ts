import { IsArray, ArrayMinSize, ArrayMaxSize, IsInt } from 'class-validator';
export class CreatePointTableDto {
 @IsInt()
 competitionId: string;
 @IsArray()
 @ArrayMinSize(1)
 @ArrayMaxSize(100)
 @IsInt({ each: true })
 playerIds: string[];
}