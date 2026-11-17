import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import {
  CreateChannelDto,
  SendChatMessageDto,
  AddReactionDto,
  DirectChatDto,
} from './dto/chat.dto';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('channels/:channelId/attachments')
  @UseInterceptors(FileInterceptor('file', {limits:{fileSize:5*1024*1024,files:1,fields:0}}))
  uploadAttachment(@Request() req:any,@Param('channelId') channelId:string,@UploadedFile() file:Express.Multer.File) {
    if(!file)throw new BadRequestException('Choose a file');
    return this.chatService.uploadAttachment(channelId,req.user.tenantId,req.user.id,file);
  }

  @Get('channels')
  @ApiOperation({ summary: 'List all chat channels & conversations for user' })
  async getChannels(@Request() req: any) {
    return this.chatService.getChannels(req.user.id, req.user.tenantId);
  }

  @Post('channels')
  @ApiOperation({ summary: 'Create a new group or class channel' })
  async createChannel(@Request() req: any, @Body() dto: CreateChannelDto) {
    return this.chatService.createChannel(req.user.id, req.user.tenantId, dto);
  }

  @Get('channels/:channelId/messages')
  @ApiOperation({ summary: 'Get message history for a channel' })
  async getMessages(
    @Request() req: any,
    @Param('channelId') channelId: string,
    @Query('limit') limit?: number,
  ) {
    return this.chatService.getMessages(
      channelId,
      req.user.tenantId,
      req.user.id,
      limit ? Number(limit) : 50,
    );
  }

  @Post('channels/:channelId/messages')
  @ApiOperation({ summary: 'Send a message to a channel' })
  async sendMessage(
    @Request() req: any,
    @Param('channelId') channelId: string,
    @Body() dto: SendChatMessageDto,
  ) {
    return this.chatService.sendMessage(
      channelId,
      req.user.tenantId,
      req.user.id,
      dto,
    );
  }

  @Post('channels/:channelId/messages/:messageId/reactions')
  @ApiOperation({ summary: 'Add or toggle emoji reaction on a message' })
  async addReaction(
    @Request() req: any,
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string,
    @Body() dto: AddReactionDto,
  ) {
    return this.chatService.addReaction(
      channelId,
      messageId,
      req.user.id,
      dto.emoji,
    );
  }

  @Post('direct')
  @ApiOperation({ summary: 'Start or fetch direct conversation with another user' })
  async getOrCreateDirectChat(@Request() req: any, @Body() dto: DirectChatDto) {
    return this.chatService.getOrCreateDirectChannel(
      req.user.tenantId,
      req.user.id,
      dto.targetUserId,
      dto.initialMessage,
    );
  }

  @Get('contacts')
  @ApiOperation({ summary: 'List directory contacts available for direct messaging' })
  async getContacts(@Request() req: any) {
    return this.chatService.getDirectory(req.user.tenantId, req.user.id);
  }
}
