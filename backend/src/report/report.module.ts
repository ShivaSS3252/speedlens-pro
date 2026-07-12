import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Report, ReportSchema } from './report.schema';
import { ReportService } from './report.service';
import { ReportResolver } from './report.resolver';
import { HistoryModule } from '../history/history.module';
import { LighthouseModule } from '../lighthouse/lighthouse.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Report.name, schema: ReportSchema }]),
    HistoryModule,
    LighthouseModule,
    AiModule,
  ],
  providers: [ReportService, ReportResolver],
})
export class ReportModule {}
