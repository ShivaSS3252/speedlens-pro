import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { ReportService } from './report.service';

@Resolver('Report')
export class ReportResolver {
  constructor(private reportService: ReportService) {}

  @Query('getReport')
  async getReport(@Args('id') id: string) {
    return this.reportService.findById(id);
  }

  @Query('getHistory')
  async getHistory(@Args('url') url: string) {
    return this.reportService.getHistory(url);
  }

  @Mutation('analyzeWebsite')
  async analyzeWebsite(@Args('url') url: string) {
    return this.reportService.analyzeWebsite(url);
  }

  @Mutation('generateFix')
  async generateFix(
    @Args('title') title: string,
    @Args('description') description: string,
    @Args('displayValue') displayValue: string,
    @Args('techStack') techStack: string,
  ) {
    return this.reportService.generateFix(title, description, displayValue, techStack);
  }
}
