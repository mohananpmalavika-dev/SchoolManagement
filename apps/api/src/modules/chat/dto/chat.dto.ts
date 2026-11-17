import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsUUID,
  MaxLength,
  MinLength,
  ArrayMaxSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ChannelType {
  DIRECT = 'DIRECT',
  GROUP = 'GROUP',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  CLASS = 'CLASS',
}

export class CreateChannelDto {
  @ApiProperty({ description: 'Name of the channel' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Channel description' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ enum: ChannelType, default: ChannelType.GROUP })
  @IsEnum(ChannelType)
  @IsOptional()
  type?: ChannelType = ChannelType.GROUP;

  @ApiPropertyOptional({ description: 'Associated class ID if class channel' })
  @IsUUID()
  @IsOptional()
  classId?: string;

  @ApiPropertyOptional({ description: 'Initial member user IDs', type: [String] })
  @IsArray()
  @IsOptional()
  @ArrayMaxSize(500)
  @IsUUID('all', { each: true })
  memberUserIds?: string[];
}

export class SendChatMessageDto {
  @ApiProperty({ description: 'Message body text' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(5000)
  content: string;

  @ApiPropertyOptional({ description: 'File attachments list' })
  @IsArray()
  @IsOptional()
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    size?: number;
  }>;

  @ApiPropertyOptional({ description: 'Replying to another message ID' })
  @IsUUID()
  @IsOptional()
  replyToId?: string;
}

export class AddReactionDto {
  @ApiProperty({ description: 'Emoji reaction character' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  emoji: string;
}

export class DirectChatDto {
  @ApiProperty({ description: 'Target user ID to chat with' })
  @IsUUID()
  @IsNotEmpty()
  targetUserId: string;

  @ApiPropertyOptional({ description: 'Initial message content' })
  @IsString()
  @IsOptional()
  @MaxLength(5000)
  initialMessage?: string;
}
