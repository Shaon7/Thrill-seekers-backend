import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerController } from './player.controller.js';
import { PlayerService } from './player.service.js';
import { Player } from './player.entity.js';
import { AuthModule } from '../auth/auth.module.js';
import { MailModule } from '../mail/mail.module.js';

@Module({
    imports:[
        AuthModule,
        MailModule,
        TypeOrmModule.forFeature([Player])],
    controllers:[PlayerController],
    providers:[PlayerService]
})
export class PlayerModule {

}
