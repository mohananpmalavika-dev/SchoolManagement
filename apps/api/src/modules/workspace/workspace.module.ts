import {Module} from '@nestjs/common';
import {WorkspaceController} from './workspace.controller';
import {WorkspaceService} from './workspace.service';
import {FeesModule} from '../fees/fees.module';
import {MpesaModule} from '../mpesa/mpesa.module';
import {TimetableModule} from '../timetable/timetable.module';
@Module({imports:[FeesModule,MpesaModule,TimetableModule],controllers:[WorkspaceController],providers:[WorkspaceService]})
export class WorkspaceModule{}
