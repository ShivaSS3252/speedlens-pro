import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Report } from './report.schema';
import { HistoryService } from '../history/history.service';
import { LighthouseService } from '../lighthouse/lighthouse.service';
import { StackDetectorService } from '../ai/stack-detector.service';
import { FixGeneratorService } from '../ai/fix-generator.service';

@Injectable()
export class ReportService {
  constructor(
    @InjectModel(Report.name) private reportModel: Model<Report>,
    private historyService: HistoryService,
    private lighthouseService: LighthouseService,
    private stackDetectorService: StackDetectorService,
    private fixGeneratorService: FixGeneratorService,
  ) {}

  async findById(id: string) {
    return this.reportModel.findOne({ id }).lean();
  }

  async getHistory(url: string) {
    return this.historyService.findByUrl(url);
  }

  async analyzeWebsite(url: string) {
    const [lighthouseResult, techStack] = await Promise.all([
      this.lighthouseService.run(url),
      this.stackDetectorService.detect(url),
    ]);

    const report = this.lighthouseService.transform(url, lighthouseResult);
    const createdAt = new Date().toISOString();
    const finalReport = { ...report, techStack, createdAt };

    await new this.reportModel(finalReport).save();
    await this.historyService.create({
      id: finalReport.id,
      url,
      mobileScore: finalReport.mobileScore,
      desktopScore: finalReport.desktopScore,
      createdAt,
    } as any);

    return finalReport;
  }

  async generateFix(title: string, description: string, displayValue: string, techStack: string) {
    return this.fixGeneratorService.generate({ title, description, displayValue }, techStack);
  }
}
